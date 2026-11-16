/**
 * Préchargé par `node --import` (voir package.json → "test").
 *
 * Fournit :
 *  - des variables d'environnement factices pour Supabase ;
 *  - un faux client Supabase pour les Server Actions, piloté par chaque test ;
 *  - `redirigeVers()`, qui lit la redirection captée au lieu de l'exécuter.
 *
 * Aucune requête réseau : `@supabase/supabase-js` n'est jamais instancié, les
 * modules `@/lib/supabase/*`, `next/headers`, `next/cache`, `next/navigation`
 * et `server-only` sont remplacés par des doublures (voir `registerHooks`).
 */
import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'cle-anon-de-test'
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'cle-service-de-test'

const projectRoot = process.env.PROJECT_ROOT ?? process.cwd()
const stubs = new URL('./', import.meta.url)
const stub = (name) => new URL(name, stubs).href

// ---------------------------------------------------------------------------
// Faux client Supabase
// ---------------------------------------------------------------------------
function createFakeSupabase(config = {}) {
  const {
    tables = {},
    user = { id: 'user-1', email: 'parent@example.com' },
    uploadError = null,
    authErrors = {},
  } = config
  const calls = []

  function from(table) {
    const cfg = tables[table] ?? {}
    const state = { table, mode: 'select', filters: [], payload: null, options: null }

    const settle = () => {
      calls.push({ ...state })
      if (cfg.error) return { data: null, error: cfg.error }
      if (state.mode === 'select') {
        const value = cfg.data ?? cfg.row ?? null
        return { data: Array.isArray(value) ? value : value ? [value] : [], error: null }
      }
      return { data: null, error: null }
    }

    const builder = {
      select: () => builder,
      eq(column, value) {
        state.filters.push({ column, value })
        return builder
      },
      in(column, value) {
        state.filters.push({ column, value })
        return builder
      },
      order: () => builder,
      limit: () => builder,
      insert(payload) {
        state.mode = 'insert'
        state.payload = payload
        return builder
      },
      update(payload) {
        state.mode = 'update'
        state.payload = payload
        return builder
      },
      upsert(payload, options) {
        state.mode = 'upsert'
        state.payload = payload
        state.options = options
        return builder
      },
      delete() {
        state.mode = 'delete'
        return builder
      },
      single() {
        calls.push({ ...state })
        if (cfg.error) return Promise.resolve({ data: null, error: cfg.error })
        return Promise.resolve({ data: cfg.row ?? null, error: null })
      },
      maybeSingle() {
        return builder.single()
      },
      then(resolve, reject) {
        return Promise.resolve(settle()).then(resolve, reject)
      },
    }
    return builder
  }

  return {
    calls,
    auth: {
      getUser: async () => ({ data: { user }, error: user ? null : { message: 'Pas de session' } }),
      signInWithPassword: async () => ({ data: {}, error: authErrors.signInWithPassword ?? null }),
      signUp: async () => ({ data: {}, error: authErrors.signUp ?? null }),
      signOut: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({ error: authErrors.exchangeCodeForSession ?? null }),
    },
    from,
    storage: {
      from: () => ({
        upload: async () => ({ error: uploadError }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://exemple.supabase.co/fichier.jpg' } }),
      }),
    },
  }
}

globalThis.__fakeSupabase = null

globalThis.__setSupabase = (config) => {
  globalThis.__fakeSupabase = createFakeSupabase(config)
  return globalThis.__fakeSupabase
}

globalThis.__getSupabase = () => {
  if (!globalThis.__fakeSupabase) globalThis.__setSupabase({})
  return globalThis.__fakeSupabase
}

// ---------------------------------------------------------------------------
// Résolution des modules
// ---------------------------------------------------------------------------
const ALIASES = {
  'server-only': 'setup-server-only.mjs',
  '@supabase/supabase-js': 'supabase-stub.mjs',
  'next/headers': 'next-headers-stub.mjs',
  'next/cache': 'next-cache-stub.mjs',
  'next/navigation': 'next-navigation-stub.mjs',
  '@/lib/supabase/server': 'create-client-stub.mjs',
  '@/lib/supabase/client': 'create-client-stub.mjs',
  '@/lib/supabase/admin': 'create-admin-stub.mjs',
}

const EXTENSIONS = ['.ts', '.tsx', '.mts', '/index.ts', '.mjs', '.js']

registerHooks({
  resolve(specifier, context, nextResolve) {
    const alias = ALIASES[specifier]
    if (alias) return { url: stub(alias), shortCircuit: true }

    // Alias `@/…` du projet
    if (specifier.startsWith('@/')) {
      for (const candidate of resolveCandidate(path.join(projectRoot, specifier.slice(2)))) {
        if (existsSync(candidate)) {
          return { url: new URL('file://' + candidate.replace(/\\/g, '/')).href, shortCircuit: true }
        }
      }
    }

    // Import relatif sans extension (`./_guards`, `../lib/x`) : TypeScript
    // l'accepte, Node non. On ajoute l'extension à la volée.
    if (specifier.startsWith('.') && !/\.(m?js|cjs|json|ts|tsx)$/.test(specifier)) {
      const parent = context.parentURL ? fileURLToPath(context.parentURL) : path.join(projectRoot, 'index.js')
      for (const candidate of resolveCandidate(path.resolve(path.dirname(parent), specifier))) {
        if (existsSync(candidate)) {
          return { url: new URL('file://' + candidate.replace(/\\/g, '/')).href, shortCircuit: true }
        }
      }
    }

    return nextResolve(specifier, context)
  },
})

function resolveCandidate(base) {
  return [base, ...EXTENSIONS.map((ext) => base + ext)]
}

// ---------------------------------------------------------------------------
// Aides exportées aux tests
// ---------------------------------------------------------------------------
/** Réinitialise le faux client (et la redirection captée) ; renvoie le client. */
export function resetSupabase(config = {}) {
  globalThis.__lastRedirect = null
  return globalThis.__setSupabase(config)
}

/** Cible de la redirection demandée par le code sous test, ou `null`. */
export function redirigeVers() {
  return globalThis.__lastRedirect ?? null
}

/** Tous les appels Supabase enregistrés (lecture et écriture). */
export function appelsSupabase() {
  return globalThis.__getSupabase().calls
}

/** Vrai si une écriture (insert/update/upsert/delete) a été tentée. */
export function aEcrit() {
  return appelsSupabase().some((call) => call.mode !== 'select')
}
