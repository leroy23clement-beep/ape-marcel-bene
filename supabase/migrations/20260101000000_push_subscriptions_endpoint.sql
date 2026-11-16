-- ---------------------------------------------------------------------------
-- Push : un abonnement par appareil
-- ---------------------------------------------------------------------------
-- Avant : `/api/save-subscription` faisait un upsert sur `user_id`, donc
-- activer les notifications sur l'ordinateur écrasait l'abonnement du
-- téléphone (une seule ligne par personne, un seul appareil notifié).
--
-- `subscription` (JSONB) reste la source lue par `lib/push.ts` ; la colonne
-- `endpoint` sert de clé d'unicité et d'index.

alter table public.push_subscriptions
  add column if not exists endpoint text;

-- Remplit `endpoint` depuis le JSON déjà stocké
update public.push_subscriptions
   set endpoint = subscription->>'endpoint'
 where endpoint is null
   and subscription ? 'endpoint';

-- Supprime les doublons éventuels avant la contrainte unique
delete from public.push_subscriptions a
 using public.push_subscriptions b
 where a.id > b.id
   and a.endpoint is not null
   and a.endpoint = b.endpoint;

create unique index if not exists push_subscriptions_endpoint_key
  on public.push_subscriptions (endpoint);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

-- RLS : chaque personne ne voit et ne modifie que ses propres abonnements.
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

comment on column public.push_subscriptions.endpoint is
  'Endpoint Web Push de l''appareil ; clé unique. `subscription` contient l''objet complet.';
