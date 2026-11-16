import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  cleanPayload,
  configureWebPush,
  getStaffUser,
  getSubscriptionsForUser,
  readJson,
  sendToSubscriptions,
  vapidErrorMessage,
} from '@/lib/push'

// Envoie une notification de test aux appareils de la personne connectée uniquement.
export async function POST(request: Request) {
  const user = await getStaffUser()
  if (!user) {
    return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 })
  }

  if (!configureWebPush()) {
    return NextResponse.json(
      { success: false, message: vapidErrorMessage() },
      { status: 500 }
    )
  }

  const data = await readJson(request)
  const payload = cleanPayload({
    title: data.title || '🔔 Test APE Marcel Béné',
    body: data.message || 'Ceci est une notification de test.',
    url: '/',
  })
  if (!payload) {
    return NextResponse.json(
      { success: false, message: 'Titre (100 caractères max) ou message (300 max) invalide.' },
      { status: 400 }
    )
  }

  try {
    const admin = createAdminClient()
    const subscriptions = await getSubscriptionsForUser(admin, user.id)

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucun appareil enregistré sur ton compte : active d'abord les notifications.",
        },
        { status: 400 }
      )
    }

    const result = await sendToSubscriptions(admin, subscriptions, payload)
    return NextResponse.json({
      success: true,
      sentCount: result.sent,
      message: `Notification de test envoyée à ${result.sent} appareil(s).`,
    })
  } catch (err) {
    console.error('Erreur notification de test :', err)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
