/** Doublure de `@/lib/supabase/server` et `@/lib/supabase/client`. */
export async function createClient() {
  return globalThis.__getSupabase()
}
