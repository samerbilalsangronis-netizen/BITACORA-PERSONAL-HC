-- Objetivos medibles por meta, para reemplazar el slider manual de
-- progreso (0-100 puesto a mano) por algo que de verdad refleje cómo se
-- mide cada meta. Tres tipos cubren la mayoría de los casos:
--   frecuencia: recurrente por período (ej. "3 veces por semana")
--   hito:       paso discreto de un checklist (cantidad_objetivo = 1)
--   acumulado:  cantidad que se suma hacia un total (ej. "Ahorrar $1000")
-- "hito" y "acumulado" se calculan igual (suma de avances / objetivo);
-- la diferencia es solo conceptual (un hito es un acumulado de objetivo 1).

create table if not exists public.meta_objetivos (
  id uuid primary key default gen_random_uuid(),
  meta_id uuid not null references public.metas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('frecuencia', 'hito', 'acumulado')),
  cantidad_objetivo numeric not null default 1 check (cantidad_objetivo > 0),
  periodo text check (periodo in ('dia', 'semana', 'mes')),
  unidad text not null default '',
  peso numeric not null default 1 check (peso > 0),
  origen text not null default 'usuario' check (origen in ('agente', 'usuario')),
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meta_objetivos_meta_id_idx on public.meta_objetivos (meta_id, orden);

alter table public.meta_objetivos enable row level security;

create policy "meta_objetivos_select_own" on public.meta_objetivos
  for select using (auth.uid() = user_id);
create policy "meta_objetivos_insert_own" on public.meta_objetivos
  for insert with check (auth.uid() = user_id);
create policy "meta_objetivos_update_own" on public.meta_objetivos
  for update using (auth.uid() = user_id);
create policy "meta_objetivos_delete_own" on public.meta_objetivos
  for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.meta_objetivos;
create trigger set_updated_at before update on public.meta_objetivos
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- Registro de texto libre: "¿qué hiciste para esta meta?"
-- =========================================================
create table if not exists public.meta_registros (
  id uuid primary key default gen_random_uuid(),
  meta_id uuid not null references public.metas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null default current_date,
  texto text not null,
  created_at timestamptz not null default now()
);

create index if not exists meta_registros_meta_id_idx on public.meta_registros (meta_id, created_at desc);

alter table public.meta_registros enable row level security;

create policy "meta_registros_select_own" on public.meta_registros
  for select using (auth.uid() = user_id);
create policy "meta_registros_insert_own" on public.meta_registros
  for insert with check (auth.uid() = user_id);
create policy "meta_registros_delete_own" on public.meta_registros
  for delete using (auth.uid() = user_id);

-- =========================================================
-- Avances atribuidos a un objetivo (el agente evaluador los genera a
-- partir de un meta_registros; también se pueden agregar a mano).
-- =========================================================
create table if not exists public.meta_objetivo_avances (
  id uuid primary key default gen_random_uuid(),
  objetivo_id uuid not null references public.meta_objetivos (id) on delete cascade,
  meta_id uuid not null references public.metas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  registro_id uuid references public.meta_registros (id) on delete set null,
  fecha date not null default current_date,
  cantidad numeric not null default 1,
  nota text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists meta_objetivo_avances_objetivo_idx
  on public.meta_objetivo_avances (objetivo_id, fecha desc);
create index if not exists meta_objetivo_avances_meta_idx
  on public.meta_objetivo_avances (meta_id, fecha desc);

alter table public.meta_objetivo_avances enable row level security;

create policy "meta_objetivo_avances_select_own" on public.meta_objetivo_avances
  for select using (auth.uid() = user_id);
create policy "meta_objetivo_avances_insert_own" on public.meta_objetivo_avances
  for insert with check (auth.uid() = user_id);
create policy "meta_objetivo_avances_delete_own" on public.meta_objetivo_avances
  for delete using (auth.uid() = user_id);
