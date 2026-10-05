-- Cuentas: dónde está guardado el capital (banco, efectivo, broker, etc.),
-- cada una con un saldo. El "capital total" es la suma de todos los saldos.
-- Las transacciones pueden (opcionalmente) apuntar a una cuenta: al
-- registrar/eliminar una transacción con cuenta asignada, su saldo se
-- ajusta automáticamente vía la función ajustar_saldo_cuenta() (evita
-- condiciones de carrera comparado con leer-y-escribir desde la app).

create table if not exists public.cuentas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('banco', 'efectivo', 'broker', 'billetera_digital', 'otro')),
  saldo numeric not null default 0,
  icono text not null default 'billetera',
  color text not null default '#2a78d6',
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cuentas_user_id_idx on public.cuentas (user_id, orden);

alter table public.cuentas enable row level security;

create policy "cuentas_select_own" on public.cuentas
  for select using (auth.uid() = user_id);
create policy "cuentas_insert_own" on public.cuentas
  for insert with check (auth.uid() = user_id);
create policy "cuentas_update_own" on public.cuentas
  for update using (auth.uid() = user_id);
create policy "cuentas_delete_own" on public.cuentas
  for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.cuentas;
create trigger set_updated_at before update on public.cuentas
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- Vincular transacciones a una cuenta (opcional)
-- =========================================================
alter table public.transacciones
  add column if not exists cuenta_id uuid references public.cuentas (id) on delete set null;

create index if not exists transacciones_cuenta_id_idx on public.transacciones (cuenta_id);

-- Ajuste atómico de saldo: evita que dos ajustes simultáneos (poco probable
-- en esta app, pero gratis de prevenir) se pisen entre sí con un read-then-write
-- hecho desde el cliente.
create or replace function public.ajustar_saldo_cuenta(p_cuenta_id uuid, p_delta numeric, p_user_id uuid)
returns void
language sql
security invoker
as $$
  update public.cuentas
  set saldo = saldo + p_delta
  where id = p_cuenta_id and user_id = p_user_id;
$$;
