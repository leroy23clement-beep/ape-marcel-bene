import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { configureWebPush, getSubscriptions, sendToSubscriptions } from '@/lib/push'

/**
 * Cron quotidien J-7 / J-1 (voir `vercel.json`).
 *
 * Corrections apportées :
 *  1. Le client Supabase venait de `lib/supabase/client.ts` (client navigateur) :
 *     il n'y a pas de `cookies()` dans une requête de cron, donc la route
 *     échouait à chaque exécution. Elle utilise maintenant la clé service_role.
 *  2. La colonne s'appelle `event_date`, pas `date` : ni la requête `.or(...)`
 *     ni `event.date` ne pouvaient fonctionner.
 *  3. `CRON_SECRET` absent rendait la route publique (`Bearer undefined`).
 *  4. Les dates étaient comparées en UTC (`toISOString`) : un événement du
 *     lundi soir à Paris était considéré comme le mardi.
 *  5. `sendToSubscriptions` renvoie un objet : le compter directement dans
 *     `notificationsSent` affichait `[object Object]`.
 */

const PARIS_TZ = 'Europe/Paris'

/** Date `AAAA-MM-JJ` du jour à Paris, décalée de `offsetDays`. */
function parisDate(offsetDays: number): string {
  const target = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
  // `en-CA` produit directement AAAA-MM-JJ
  return new Intl.DateTimeFormat('en-CA', { timeZone: PARIS_TZ }).format(target)
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // pas de secret configuré : on refuse (avant : ouvert à tous)

  const header = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const a = Buffer.from(header)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new NextResponse('Non autorisé', { status: 401 })
  }

  if (!configureWebPush()) {
    return NextResponse.json(
      { error: "Clés VAPID manquantes dans les variables d'environnement." },
      { status: 500 }
    )
  }

  const admin = createAdminClient()

  const dateJ7 = parisDate(7)
  const dateJ1 = parisDate(1)

  // `event_date` est un timestamp : on compare sur la journée parisienne.
  const dayRange = (day: string) => ({ from: `${day}T00:00:00`, to: `${day}T23:59:59` })
  const j7 = dayRange(dateJ7)
  const j1 = dayRange(dateJ1)

  const { data: events, error: eventsError } = await admin
    .from('events')
    .select('id, title, event_date')
    .or(
      `and(event_date.gte.${j7.from},event_date.lte.${j7.to}),and(event_date.gte.${j1.from},event_date.lte.${j1.to})`
    )
    .order('event_date', { ascending: true })

  if (eventsError) {
    console.error('Cron rappels : lecture des événements impossible', eventsError)
    return NextResponse.json({ error: 'Lecture des événements impossible.' }, { status: 500 })
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ message: "Aucun événement concerné aujourd'hui." })
  }

  const subscriptions = await getSubscriptions(admin)
  if (subscriptions.length === 0) {
    return NextResponse.json({ message: 'Aucune souscription Push enregistrée.' })
  }

  let notificationsSent = 0

  for (const event of events as { id: string; title: string; event_date: string }[]) {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: PARIS_TZ }).format(
      new Date(event.event_date)
    )
    const isJ7 = day === dateJ7

    const payload = {
      title: isJ7 ? `📅 Dans 7 jours : ${event.title}` : `⏰ Demain : ${event.title}`,
      body: isJ7
        ? `N'oubliez pas ! L'événement "${event.title}" aura lieu dans une semaine.`
        : `Rappel de dernière minute pour "${event.title}". Cliquez pour revoir les détails.`,
      url: `/events/${event.id}`,
    }

    const result = await sendToSubscriptions(admin, subscriptions, payload)
    notificationsSent += result.sent
  }

  return NextResponse.json({
    success: true,
    eventsProcessed: events.length,
    notificationsSent,
  })
}
