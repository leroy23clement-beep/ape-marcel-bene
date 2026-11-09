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

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')

  if (error || !subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: false, message: 'Aucun appareil abonné aux notifications.' }, { status: 400 })
  }

  let sentCount = 0

  const payload = JSON.stringify({
    title: title || '🔔 Test APE Marcel Béné',
    body: message || 'Ceci est une notification de test envoyée depuis l\'Espace Bureau.',
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
    sentCount
  })
}