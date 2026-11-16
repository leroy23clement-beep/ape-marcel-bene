import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la clé secrète : il CONTOURNE la RLS.
 * À utiliser uniquement côté serveur (Route Handlers, Server Actions),
 * jamais dans un composant client. La clé ne doit PAS commencer par NEXT_PUBLIC_.
 *
 * Nommage : Supabase a remplacé les anciennes clés JWT (`service_role`, `eyJ…`)
 * par des clés `sb_secret_…` (page Project Settings → API Keys → Secret keys).
 * On lit donc `SUPABASE_SECRET_KEY` en priorité, et on retombe sur l'ancien nom
 * `SUPABASE_SERVICE_ROLE_KEY` pour ne rien casser sur les déploiements existants.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY manquant')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
