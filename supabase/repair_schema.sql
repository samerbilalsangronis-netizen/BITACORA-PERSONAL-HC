-- Script de reparación general: vuelve a aplicar (de forma segura e
-- idempotente) todas las columnas, índices, RLS y triggers que el código
-- espera en cada tabla, sin tocar filas existentes. Pensado para detectar y
-- corregir tablas que -como pasó con journal_entries- se hayan quedado con
-- un esquema incompleto (creadas a mano o con una migración parcial).
--
-- Es seguro correrlo las veces que haga falta: cada sentencia es
-- "si no existe, créalo/agrégalo", así que en una tabla que ya está
-- correcta no cambia nada (probado contra una base con datos reales antes
-- de compartirlo). No borra ni modifica filas existentes.

-- =========================================================
-- profiles
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade
);
alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists nombre text not null default '';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists pin_hash text;
alter table public.profiles add column if not exists pin_set boolean not null default false;
alter table public.profiles add column if not exists theme text not null default 'light';
alter table public.profiles add column if not exists reminder_time time not null default '08:00';
alter table public.profiles add column if not exists reminder_enabled boolean not null default true;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'nombre', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- journal_entries
-- =========================================================
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid()
);
alter table public.journal_entries add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.journal_entries add column if not exists titulo text not null default '';
alter table public.journal_entries add column if not exists contenido text not null default '';
alter table public.journal_entries add column if not exists emociones text[] not null default '{}';
alter table public.journal_entries add column if not exists tipo text not null default 'personal';
alter table public.journal_entries add column if not exists created_at timestamptz not null default now();
alter table public.journal_entries add column if not exists updated_at timestamptz not null default now();

create index if not exists journal_entries_user_id_created_at_idx
  on public.journal_entries (user_id, created_at desc);

alter table public.journal_entries enable row level security;
drop policy if exists "journal_select_own" on public.journal_entries;
create policy "journal_select_own" on public.journal_entries for select using (auth.uid() = user_id);
drop policy if exists "journal_insert_own" on public.journal_entries;
create policy "journal_insert_own" on public.journal_entries for insert with check (auth.uid() = user_id);
drop policy if exists "journal_update_own" on public.journal_entries;
create policy "journal_update_own" on public.journal_entries for update using (auth.uid() = user_id);
drop policy if exists "journal_delete_own" on public.journal_entries;
create policy "journal_delete_own" on public.journal_entries for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.journal_entries;
create trigger set_updated_at before update on public.journal_entries
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- metas
-- =========================================================
create table if not exists public.metas (
  id uuid primary key default gen_random_uuid()
);
alter table public.metas add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.metas add column if not exists titulo text not null default '';
alter table public.metas add column if not exists descripcion text not null default '';
alter table public.metas add column if not exists tipo text not null default 'corto_plazo';
alter table public.metas add column if not exists estado text not null default 'activa';
alter table public.metas add column if not exists progreso int not null default 0;
alter table public.metas add column if not exists fecha_inicio date not null default current_date;
alter table public.metas add column if not exists fecha_objetivo date;
alter table public.metas add column if not exists foto_url text;
alter table public.metas add column if not exists created_at timestamptz not null default now();
alter table public.metas add column if not exists updated_at timestamptz not null default now();

create index if not exists metas_user_id_idx on public.metas (user_id, created_at desc);

alter table public.metas enable row level security;
drop policy if exists "metas_select_own" on public.metas;
create policy "metas_select_own" on public.metas for select using (auth.uid() = user_id);
drop policy if exists "metas_insert_own" on public.metas;
create policy "metas_insert_own" on public.metas for insert with check (auth.uid() = user_id);
drop policy if exists "metas_update_own" on public.metas;
create policy "metas_update_own" on public.metas for update using (auth.uid() = user_id);
drop policy if exists "metas_delete_own" on public.metas;
create policy "metas_delete_own" on public.metas for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.metas;
create trigger set_updated_at before update on public.metas
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- meta_progreso_historial
-- =========================================================
create table if not exists public.meta_progreso_historial (
  id uuid primary key default gen_random_uuid()
);
alter table public.meta_progreso_historial add column if not exists meta_id uuid references public.metas (id) on delete cascade;
alter table public.meta_progreso_historial add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.meta_progreso_historial add column if not exists progreso int not null default 0;
alter table public.meta_progreso_historial add column if not exists nota text;
alter table public.meta_progreso_historial add column if not exists created_at timestamptz not null default now();

create index if not exists meta_progreso_historial_meta_id_idx
  on public.meta_progreso_historial (meta_id, created_at desc);

alter table public.meta_progreso_historial enable row level security;
drop policy if exists "meta_hist_select_own" on public.meta_progreso_historial;
create policy "meta_hist_select_own" on public.meta_progreso_historial for select using (auth.uid() = user_id);
drop policy if exists "meta_hist_insert_own" on public.meta_progreso_historial;
create policy "meta_hist_insert_own" on public.meta_progreso_historial for insert with check (auth.uid() = user_id);

-- =========================================================
-- notificaciones
-- =========================================================
create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid()
);
alter table public.notificaciones add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.notificaciones add column if not exists titulo text not null default '';
alter table public.notificaciones add column if not exists mensaje text not null default '';
alter table public.notificaciones add column if not exists tipo text not null default 'recordatorio';
alter table public.notificaciones add column if not exists leida boolean not null default false;
alter table public.notificaciones add column if not exists created_at timestamptz not null default now();

create index if not exists notificaciones_user_id_created_at_idx
  on public.notificaciones (user_id, created_at desc);

alter table public.notificaciones enable row level security;
drop policy if exists "notificaciones_select_own" on public.notificaciones;
create policy "notificaciones_select_own" on public.notificaciones for select using (auth.uid() = user_id);
drop policy if exists "notificaciones_insert_own" on public.notificaciones;
create policy "notificaciones_insert_own" on public.notificaciones for insert with check (auth.uid() = user_id);
drop policy if exists "notificaciones_update_own" on public.notificaciones;
create policy "notificaciones_update_own" on public.notificaciones for update using (auth.uid() = user_id);
drop policy if exists "notificaciones_delete_own" on public.notificaciones;
create policy "notificaciones_delete_own" on public.notificaciones for delete using (auth.uid() = user_id);

-- =========================================================
-- transacciones
-- =========================================================
create table if not exists public.transacciones (
  id uuid primary key default gen_random_uuid()
);
alter table public.transacciones add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.transacciones add column if not exists tipo text not null default 'egreso';
alter table public.transacciones add column if not exists categoria text not null default 'otro';
alter table public.transacciones add column if not exists monto numeric(12, 2) not null default 0;
alter table public.transacciones add column if not exists descripcion text not null default '';
alter table public.transacciones add column if not exists fecha date not null default current_date;
alter table public.transacciones add column if not exists cuenta_id uuid;
alter table public.transacciones add column if not exists created_at timestamptz not null default now();
alter table public.transacciones add column if not exists updated_at timestamptz not null default now();

create index if not exists transacciones_user_id_fecha_idx
  on public.transacciones (user_id, fecha desc);

alter table public.transacciones enable row level security;
drop policy if exists "transacciones_select_own" on public.transacciones;
create policy "transacciones_select_own" on public.transacciones for select using (auth.uid() = user_id);
drop policy if exists "transacciones_insert_own" on public.transacciones;
create policy "transacciones_insert_own" on public.transacciones for insert with check (auth.uid() = user_id);
drop policy if exists "transacciones_update_own" on public.transacciones;
create policy "transacciones_update_own" on public.transacciones for update using (auth.uid() = user_id);
drop policy if exists "transacciones_delete_own" on public.transacciones;
create policy "transacciones_delete_own" on public.transacciones for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.transacciones;
create trigger set_updated_at before update on public.transacciones
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- categorias_personalizadas
-- =========================================================
create table if not exists public.categorias_personalizadas (
  id uuid primary key default gen_random_uuid()
);
alter table public.categorias_personalizadas add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.categorias_personalizadas add column if not exists tipo text not null default 'egreso';
alter table public.categorias_personalizadas add column if not exists nombre text not null default '';
alter table public.categorias_personalizadas add column if not exists icono text not null default 'mas';
alter table public.categorias_personalizadas add column if not exists color text not null default '#2a78d6';
alter table public.categorias_personalizadas add column if not exists created_at timestamptz not null default now();

create index if not exists categorias_personalizadas_user_id_idx
  on public.categorias_personalizadas (user_id, tipo);

alter table public.categorias_personalizadas enable row level security;
drop policy if exists "categorias_personalizadas_select_own" on public.categorias_personalizadas;
create policy "categorias_personalizadas_select_own" on public.categorias_personalizadas for select using (auth.uid() = user_id);
drop policy if exists "categorias_personalizadas_insert_own" on public.categorias_personalizadas;
create policy "categorias_personalizadas_insert_own" on public.categorias_personalizadas for insert with check (auth.uid() = user_id);
drop policy if exists "categorias_personalizadas_delete_own" on public.categorias_personalizadas;
create policy "categorias_personalizadas_delete_own" on public.categorias_personalizadas for delete using (auth.uid() = user_id);

-- =========================================================
-- vision_board_items
-- =========================================================
create table if not exists public.vision_board_items (
  id uuid primary key default gen_random_uuid()
);
alter table public.vision_board_items add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.vision_board_items add column if not exists imagen_url text not null default '';
alter table public.vision_board_items add column if not exists titulo text not null default '';
alter table public.vision_board_items add column if not exists orden int not null default 0;
alter table public.vision_board_items add column if not exists created_at timestamptz not null default now();

create index if not exists vision_board_items_user_id_idx
  on public.vision_board_items (user_id, orden);

alter table public.vision_board_items enable row level security;
drop policy if exists "vision_board_select_own" on public.vision_board_items;
create policy "vision_board_select_own" on public.vision_board_items for select using (auth.uid() = user_id);
drop policy if exists "vision_board_insert_own" on public.vision_board_items;
create policy "vision_board_insert_own" on public.vision_board_items for insert with check (auth.uid() = user_id);
drop policy if exists "vision_board_delete_own" on public.vision_board_items;
create policy "vision_board_delete_own" on public.vision_board_items for delete using (auth.uid() = user_id);

-- =========================================================
-- habitos
-- =========================================================
create table if not exists public.habitos (
  id uuid primary key default gen_random_uuid()
);
alter table public.habitos add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.habitos add column if not exists categoria text not null default 'tarea';
alter table public.habitos add column if not exists tipo text not null default 'check';
alter table public.habitos add column if not exists nombre text not null default '';
alter table public.habitos add column if not exists objetivo int not null default 1;
alter table public.habitos add column if not exists unidad text not null default '';
alter table public.habitos add column if not exists icono text not null default 'otro';
alter table public.habitos add column if not exists color text not null default '#2a78d6';
alter table public.habitos add column if not exists dias_semana int[] not null default '{0,1,2,3,4,5,6}';
alter table public.habitos add column if not exists activo boolean not null default true;
alter table public.habitos add column if not exists orden int not null default 0;
alter table public.habitos add column if not exists created_at timestamptz not null default now();
alter table public.habitos add column if not exists updated_at timestamptz not null default now();

create index if not exists habitos_user_id_idx on public.habitos (user_id, activo);

alter table public.habitos enable row level security;
drop policy if exists "habitos_select_own" on public.habitos;
create policy "habitos_select_own" on public.habitos for select using (auth.uid() = user_id);
drop policy if exists "habitos_insert_own" on public.habitos;
create policy "habitos_insert_own" on public.habitos for insert with check (auth.uid() = user_id);
drop policy if exists "habitos_update_own" on public.habitos;
create policy "habitos_update_own" on public.habitos for update using (auth.uid() = user_id);
drop policy if exists "habitos_delete_own" on public.habitos;
create policy "habitos_delete_own" on public.habitos for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.habitos;
create trigger set_updated_at before update on public.habitos
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- habito_registros
-- =========================================================
create table if not exists public.habito_registros (
  id uuid primary key default gen_random_uuid()
);
alter table public.habito_registros add column if not exists habito_id uuid references public.habitos (id) on delete cascade;
alter table public.habito_registros add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.habito_registros add column if not exists fecha date not null default current_date;
alter table public.habito_registros add column if not exists valor int not null default 0;
alter table public.habito_registros add column if not exists hora_completada timestamptz;
alter table public.habito_registros add column if not exists created_at timestamptz not null default now();
alter table public.habito_registros add column if not exists updated_at timestamptz not null default now();

create unique index if not exists habito_registros_habito_id_fecha_key
  on public.habito_registros (habito_id, fecha);
create index if not exists habito_registros_user_fecha_idx
  on public.habito_registros (user_id, fecha desc);
create index if not exists habito_registros_habito_fecha_idx
  on public.habito_registros (habito_id, fecha desc);

alter table public.habito_registros enable row level security;
drop policy if exists "habito_registros_select_own" on public.habito_registros;
create policy "habito_registros_select_own" on public.habito_registros for select using (auth.uid() = user_id);
drop policy if exists "habito_registros_insert_own" on public.habito_registros;
create policy "habito_registros_insert_own" on public.habito_registros for insert with check (auth.uid() = user_id);
drop policy if exists "habito_registros_update_own" on public.habito_registros;
create policy "habito_registros_update_own" on public.habito_registros for update using (auth.uid() = user_id);
drop policy if exists "habito_registros_delete_own" on public.habito_registros;
create policy "habito_registros_delete_own" on public.habito_registros for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.habito_registros;
create trigger set_updated_at before update on public.habito_registros
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- meta_objetivos
-- =========================================================
create table if not exists public.meta_objetivos (
  id uuid primary key default gen_random_uuid()
);
alter table public.meta_objetivos add column if not exists meta_id uuid references public.metas (id) on delete cascade;
alter table public.meta_objetivos add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.meta_objetivos add column if not exists nombre text not null default '';
alter table public.meta_objetivos add column if not exists tipo text not null default 'hito';
alter table public.meta_objetivos add column if not exists cantidad_objetivo numeric not null default 1;
alter table public.meta_objetivos add column if not exists periodo text;
alter table public.meta_objetivos add column if not exists unidad text not null default '';
alter table public.meta_objetivos add column if not exists peso numeric not null default 1;
alter table public.meta_objetivos add column if not exists origen text not null default 'usuario';
alter table public.meta_objetivos add column if not exists orden int not null default 0;
alter table public.meta_objetivos add column if not exists created_at timestamptz not null default now();
alter table public.meta_objetivos add column if not exists updated_at timestamptz not null default now();

create index if not exists meta_objetivos_meta_id_idx on public.meta_objetivos (meta_id, orden);

alter table public.meta_objetivos enable row level security;
drop policy if exists "meta_objetivos_select_own" on public.meta_objetivos;
create policy "meta_objetivos_select_own" on public.meta_objetivos for select using (auth.uid() = user_id);
drop policy if exists "meta_objetivos_insert_own" on public.meta_objetivos;
create policy "meta_objetivos_insert_own" on public.meta_objetivos for insert with check (auth.uid() = user_id);
drop policy if exists "meta_objetivos_update_own" on public.meta_objetivos;
create policy "meta_objetivos_update_own" on public.meta_objetivos for update using (auth.uid() = user_id);
drop policy if exists "meta_objetivos_delete_own" on public.meta_objetivos;
create policy "meta_objetivos_delete_own" on public.meta_objetivos for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.meta_objetivos;
create trigger set_updated_at before update on public.meta_objetivos
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- meta_registros
-- =========================================================
create table if not exists public.meta_registros (
  id uuid primary key default gen_random_uuid()
);
alter table public.meta_registros add column if not exists meta_id uuid references public.metas (id) on delete cascade;
alter table public.meta_registros add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.meta_registros add column if not exists fecha date not null default current_date;
alter table public.meta_registros add column if not exists texto text not null default '';
alter table public.meta_registros add column if not exists created_at timestamptz not null default now();

create index if not exists meta_registros_meta_id_idx on public.meta_registros (meta_id, created_at desc);

alter table public.meta_registros enable row level security;
drop policy if exists "meta_registros_select_own" on public.meta_registros;
create policy "meta_registros_select_own" on public.meta_registros for select using (auth.uid() = user_id);
drop policy if exists "meta_registros_insert_own" on public.meta_registros;
create policy "meta_registros_insert_own" on public.meta_registros for insert with check (auth.uid() = user_id);
drop policy if exists "meta_registros_delete_own" on public.meta_registros;
create policy "meta_registros_delete_own" on public.meta_registros for delete using (auth.uid() = user_id);

-- =========================================================
-- meta_objetivo_avances
-- =========================================================
create table if not exists public.meta_objetivo_avances (
  id uuid primary key default gen_random_uuid()
);
alter table public.meta_objetivo_avances add column if not exists objetivo_id uuid references public.meta_objetivos (id) on delete cascade;
alter table public.meta_objetivo_avances add column if not exists meta_id uuid references public.metas (id) on delete cascade;
alter table public.meta_objetivo_avances add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.meta_objetivo_avances add column if not exists registro_id uuid references public.meta_registros (id) on delete set null;
alter table public.meta_objetivo_avances add column if not exists fecha date not null default current_date;
alter table public.meta_objetivo_avances add column if not exists cantidad numeric not null default 1;
alter table public.meta_objetivo_avances add column if not exists nota text not null default '';
alter table public.meta_objetivo_avances add column if not exists created_at timestamptz not null default now();

create index if not exists meta_objetivo_avances_objetivo_idx
  on public.meta_objetivo_avances (objetivo_id, fecha desc);
create index if not exists meta_objetivo_avances_meta_idx
  on public.meta_objetivo_avances (meta_id, fecha desc);

alter table public.meta_objetivo_avances enable row level security;
drop policy if exists "meta_objetivo_avances_select_own" on public.meta_objetivo_avances;
create policy "meta_objetivo_avances_select_own" on public.meta_objetivo_avances for select using (auth.uid() = user_id);
drop policy if exists "meta_objetivo_avances_insert_own" on public.meta_objetivo_avances;
create policy "meta_objetivo_avances_insert_own" on public.meta_objetivo_avances for insert with check (auth.uid() = user_id);
drop policy if exists "meta_objetivo_avances_delete_own" on public.meta_objetivo_avances;
create policy "meta_objetivo_avances_delete_own" on public.meta_objetivo_avances for delete using (auth.uid() = user_id);

-- =========================================================
-- cuentas
-- =========================================================
create table if not exists public.cuentas (
  id uuid primary key default gen_random_uuid()
);
alter table public.cuentas add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.cuentas add column if not exists nombre text not null default '';
alter table public.cuentas add column if not exists tipo text not null default 'otro';
alter table public.cuentas add column if not exists saldo numeric not null default 0;
alter table public.cuentas add column if not exists icono text not null default 'billetera';
alter table public.cuentas add column if not exists color text not null default '#2a78d6';
alter table public.cuentas add column if not exists orden int not null default 0;
alter table public.cuentas add column if not exists created_at timestamptz not null default now();
alter table public.cuentas add column if not exists updated_at timestamptz not null default now();

create index if not exists cuentas_user_id_idx on public.cuentas (user_id, orden);

alter table public.cuentas enable row level security;
drop policy if exists "cuentas_select_own" on public.cuentas;
create policy "cuentas_select_own" on public.cuentas for select using (auth.uid() = user_id);
drop policy if exists "cuentas_insert_own" on public.cuentas;
create policy "cuentas_insert_own" on public.cuentas for insert with check (auth.uid() = user_id);
drop policy if exists "cuentas_update_own" on public.cuentas;
create policy "cuentas_update_own" on public.cuentas for update using (auth.uid() = user_id);
drop policy if exists "cuentas_delete_own" on public.cuentas;
create policy "cuentas_delete_own" on public.cuentas for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.cuentas;
create trigger set_updated_at before update on public.cuentas
  for each row execute procedure public.set_updated_at();

-- Asegura la FK de transacciones.cuenta_id (por si la tabla cuentas no
-- existía todavía cuando se creó la columna).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transacciones_cuenta_id_fkey'
  ) then
    alter table public.transacciones
      add constraint transacciones_cuenta_id_fkey
      foreign key (cuenta_id) references public.cuentas (id) on delete set null;
  end if;
end $$;

create index if not exists transacciones_cuenta_id_idx on public.transacciones (cuenta_id);

create or replace function public.ajustar_saldo_cuenta(p_cuenta_id uuid, p_delta numeric, p_user_id uuid)
returns void
language sql
security invoker
as $$
  update public.cuentas
  set saldo = saldo + p_delta
  where id = p_cuenta_id and user_id = p_user_id;
$$;

-- =========================================================
-- Storage: buckets + políticas (avatars, metas)
-- =========================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('metas', 'metas', true) on conflict (id) do nothing;

drop policy if exists "avatar_public_read" on storage.objects;
create policy "avatar_public_read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatar_insert_own" on storage.objects;
create policy "avatar_insert_own" on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar_update_own" on storage.objects;
create policy "avatar_update_own" on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar_delete_own" on storage.objects;
create policy "avatar_delete_own" on storage.objects for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "metas_photos_public_read" on storage.objects;
create policy "metas_photos_public_read" on storage.objects for select using (bucket_id = 'metas');
drop policy if exists "metas_photos_insert_own" on storage.objects;
create policy "metas_photos_insert_own" on storage.objects for insert with check (bucket_id = 'metas' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "metas_photos_update_own" on storage.objects;
create policy "metas_photos_update_own" on storage.objects for update using (bucket_id = 'metas' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "metas_photos_delete_own" on storage.objects;
create policy "metas_photos_delete_own" on storage.objects for delete using (bucket_id = 'metas' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';
