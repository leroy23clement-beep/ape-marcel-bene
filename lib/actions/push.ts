'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  cleanPayload,
  configureWebPush,
  getStaffUser,
  getSubscriptions,
  normalizeTarget,
  rolesForTarget,
  sendToSubscriptions,
  vapidErrorMessage,
} from '@/lib/push'

export async function sendPushNotification(formData: FormData) {
  // Seul le bureau peut envoyer des notifications
  const user = await getStaffUser()
  if (!user) {
    return { success: false, message: 'Droit refusé : réservé au bureau.' }
  }

  if (!configureWebPush()) {
    return { success: false, message: vapidErrorMessage() }
  }

  const payload = cleanPayload({ title: formData.get('title'), body: formData.get('body') })
  if (!payload) {
    return {
      success: false,
      message: 'Le titre (100 caractères max) et le message (300 max) sont obligatoires.',
    }
  }

  const target = normalizeTarget(formData.get('target'))
  if (!target) {
    return { success: false, message: 'Destinataires invalides.' }
  }

  try {
    const admin = createAdminClient()
    const subscriptions = await getSubscriptions(admin, rolesForTarget(target))

    if (subscriptions.length === 0) {
      return { success: false, message: 'Aucun destinataire ne correspond à ce filtre.' }
    }

    const result = await sendToSubscriptions(admin, subscriptions, payload)
    return {
      success: true,
      message: `Notification envoyée avec succès à ${result.sent} appareil(s) !`,
    }
  } catch (err) {
    console.error("Erreur lors de l'envoi des notifications :", err)
    return { success: false, message: "Erreur serveur lors de l'envoi." }
  }
}
