'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from './_guards'
import { ALL_ROLES, type Role } from '@/types/roles'

export type AdminFormState = { ok: boolean; error?: string }

/**
 * Change le rôle d'un membre.
 *
 * Avant : aucune validation de `role` (n'importe quelle chaîne était écrite en
 * base, y compris une valeur qui ne correspond à aucun rôle) et un admin
 * pouvait retirer son propre rôle d'admin, se verrouillant dehors.
 */
export async function updateUserRole(formData: FormData): Promise<AdminFormState> {
  const { supabase, user } = await requireAdmin()

  const targetUserId = String(formData.get('userId') ?? '')
  const rawRole = String(formData.get('role') ?? '').trim().toLowerCase()

  if (!targetUserId) {
    return { ok: false, error: 'Utilisateur cible manquant.' }
  }

  if (!(ALL_ROLES as readonly string[]).includes(rawRole)) {
    return { ok: false, error: `Rôle invalide : « ${rawRole} ».` }
  }
  const newRole = rawRole as Role

  // Se retirer soi-même ses droits d'administration coupe l'accès à /admin.
  if (targetUserId === user.id && newRole !== 'admin') {
    return {
      ok: false,
      error: 'Tu ne peux pas retirer ton propre rôle d’administrateur.',
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)

  if (error) {
    console.error('Erreur mise à jour rôle :', error)
    return { ok: false, error: 'Impossible de mettre à jour le rôle.' }
  }

  revalidatePath('/admin')
  return { ok: true }
}

/** Met à jour les indicateurs financiers affichés sur le tableau de bord. */
export async function updateAssociationStats(formData: FormData): Promise<AdminFormState> {
  const { supabase } = await requireAdmin()

  const parseAmount = (value: FormDataEntryValue | null): number | null => {
    if (value === null || String(value).trim() === '') return 0
    const parsed = Number(String(value).replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed < 0) return null
    return Math.round(parsed * 100) / 100
  }

  const totalProfits = parseAmount(formData.get('totalProfits'))
  const totalSchoolExpenses = parseAmount(formData.get('totalSchoolExpenses'))

  if (totalProfits === null || totalSchoolExpenses === null) {
    return { ok: false, error: 'Les montants doivent être des nombres positifs.' }
  }

  const { error } = await supabase
    .from('association_stats')
    .update({
      total_profits: totalProfits,
      total_school_expenses: totalSchoolExpenses,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (error) {
    console.error('Erreur mise à jour des stats de l’association :', error)
    return { ok: false, error: 'Erreur lors de la mise à jour des indicateurs financiers.' }
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { ok: true }
}
