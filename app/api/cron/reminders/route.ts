import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  CODIR_ROLES,
  SECRETARIAT_ROLES,
  configureWebPush,
  getSubscriptions,
  sendToSubscriptions,
} from '@/lib/push'

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  // Sans secret configuré, on refuse tout (évite que "Bearer undefined" passe)
  if (!secret) return false

  const received = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

/** Date AAAA-MM-JJ à Paris, avec un décalage en jours. */
function parisDate(offsetDays: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(d)
}

/** Rôles destinataires selon la visibilité de l'événement (undefined = tout le monde, null = personne). */
function rolesForVisibility(visibility: string): string[] | undefined | null {
  if (visibility === 'public') return undefined
  if (visibility === 'codir') return CODIR_ROLES
  if (visibility === 'secretariat') return SECRETARIAT_ROLES
  return null
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new NextResponse('Non autorisé', { status: 401 })
  }

  if (!configureWebPush()) {
    return NextResponse.json(
      { error: "Clés VAPID manquantes dans les variables d'environnement Vercel." },
      { status: 500 }
    )
  }

  try {
    const admin = createAdminClient()
    const dateJ1 = parisDate(1)
    const dateJ7 = parisDate(7)

    const { data: events, error: eventsError } = await admin
      .from('events')
      .select('id, title, date, visibility')
      .in('date', [dateJ1, dateJ7])

    if (eventsError) throw eventsError
    if (!events || events.length === 0) {
      return NextResponse.json({ message: "Aucun événement concerné aujourd'hui." })
    }

    let notificationsSent = 0

    for (const event of events) {
      const roles = rolesForVisibility(event.visibility ?? 'public')
      if (roles === null) continue // visibilité inconnue : on n'envoie rien

      const subscriptions = await getSubscriptions(admin, roles)
      if (subscriptions.length === 0) continue

      const isJ7 = event.date === dateJ7
      const result = await sendToSubscriptions(admin, subscriptions, {
        title: isJ7 ? `📅 Dans 7 jours : ${event.title}` : `⏰ Demain : ${event.title}`,
        body: isJ7
          ? `N'oubliez pas ! L'événement "${event.title}" aura lieu dans une semaine.`
          : `Rappel de dernière minute pour "${event.title}". Cliquez pour revoir les détails.`,
        url: `/events/${event.id}`,
      })
      notificationsSent += result.sent
    }

    return NextResponse.json({
      success: true,
      eventsProcessed: events.length,
      notificationsSent,
    })
  } catch (err) {
    console.error('Erreur cron rappels :', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
