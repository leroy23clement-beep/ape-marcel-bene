import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import webpush from 'web-push'

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ success: false, message: "Clés VAPID manquantes dans Vercel." }, { status: 500 })
  }

  webpush.setVapidDetails(
    'mailto:contact@ape-marcel-bene.fr',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  const supabase = createClient()
  const body = await request.json()
  const { title, message } = body

  // 1. Récupérer d'abord les ID des utilisateurs ayant un rôle du bureau/admin
  const allowedRoles = ['admin', 'president', 'secretaire', 'tresorier', 'bureau']
  const { data: profilesData, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .in('role', allowedRoles)

  if (profileError || !profilesData || profilesData.length === 0) {
    return NextResponse.json({ success: false, message: 'Aucun profil de bureau trouvé.' }, { status: 400 })
  }

  const allowedUserIds = profilesData.map((p) => p.id)

  // 2. Récupérer uniquement les souscriptions push associées à ces membres du Codir
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', allowedUserIds) // Filtrage direct sur les membres autorisés

  if (error || !subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: false, message: 'Aucun appareil de test enregistré pour les membres du bureau.' }, { status: 400 })
  }

  let sentCount = 0

  const payload = JSON.stringify({
    title: title || '🔔 Test APE Marcel Béné (Codir)',
    body: message || 'Ceci est une notification de test réservée au bureau.',
    url: '/events'
  })

  for (const sub of subscriptions) {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.keys_auth,
          p256dh: sub.keys_p256dh
        }
      }
      await webpush.sendNotification(pushSubscription, payload)
      sentCount++
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }

  return NextResponse.json({
    success: true,
    sentCount,
    message: `Notification de test envoyée à ${sentCount} membre(s) du bureau.`
  })
}