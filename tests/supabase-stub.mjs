/**
 * Doublure de `@supabase/supabase-js` : renvoie le faux client de `setup.mjs`.
 */
function getClient() {
  return globalThis.__getSupabase()
}

export const createClient = () => getClient()
export const createServerClient = () => getClient()
export const createBrowserClient = () => getClient()
export default { createClient, createServerClient, createBrowserClient }
