import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  cleanPayload,
  configureWebPush,
  getStaffUser,
  getSubscriptions,
  normalizeTarget,
  readJson,
  rolesForTarget,
  sendToSubscriptions,
  vapidErrorMessage,
} from '@/lib/push'

export async function POST(request: Request) {
  // 1. Seul le bureau peut envoyer des notifications
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

  // 2. Validation des entrées
  const data = await readJson(request)
  const payload = cleanPayload({ title: data.title, body: data.message ?? data.body, url: data.url })
  if (!payload) {
    return NextResponse.json(
      { success: false, message: 'Titre (100 caractères max) et message (300 max) obligatoires.' },
      { status: 400 }
    )
  }

  const target = normalizeTarget(data.target ?? 'all')
  if (!target) {
    return NextResponse.json({ success: false, message: 'Destinataires invalides.' }, { status: 400 })
  }

  // 3. Envoi
  try {
    const admin = createAdminClient()
    const subscriptions = await getSubscriptions(admin, rolesForTarget(target))

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Aucun appareil abonné trouvé pour ces destinataires.' },
        { status: 400 }
      )
    }

    const result = await sendToSubscriptions(admin, subscriptions, payload)
    return NextResponse.json({ success: true, sentCount: result.sent })
  } catch (err) {
    console.error('Erreur serveur notification :', err)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
