import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import webpush from 'web-push'

export async function POST(request: Request) {
  try {
    // 1. Vérification sécurisée des clés VAPID à l'intérieur de la fonction
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, message: "Les clés VAPID ne sont pas configurées sur Vercel." },
        { status: 500 }
      )
    }

    webpush.setVapidDetails(
      'mailto:contact@ape-marcel-bene.fr',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )

    const supabase = createClient()
    const body = await request.json()
    const { title, message, target } = body

    // 2. Récupération des souscriptions avec gestion de repli (fallback)
    let query = supabase.from('push_subscriptions').select('*')

    // Si le filtre cible le bureau/codir
    if (target === 'bureau' || target === 'restreint') {
      const allowedRoles = ['admin', 'president', 'secretaire', 'tresorier', 'bureau']
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .in('role', allowedRoles)

      if (profiles && profiles.length > 0) {
        const allowedIds = profiles.map((p) => p.id)
        // Remarque : changez 'user_id' par 'profile_id' si votre table utilise ce nom
        query = query.in('user_id', allowedIds)
      }
    }

    const { data: subscriptions, error: subError } = await query

    if (subError) {
      console.error("Erreur lecture push_subscriptions:", subError)
      return NextResponse.json({ success: false, message: subError.message }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: false, message: 'Aucun appareil abonné trouvé pour ces destinataires.' }, { status: 400 })
    }

    let sentCount = 0
    const payload = JSON.stringify({
      title: title || '🔔 Notification APE',
      body: message || '',
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
        // Suppression automatique si le jeton est expiré/révoqué (410 ou 404)
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }

    return NextResponse.json({ success: true, sentCount })
  } catch (globalErr: any) {
    console.error("Erreur serveur notification:", globalErr)
    return NextResponse.json({ success: false, message: globalErr.message }, { status: 500 })
  }
}