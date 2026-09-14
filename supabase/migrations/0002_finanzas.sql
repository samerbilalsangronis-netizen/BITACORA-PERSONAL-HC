-- TraderMind - Gestor financiero (ingresos / egresos)

create table if not exists public.transacciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  categoria text not null default 'otro',
  monto numeric(12, 2) not null check (monto >= 0),
  descripcion text not null default '',
  fecha date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transacciones_user_id_fecha_idx
  on public.transacciones (user_id, fecha desc);

alter table public.transacciones enable row level security;

create policy "transacciones_select_own" on public.transacciones
  for select using (auth.uid() = user_id);
create policy "transacciones_insert_own" on public.transacciones
  for insert with check (auth.uid() = user_id);
create policy "transacciones_update_own" on public.transacciones
  for update using (auth.uid() = user_id);
create policy "transacciones_delete_own" on public.transacciones
  for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.transacciones;
create trigger set_updated_at before update on public.transacciones
  for each row execute procedure public.set_updated_at();
