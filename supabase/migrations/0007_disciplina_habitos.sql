-- Rediseño de "Disciplina diaria": tareas y hábitos unificados en una sola
-- tabla (con un discriminador `categoria`), soporte de tipo contador con
-- objetivo/unidad, y programación por día de la semana. El registro diario
-- de cumplimiento vive aparte para poder calcular una racha por ítem.

create table if not exists public.habitos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  categoria text not null default 'tarea' check (categoria in ('tarea', 'habito')),
  tipo text not null default 'check' check (tipo in ('check', 'contador')),
  nombre text not null,
  objetivo int not null default 1 check (objetivo > 0),
  unidad text not null default '',
  icono text not null default 'otro',
  color text not null default '#2a78d6',
  dias_semana int[] not null default '{0,1,2,3,4,5,6}',
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists habitos_user_id_idx on public.habitos (user_id, activo);

alter table public.habitos enable row level security;

create policy "habitos_select_own" on public.habitos
  for select using (auth.uid() = user_id);
create policy "habitos_insert_own" on public.habitos
  for insert with check (auth.uid() = user_id);
create policy "habitos_update_own" on public.habitos
  for update using (auth.uid() = user_id);
create policy "habitos_delete_own" on public.habitos
  for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.habitos;
create trigger set_updated_at before update on public.habitos
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- Registro diario de cumplimiento por hábito/tarea
-- =========================================================
create table if not exists public.habito_registros (
  id uuid primary key default gen_random_uuid(),
  habito_id uuid not null references public.habitos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  valor int not null default 0 check (valor >= 0),
  hora_completada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habito_id, fecha)
);

create index if not exists habito_registros_user_fecha_idx
  on public.habito_registros (user_id, fecha desc);
create index if not exists habito_registros_habito_fecha_idx
  on public.habito_registros (habito_id, fecha desc);

alter table public.habito_registros enable row level security;

create policy "habito_registros_select_own" on public.habito_registros
  for select using (auth.uid() = user_id);
create policy "habito_registros_insert_own" on public.habito_registros
  for insert with check (auth.uid() = user_id);
create policy "habito_registros_update_own" on public.habito_registros
  for update using (auth.uid() = user_id);
create policy "habito_registros_delete_own" on public.habito_registros
  for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.habito_registros;
create trigger set_updated_at before update on public.habito_registros
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- Migración automática desde el sistema anterior (daily_tasks)
-- =========================================================
-- El sistema viejo guardaba, para cada día, un arreglo JSON de tareas que
-- se "arrastraba" de un día a otro conservando el mismo `id` (ver
-- ensureDailyTasks en el código anterior) hasta que el usuario la borraba.
-- Eso significa que cada `id` de tarea que aparece en el historial
-- corresponde a un único ítem real, así que lo reusamos como el nuevo
-- `habitos.id`: se crea como tarea programada todos los días (el sistema
-- viejo no tenía horario), y su historial de cumplimiento se traslada tal
-- cual a `habito_registros`. Si el usuario ya la había borrado antes de
-- esta migración, queda creada pero inactiva (puede reactivarla o editarla
-- desde la nueva pantalla).

-- Nota: se evita a propósito una tabla temporal (`create temporary table`)
-- para migrar estos datos. El SQL Editor de Supabase puede repartir las
-- distintas sentencias de un mismo script entre conexiones diferentes del
-- connection pooler, y una tabla temporal solo vive en la conexión que la
-- creó — la siguiente sentencia la ve como inexistente. Por eso cada
-- `insert` de abajo repite su propio `with` completo en vez de compartir
-- una tabla intermedia.

with tareas_desanidadas as (
  select
    dt.user_id,
    dt.fecha,
    (t ->> 'id')::uuid as tarea_id,
    t ->> 'descripcion' as descripcion,
    coalesce((t ->> 'orden')::int, 0) as orden,
    coalesce((t ->> 'completada')::boolean, false) as completada,
    nullif(t ->> 'hora_completada', '')::timestamptz as hora_completada
  from public.daily_tasks dt,
       jsonb_array_elements(dt.tareas) as t
  where jsonb_typeof(dt.tareas) = 'array'
),
ultima_por_tarea as (
  select distinct on (tarea_id) tarea_id, user_id, descripcion, orden
  from tareas_desanidadas
  order by tarea_id, fecha desc
),
ultimo_dia_por_usuario as (
  select user_id, max(fecha) as ultima_fecha
  from tareas_desanidadas
  group by user_id
),
activas as (
  select distinct td.tarea_id
  from tareas_desanidadas td
  join ultimo_dia_por_usuario u on u.user_id = td.user_id and u.ultima_fecha = td.fecha
)
insert into public.habitos (id, user_id, categoria, tipo, nombre, objetivo, dias_semana, activo, orden)
select
  u.tarea_id,
  u.user_id,
  'tarea',
  'check',
  coalesce(nullif(u.descripcion, ''), 'Tarea'),
  1,
  '{0,1,2,3,4,5,6}',
  exists (select 1 from activas a where a.tarea_id = u.tarea_id),
  u.orden
from ultima_por_tarea u
on conflict (id) do nothing;

with tareas_desanidadas as (
  select
    dt.user_id,
    dt.fecha,
    (t ->> 'id')::uuid as tarea_id,
    coalesce((t ->> 'completada')::boolean, false) as completada,
    nullif(t ->> 'hora_completada', '')::timestamptz as hora_completada
  from public.daily_tasks dt,
       jsonb_array_elements(dt.tareas) as t
  where jsonb_typeof(dt.tareas) = 'array'
)
insert into public.habito_registros (habito_id, user_id, fecha, valor, hora_completada)
select tarea_id, user_id, fecha, case when completada then 1 else 0 end, hora_completada
from tareas_desanidadas
on conflict (habito_id, fecha) do nothing;
