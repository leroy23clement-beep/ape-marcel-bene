'use server'

import { revalidatePath } from 'next/cache'
import { AuthorizationError, requireBureau, requireUser } from './_guards'
import { hasRole } from '@/types/roles'

const PAYMENT_METHODS = ['helloasso', 'cheque', 'especes', 'virement'] as const
type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/**
 * Adhésion d'une famille.
 *
 * Avant : `status: 'validated'` dès que le moyen de paiement était HelloAsso,
 * donc une adhésion validée sans qu'aucun paiement n'ait été confirmé, et le
 * montant provenait du formulaire sans contrôle.
 */
export async function submitMembership(formData: FormData) {
  const { supabase, user } = await requireUser()

  const schoolYear = String(formData.get('schoolYear') ?? '').trim()
  if (!/^\d{4}-\d{4}$/.test(schoolYear)) {
    return { ok: false, error: 'Année scolaire invalide (format attendu : 2026-2027).' }
  }

  const rawAmount = String(formData.get('amount') ?? '').replace(',', '.')
  const amount = rawAmount === '' ? 5 : Number(rawAmount)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100) {
    return { ok: false, error: 'Montant invalide.' }
  }

  const rawMethod = String(formData.get('paymentMethod') ?? '').trim().toLowerCase()
  if (!(PAYMENT_METHODS as readonly string[]).includes(rawMethod)) {
    return { ok: false, error: 'Moyen de paiement invalide.' }
  }
  const paymentMethod = rawMethod as PaymentMethod

  const { error } = await supabase.from('memberships').insert({
    user_id: user.id,
    school_year: schoolYear,
    amount: Math.round(amount * 100) / 100,
    payment_method: paymentMethod,
    // Aucun moyen de paiement n'est confirmé par le client : l'adhésion reste
    // à valider par le bureau, HelloAsso compris, tant que le webhook de
    // paiement n'existe pas.
    status: 'pending',
  })

  if (error) {
    console.error('Erreur adhésion :', error)
    return { ok: false, error: 'Impossible d’enregistrer l’adhésion.' }
  }

  revalidatePath('/membership')
  return { ok: true }
}

const MEMBERSHIP_STATUSES = ['pending', 'validated', 'rejected'] as const

/**
 * Validation d'une adhésion par le bureau.
 *
 * Avant : seule la présence d'un utilisateur connecté était vérifiée, donc
 * n'importe quel parent pouvait valider sa propre adhésion.
 */
export async function updateMembershipStatus(formData: FormData) {
  let guarded
  try {
    guarded = await requireBureau()
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { ok: false, error: err.message }
    }
    throw err
  }
  const { supabase, user, role } = guarded

  const membershipId = String(formData.get('membershipId') ?? '')
  const status = String(formData.get('status') ?? '').trim().toLowerCase()

  if (!membershipId) return { ok: false, error: 'Adhésion manquante.' }
  if (!(MEMBERSHIP_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: 'Statut invalide.' }
  }

  // Un membre du bureau ne valide pas sa propre adhésion.
  const { data: membership, error: readError } = await supabase
    .from('memberships')
    .select('id, user_id')
    .eq('id', membershipId)
    .single()

  if (readError || !membership) {
    return { ok: false, error: 'Adhésion introuvable.' }
  }

  if (membership.user_id === user.id && !hasRole(role, ['admin', 'president'] as const)) {
    return { ok: false, error: 'Tu ne peux pas valider ta propre adhésion.' }
  }

  const { error } = await supabase
    .from('memberships')
    .update({ status })
    .eq('id', membershipId)

  if (error) {
    console.error('Erreur mise à jour adhésion :', error)
    return { ok: false, error: 'Impossible de mettre à jour l’adhésion.' }
  }

  revalidatePath('/membership')
  return { ok: true }
}
