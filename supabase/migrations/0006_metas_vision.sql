-- Foto para metas logradas + tablero de visión (vision board), con su
-- propio bucket de Storage con RLS por carpeta de usuario (mismo patrón
-- que el bucket 'avatars' de 0004_avatar.sql).

alter table public.metas add column if not exists foto_url text;

create table if not exists public.vision_board_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  imagen_url text not null,
  titulo text not null default '',
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists vision_board_items_user_id_idx
  on public.vision_board_items (user_id, orden);

alter table public.vision_board_items enable row level security;

create policy "vision_board_select_own" on public.vision_board_items
  for select using (auth.uid() = user_id);
create policy "vision_board_insert_own" on public.vision_board_items
  for insert with check (auth.uid() = user_id);
create policy "vision_board_delete_own" on public.vision_board_items
  for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('metas', 'metas', true)
on conflict (id) do nothing;

drop policy if exists "metas_photos_public_read" on storage.objects;
create policy "metas_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'metas');

drop policy if exists "metas_photos_insert_own" on storage.objects;
create policy "metas_photos_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'metas' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "metas_photos_update_own" on storage.objects;
create policy "metas_photos_update_own"
  on storage.objects for update
  using (bucket_id = 'metas' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "metas_photos_delete_own" on storage.objects;
create policy "metas_photos_delete_own"
  on storage.objects for delete
  using (bucket_id = 'metas' and (storage.foldername(name))[1] = auth.uid()::text);
