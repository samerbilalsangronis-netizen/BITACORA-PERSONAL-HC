-- TraderMind - esquema inicial
-- Ejecutar en el SQL editor de Supabase (o via `supabase db push`).

-- =========================================================
-- EXTENSIONES
-- =========================================================
create extension if not exists "pgcrypto";

-- =========================================================
-- PROFILES (1:1 con auth.users)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nombre text not null default '',
  pin_hash text,
  pin_set boolean not null default false,
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  reminder_time time not null default '08:00',
  reminder_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Crea automaticamente un profile cuando se registra un usuario nuevo.
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

-- =========================================================
-- JOURNAL ENTRIES
-- =========================================================
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  contenido text not null default '',
  emociones text[] not null default '{}',
  tipo text not null default 'personal' check (tipo in ('personal', 'post-operacion', 'reflexion')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_entries_user_id_created_at_idx
  on public.journal_entries (user_id, created_at desc);

alter table public.journal_entries enable row level security;

create policy "journal_select_own" on public.journal_entries
  for select using (auth.uid() = user_id);
create policy "journal_insert_own" on public.journal_entries
  for insert with check (auth.uid() = user_id);
create policy "journal_update_own" on public.journal_entries
  for update using (auth.uid() = user_id);
create policy "journal_delete_own" on public.journal_entries
  for delete using (auth.uid() = user_id);

-- =========================================================
-- METAS
-- =========================================================
create table if not exists public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  descripcion text not null default '',
  tipo text not null default 'corto_plazo' check (tipo in ('corto_plazo', 'mediano_plazo', 'largo_plazo')),
  estado text not null default 'activa' check (estado in ('activa', 'completada', 'pausada')),
  progreso int not null default 0 check (progreso >= 0 and progreso <= 100),
  fecha_inicio date not null default current_date,
  fecha_objetivo date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists metas_user_id_idx on public.metas (user_id, created_at desc);

alter table public.metas enable row level security;

create policy "metas_select_own" on public.metas
  for select using (auth.uid() = user_id);
create policy "metas_insert_own" on public.metas
  for insert with check (auth.uid() = user_id);
create policy "metas_update_own" on public.metas
  for update using (auth.uid() = user_id);
create policy "metas_delete_own" on public.metas
  for delete using (auth.uid() = user_id);

-- Historial de cambios de progreso de una meta.
create table if not exists public.meta_progreso_historial (
  id uuid primary key default gen_random_uuid(),
  meta_id uuid not null references public.metas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  progreso int not null check (progreso >= 0 and progreso <= 100),
  nota text,
  created_at timestamptz not null default now()
);

create index if not exists meta_progreso_historial_meta_id_idx
  on public.meta_progreso_historial (meta_id, created_at desc);

alter table public.meta_progreso_historial enable row level security;

create policy "meta_hist_select_own" on public.meta_progreso_historial
  for select using (auth.uid() = user_id);
create policy "meta_hist_insert_own" on public.meta_progreso_historial
  for insert with check (auth.uid() = user_id);

-- =========================================================
-- DAILY TASKS (tareas de disciplina definidas por el usuario)
-- =========================================================
create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  tareas jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fecha)
);

create index if not exists daily_tasks_user_id_fecha_idx
  on public.daily_tasks (user_id, fecha desc);

alter table public.daily_tasks enable row level security;

create policy "daily_tasks_select_own" on public.daily_tasks
  for select using (auth.uid() = user_id);
create policy "daily_tasks_insert_own" on public.daily_tasks
  for insert with check (auth.uid() = user_id);
create policy "daily_tasks_update_own" on public.daily_tasks
  for update using (auth.uid() = user_id);
create policy "daily_tasks_delete_own" on public.daily_tasks
  for delete using (auth.uid() = user_id);

-- =========================================================
-- DISCIPLINA STATS (derivado de daily_tasks, un registro por dia)
-- =========================================================
create table if not exists public.disciplina_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  tareas_totales int not null default 0,
  tareas_completadas int not null default 0,
  porcentaje_cumplimiento numeric not null default 0,
  unique (user_id, fecha)
);

create index if not exists disciplina_stats_user_id_fecha_idx
  on public.disciplina_stats (user_id, fecha desc);

alter table public.disciplina_stats enable row level security;

create policy "disciplina_stats_select_own" on public.disciplina_stats
  for select using (auth.uid() = user_id);
create policy "disciplina_stats_insert_own" on public.disciplina_stats
  for insert with check (auth.uid() = user_id);
create policy "disciplina_stats_update_own" on public.disciplina_stats
  for update using (auth.uid() = user_id);
create policy "disciplina_stats_delete_own" on public.disciplina_stats
  for delete using (auth.uid() = user_id);

-- Mantiene disciplina_stats sincronizado cada vez que se guarda daily_tasks.
create or replace function public.sync_disciplina_stats()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  total int;
  completadas int;
  porcentaje numeric;
begin
  select
    coalesce(jsonb_array_length(new.tareas), 0),
    coalesce((select count(*) from jsonb_array_elements(new.tareas) t where (t ->> 'completada')::boolean is true), 0)
  into total, completadas;

  porcentaje := case when total = 0 then 0 else round((completadas::numeric / total::numeric) * 100, 2) end;

  insert into public.disciplina_stats (user_id, fecha, tareas_totales, tareas_completadas, porcentaje_cumplimiento)
  values (new.user_id, new.fecha, total, completadas, porcentaje)
  on conflict (user_id, fecha) do update
    set tareas_totales = excluded.tareas_totales,
        tareas_completadas = excluded.tareas_completadas,
        porcentaje_cumplimiento = excluded.porcentaje_cumplimiento;

  return new;
end;
$$;

drop trigger if exists on_daily_tasks_change on public.daily_tasks;
create trigger on_daily_tasks_change
  after insert or update on public.daily_tasks
  for each row execute procedure public.sync_disciplina_stats();

-- =========================================================
-- NOTIFICACIONES (historial in-app de recordatorios)
-- =========================================================
create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  mensaje text not null default '',
  tipo text not null default 'recordatorio' check (tipo in ('recordatorio', 'sistema')),
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notificaciones_user_id_created_at_idx
  on public.notificaciones (user_id, created_at desc);

alter table public.notificaciones enable row level security;

create policy "notificaciones_select_own" on public.notificaciones
  for select using (auth.uid() = user_id);
create policy "notificaciones_insert_own" on public.notificaciones
  for insert with check (auth.uid() = user_id);
create policy "notificaciones_update_own" on public.notificaciones
  for update using (auth.uid() = user_id);
create policy "notificaciones_delete_own" on public.notificaciones
  for delete using (auth.uid() = user_id);

-- =========================================================
-- updated_at automatico
-- =========================================================
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

drop trigger if exists set_updated_at on public.journal_entries;
create trigger set_updated_at before update on public.journal_entries
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.metas;
create trigger set_updated_at before update on public.metas
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.daily_tasks;
create trigger set_updated_at before update on public.daily_tasks
  for each row execute procedure public.set_updated_at();
