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

  if (!title || !body) {
    return { success: false, message: "Le titre et le message sont obligatoires." }
  }

  const supabase = await createClient()

  // Récupérer tous les abonnements enregistrés en base
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('subscription')

  if (error || !subscriptions || subscriptions.length === 0) {
    return { success: false, message: "Aucun abonnée trouvé pour les notifications." }
  }

  const payload = JSON.stringify({ title, body })

  // Envoyer la notification à tous les téléphones abonnés en parallèle
  const sendPromises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(sub.subscription, payload)
    } catch (err) {
      console.error("Erreur lors de l'envoi de la notification push :", err)
    }
  })

  await Promise.all(sendPromises)

  return { success: true, message: "Notification envoyée avec succès à tous les appareils !" }
}