import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readJson } from '@/lib/push'

type CleanSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/** Vérifie la forme d'un abonnement Web Push et ne garde que les champs utiles. */
function parseSubscription(value: Record<string, unknown>): CleanSubscription | null {
  const { endpoint, keys } = value
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || endpoint.length > 1000) {
    return null
  }
  if (!keys || typeof keys !== 'object') return null

  const { p256dh, auth } = keys as Record<string, unknown>
  if (typeof p256dh !== 'string' || typeof auth !== 'string') return null
  if (!p256dh || !auth || p256dh.length > 200 || auth.length > 200) return null

  return { endpoint, keys: { p256dh, auth } }
}

/**
 * Enregistre l'abonnement push de l'appareil courant.
 *
 * Correction : `onConflict: 'user_id'` écrasait l'abonnement du téléphone quand
 * la même personne activait les notifications sur son ordinateur, et le corps
 * de la requête (JSON du navigateur, sans `user_id`) était inséré tel quel.
 * On s'appuie désormais sur `endpoint` (une ligne par appareil).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const subscription = parseSubscription(await readJson(request))
    if (!subscription) {
      return NextResponse.json({ error: 'Abonnement invalide' }, { status: 400 })
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        subscription,
      },
      { onConflict: 'endpoint' }
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erreur sauvegarde subscription:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
