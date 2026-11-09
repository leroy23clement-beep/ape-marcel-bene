import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import webpush from 'web-push'

export async function GET(request: Request) {
  // Vérification de sécurité pour le Cron Vercel
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Non autorisé', { status: 401 })
  }

  // Configuration des clés VAPID à l'intérieur de la fonction
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "Clés VAPID manquantes dans les variables d'environnement Vercel." }, { status: 500 })
  }

  webpush.setVapidDetails(
    'mailto:contact@ape-marcel-bene.fr',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  const supabase = createClient()
  const today = new Date()

  const d7 = new Date(today)
  d7.setDate(today.getDate() + 7)
  const dateJ7 = d7.toISOString().split('T')[0]

  const d1 = new Date(today)
  d1.setDate(today.getDate() + 1)
  const dateJ1 = d1.toISOString().split('T')[0]

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .or(`date.eq.${dateJ7},date.eq.${dateJ1}`)

  if (eventsError || !events || events.length === 0) {
    return NextResponse.json({ message: 'Aucun événement concerné aujourd\'hui.' })
  }

  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*')

  if (subError || !subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ message: 'Aucune souscription Push enregistrée.' })
  }

  let sentCount = 0

  for (const event of events) {
    const isJ7 = event.date === dateJ7
    const title = isJ7 ? `📅 Dans 7 jours : ${event.title}` : `⏰ Demain : ${event.title}`
    const body = isJ7
      ? `N'oubliez pas ! L'événement "${event.title}" aura lieu dans une semaine.`
      : `Rappel de dernière minute pour "${event.title}". Cliquez pour revoir les détails.`

    const payload = JSON.stringify({
      title,
      body,
      url: `/events/${event.id}`
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
  }

  return NextResponse.json({
    success: true,
    eventsProcessed: events.length,
    notificationsSent: sentCount
  })
}