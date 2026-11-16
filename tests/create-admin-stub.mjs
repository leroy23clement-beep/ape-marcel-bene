/** Doublure de `@/lib/supabase/admin`. */
export function createAdminClient() {
  return globalThis.__getSupabase()
}
