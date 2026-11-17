import webpush from 'web-push'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Rôles (à garder cohérents avec les policies SQL et la fonction is_staff)
// ---------------------------------------------------------------------------
export const BUREAU_ROLES = [
  'admin',
  'president',
  'vice_president',
  'secretaire',
  'vice_secretaire',
  'tresorier',
  'vice_tresorier',
  'bureau',
  'membre_codir',
]

// Mêmes listes que la policy de lecture de la table events
export const CODIR_ROLES = [
  'membre_codir',
  'president',
  'vice_president',
  'secretaire',
  'vice_secretaire',
  'tresorier',
  'vice_tresorier',
  'admin',
]
export const SECRETARIAT_ROLES = ['president', 'secretaire', 'vice_secretaire', 'admin']

// Qui a le droit d'envoyer des notifications aux autres membres
export const PUSH_SENDER_ROLES = BUREAU_ROLES

// ---------------------------------------------------------------------------
// Cibles d'envoi
// ---------------------------------------------------------------------------
export type PushTarget = 'all' | 'bureau' | 'restricted'

export function normalizeTarget(value: unknown): PushTarget | null {
  if (value === 'all') return 'all'
  if (value === 'bureau') return 'bureau'
  if (value === 'restricted' || value === 'restreint') return 'restricted'
  return null
}

/** Rôles destinataires pour une cible ; undefined = tout le monde. */
export function rolesForTarget(target: PushTarget): string[] | undefined {
  if (target === 'bureau') return BUREAU_ROLES
  if (target === 'restricted') return ['admin', 'tresorier', 'secretaire']
  return undefined
}

// ---------------------------------------------------------------------------
// Types et validation
// ---------------------------------------------------------------------------
export type PushPayload = { title: string; body: string; url: string }

export type StoredSubscription = {
  id: number
  user_id: string
  subscription: webpush.PushSubscription
}

export function cleanPayload(input: {
  title?: unknown
  body?: unknown
  url?: unknown
}): PushPayload | null {
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const body = typeof input.body === 'string' ? input.body.trim() : ''
  if (!title || !body || title.length > 100 || body.length > 300) return null

  // Uniquement des liens internes
  const url =
    typeof input.url === 'string' && input.url.startsWith('/') && !input.url.startsWith('//')
      ? input.url
      : '/'

  return { title, body, url }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = await request.json()
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

// ---------------------------------------------------------------------------
// Authentification de l'expéditeur
// ---------------------------------------------------------------------------
/** Retourne l'utilisateur connecté s'il a un rôle autorisé à envoyer, sinon null. */
export async function getStaffUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile?.role || !PUSH_SENDER_ROLES.includes(profile.role)) return null
  return user
}

// ---------------------------------------------------------------------------
// Web Push
// ---------------------------------------------------------------------------
let configured = false

/** Noms des variables VAPID absentes (liste vide si tout est configuré). */
export function missingVapidVars(): string[] {
  const missing: string[] = []
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()) missing.push('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
  if (!process.env.VAPID_PRIVATE_KEY?.trim()) missing.push('VAPID_PRIVATE_KEY')
  return missing
}

/** Message d'erreur explicite, réservé aux membres du bureau (routes protégées). */
export function vapidErrorMessage(): string {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'inconnu'
  const env = process.env.VERCEL_ENV ?? 'local'
  // Noms seulement, jamais les valeurs : permet de repérer une faute de frappe ou un espace
  const seen = Object.keys(process.env).filter((name) => /vapid/i.test(name))
  return `Variable(s) manquante(s) : ${missingVapidVars().join(', ')} (déploiement ${commit}, ${env}). Variables VAPID visibles : ${
    seen.length ? seen.map((n) => JSON.stringify(n)).join(', ') : 'aucune'
  }.`
}

export function configureWebPush(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false

  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:contact@ape-marcel-bene.fr',
      publicKey,
      privateKey
    )
    configured = true
  }
  return true
}

/** Abonnements des utilisateurs ayant l'un des rôles donnés (tous si roles est omis). */
export async function getSubscriptions(
  admin: SupabaseClient,
  roles?: string[]
): Promise<StoredSubscription[]> {
  let userIds: string[] | null = null

  if (roles) {
    const { data, error } = await admin.from('profiles').select('id').in('role', roles)
    if (error) throw error
    userIds = (data ?? []).map((p: { id: string }) => p.id)
    // Aucun profil correspondant : on n'envoie à personne (jamais de repli sur "tout le monde")
    if (userIds.length === 0) return []
  }

  let query = admin.from('push_subscriptions').select('id, user_id, subscription')
  if (userIds) query = query.in('user_id', userIds)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as StoredSubscription[]
}

export async function getSubscriptionsForUser(
  admin: SupabaseClient,
  userId: string
): Promise<StoredSubscription[]> {
  const { data, error } = await admin
    .from('push_subscriptions')
    .select('id, user_id, subscription')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []) as StoredSubscription[]
}

/** Envoie la notification et supprime les abonnements expirés (404 / 410). */
export async function sendToSubscriptions(
  admin: SupabaseClient,
  subscriptions: StoredSubscription[],
  payload: PushPayload
) {
  const message = JSON.stringify(payload)
  const expiredIds: number[] = []
  let sent = 0
  let failed = 0

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, message, { TTL: 60 * 60 * 24 })
        sent++
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          expiredIds.push(sub.id)
        } else {
          failed++
          console.error('Erreur envoi push :', status ?? err)
        }
      }
    })
  )

  if (expiredIds.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', expiredIds)
  }

  return { sent, failed, removed: expiredIds.length }
}
