'use server'

import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:contact@ape-marcel-bene.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushNotification(formData: FormData) {
  const title = formData.get('title') as string
  const body = formData.get('body') as string
  const target = formData.get('target') as string // 'all' | 'bureau' | 'restricted'

  if (!title || !body) {
    return { success: false, message: "Le titre et le message sont obligatoires." }
  }

  const supabase = await createClient()

  // On récupère les abonnements avec le profil/rôle associé
  let query = supabase
    .from('push_subscriptions')
    .select('subscription, user_id, profiles(role, first_name)')

  const { data: subscriptions, error } = await query

  if (error || !subscriptions || subscriptions.length === 0) {
    return { success: false, message: "Aucun abonné trouvé pour les notifications." }
  }

  // Filtrer selon la cible choisie
  const filteredSubscriptions = subscriptions.filter((sub: any) => {
    const role = sub.profiles?.role?.toLowerCase() || ''
    const firstName = sub.profiles?.first_name?.toLowerCase() || ''

    if (target === 'all') {
      return true
    } else if (target === 'bureau') {
      const bureauRoles = ['admin', 'president', 'secretaire', 'tresorier', 'bureau']
      return bureauRoles.includes(role)
    } else if (target === 'restricted') {
      // Trésorier, Secrétaire, Admin (toi)
      const restrictedRoles = ['admin', 'tresorier', 'secretaire']
      return restrictedRoles.includes(role) || firstName === 'clément'
    }
    return false
  })

  if (filteredSubscriptions.length === 0) {
    return { success: false, message: "Aucun destinataire ne correspond à ce filtre." }
  }

  const payload = JSON.stringify({ title, body })

  const sendPromises = filteredSubscriptions.map(async (sub: any) => {
    try {
      await webpush.sendNotification(sub.subscription, payload)
    } catch (err) {
      console.error("Erreur lors de l'envoi de la notification push :", err)
    }
  })

  await Promise.all(sendPromises)

  return { success: true, message: `Notification envoyée avec succès à ${filteredSubscriptions.length} appareil(s) !` }
}