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

-- Abonnements aux notifications push (un par appareil). La fonction planifiée qui envoie les
-- rappels lit cette table avec la clé service_role (elle ignore donc la RLS ci-dessous).
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  endpoint   text        not null unique,
  p256dh     text        not null,
  auth       text        not null,
  tz         text        not null default 'UTC', -- fuseau IANA de l'appareil (ex. Europe/Paris), pour l'heure du rappel
  last_sent  text, -- date (AAAA-MM-JJ, heure locale de l'appareil) du dernier rappel envoyé : évite les doublons
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Voir ses appareils" on public.push_subscriptions;
create policy "Voir ses appareils" on public.push_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Ajouter un appareil" on public.push_subscriptions;
create policy "Ajouter un appareil" on public.push_subscriptions
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Mettre à jour son appareil" on public.push_subscriptions;
create policy "Mettre à jour son appareil" on public.push_subscriptions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Retirer un appareil" on public.push_subscriptions;
create policy "Retirer un appareil" on public.push_subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);
