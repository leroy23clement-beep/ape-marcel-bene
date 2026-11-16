import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la clé service_role : il CONTOURNE la RLS.
 * À utiliser uniquement côté serveur (Route Handlers, Server Actions),
 * jamais dans un composant client. La clé ne doit PAS commencer par NEXT_PUBLIC_.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
