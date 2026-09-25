-- Categorías de finanzas creadas por el propio usuario (además de las
-- categorías por defecto, que viven como constantes en el código).

create table if not exists public.categorias_personalizadas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  nombre text not null,
  icono text not null default 'mas',
  color text not null default '#2a78d6',
  created_at timestamptz not null default now()
);

create index if not exists categorias_personalizadas_user_id_idx
  on public.categorias_personalizadas (user_id, tipo);

alter table public.categorias_personalizadas enable row level security;

create policy "categorias_personalizadas_select_own" on public.categorias_personalizadas
  for select using (auth.uid() = user_id);
create policy "categorias_personalizadas_insert_own" on public.categorias_personalizadas
  for insert with check (auth.uid() = user_id);
create policy "categorias_personalizadas_delete_own" on public.categorias_personalizadas
  for delete using (auth.uid() = user_id);
