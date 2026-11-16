-- ---------------------------------------------------------------------------
-- Push : un abonnement par appareil
-- ---------------------------------------------------------------------------
-- Problème : `/api/save-subscription` écrivait dans `endpoint`, or cette
-- colonne est GÉNÉRÉE dans cette base
-- (`generated always as (subscription->>'endpoint') stored`), donc en lecture
-- seule. L'upsert échouait, et le repli sur `onConflict: 'user_id'` écrasait
-- l'abonnement du téléphone quand la même personne activait les notifications
-- sur son ordinateur.
--
-- Solution : on n'écrit plus dans `endpoint`. On ajoute une colonne
-- `device_endpoint` (texte ordinaire, alimentée par le code) et un index
-- unique dessus. `endpoint` reste la colonne générée, intacte, au cas où
-- d'autres écrans la lisent.
--
-- À passer dans Supabase → SQL Editor. Ré-exécutable sans risque.

-- 1. Colonne d'écriture, une valeur par appareil -----------------------------
alter table public.push_subscriptions
  add column if not exists device_endpoint text;

-- 2. Remplissage des lignes existantes --------------------------------------
-- On part de la colonne générée quand elle existe déjà, sinon du JSON.
update public.push_subscriptions
   set device_endpoint = coalesce(endpoint, subscription->>'endpoint')
 where device_endpoint is null;

-- 3. Doublons : on ne garde que la ligne la plus récente par appareil --------
delete from public.push_subscriptions a
 using public.push_subscriptions b
 where a.id > b.id
   and a.device_endpoint is not null
   and a.device_endpoint = b.device_endpoint;

-- 4. Un appareil = une ligne -------------------------------------------------
create unique index if not exists push_subscriptions_device_endpoint_key
  on public.push_subscriptions (device_endpoint);

-- Index de lecture par personne (envoi ciblé par rôle dans `lib/push.ts`)
create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

-- 5. RLS : chacun ne voit et ne modifie que ses propres abonnements ----------
alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  to authenticated
  using (user_id = auth.uid());

-- 6. Trace -------------------------------------------------------------------
comment on column public.push_subscriptions.device_endpoint is
  'Endpoint Web Push de l''appareil, écrit par le code ; clé unique (une ligne par appareil).';
comment on column public.push_subscriptions.endpoint is
  'Colonne générée (subscription->>''endpoint''), conservée en lecture seule.';

-- 7. Vérification (doit renvoyer 1 ligne par appareil) ----------------------
-- select id, user_id, device_endpoint, created_at
--   from public.push_subscriptions
--  order by user_id, created_at desc;
