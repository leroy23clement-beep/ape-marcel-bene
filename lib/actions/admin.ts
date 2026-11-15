'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Rôles autorisés à gérer l'association (rôles et indicateurs financiers)
const MANAGER_ROLES: readonly string[] = ['president', 'admin']

// Doit rester identique à la liste de la fonction SQL public.set_user_role
const ASSIGNABLE_ROLES: readonly string[] = [
  'parent',
  'bureau',
  'membre_codir',
  'president',
  'vice_president',
  'secretaire',
  'vice_secretaire',
  'tresorier',
  'vice_tresorier',
  'admin',
]

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Vérifie la session puis le rôle de l'appelant.
 * Lance une erreur si l'utilisateur n'est pas connecté ou n'a pas le droit.
 */
async function requireRole(allowed: readonly string[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !allowed.includes(profile.role)) {
    throw new Error('Droit refusé : réservé à la Présidence ou Administration')
  }

  return { supabase, user, role: profile.role as string }
}

/** Convertit un champ de formulaire en montant valide (accepte "12,50"). */
function parseAmount(value: FormDataEntryValue | null, label: string): number {
  const raw =
    typeof value === 'string' ? value.trim().replace(/\s/g, '').replace(',', '.') : ''

  if (raw === '') throw new Error(`${label} : valeur manquante`)

  const amount = Number(raw)
  if (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000) {
    throw new Error(`${label} : montant invalide`)
  }

  return Math.round(amount * 100) / 100
}

export async function updateUserRole(formData: FormData) {
  const { supabase, user, role: callerRole } = await requireRole(MANAGER_ROLES)

  const targetUserId = formData.get('userId')
  const newRole = formData.get('role')

  if (typeof targetUserId !== 'string' || !UUID_RE.test(targetUserId)) {
    throw new Error('Utilisateur invalide')
  }
  if (typeof newRole !== 'string' || !ASSIGNABLE_ROLES.includes(newRole)) {
    throw new Error('Rôle invalide')
  }
  if (targetUserId === user.id) {
    throw new Error('Tu ne peux pas modifier ton propre rôle')
  }
  if (newRole === 'admin' && callerRole !== 'admin') {
    throw new Error('Seul un administrateur peut nommer un administrateur')
  }

  // Le changement passe par une fonction SQL sécurisée (la colonne role
  // n'est plus modifiable directement depuis le client).
  const { error } = await supabase.rpc('set_user_role', {
    target: targetUserId,
    new_role: newRole,
  })

  if (error) {
    console.error('Erreur mise à jour rôle :', error)
    throw new Error('Impossible de modifier le rôle')
  }

  revalidatePath('/admin')
}

export async function updateAssociationStats(formData: FormData) {
  const { supabase } = await requireRole(MANAGER_ROLES)

  const totalProfits = parseAmount(formData.get('totalProfits'), 'Bénéfices totaux')
  const totalSchoolExpenses = parseAmount(
    formData.get('totalSchoolExpenses'),
    'Dépenses pour l\'école'
  )

  // Mise à jour de la table association_stats (ligne id = 1)
  const { error } = await supabase
    .from('association_stats')
    .update({
      total_profits: totalProfits,
      total_school_expenses: totalSchoolExpenses,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (error) {
    console.error('Erreur mise à jour des stats de l\'association :', error)
    throw new Error('Erreur lors de la mise à jour des indicateurs financiers')
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
}