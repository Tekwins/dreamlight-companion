-- Dreamlight Compagnon : sauvegarde de la progression, une ligne par compte.
-- À coller une fois dans Supabase > SQL Editor > New query, puis « Run ».

create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Sécurité au niveau des lignes : chaque compte ne peut lire et modifier
-- que sa propre ligne. Les autres comptes n'y ont jamais accès.
alter table public.user_state enable row level security;

drop policy if exists "Lire sa progression" on public.user_state;
create policy "Lire sa progression" on public.user_state
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Créer sa progression" on public.user_state;
create policy "Créer sa progression" on public.user_state
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Modifier sa progression" on public.user_state;
create policy "Modifier sa progression" on public.user_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Supprimer sa progression" on public.user_state;
create policy "Supprimer sa progression" on public.user_state
  for delete to authenticated using ((select auth.uid()) = user_id);
