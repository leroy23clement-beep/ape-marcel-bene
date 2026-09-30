'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  // Vérifier que l'utilisateur est Président ou Admin
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'president' && currentProfile?.role !== 'admin') {
    throw new Error('Droit refusé : réservé à la Présidence ou Administration')
  }

  const targetUserId = formData.get('userId') as string
  const newRole = formData.get('role') as string

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)

  if (error) {
    console.error('Erreur mise à jour rôle :', error)
    return
  }

  revalidatePath('/admin')
}

export async function updateAssociationStats(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  // Vérifier que l'utilisateur est Président ou Admin
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'president' && currentProfile?.role !== 'admin') {
    throw new Error('Droit refusé : réservé à la Présidence ou Administration')
  }

  const totalProfits = formData.get('totalProfits')
  const totalSchoolExpenses = formData.get('totalSchoolExpenses')

  // Mise à jour de la table association_stats (ligne id = 1)
  const { error } = await supabase
    .from('association_stats')
    .update({
      total_profits: totalProfits ? parseFloat(totalProfits as string) : 0,
      total_school_expenses: totalSchoolExpenses ? parseFloat(totalSchoolExpenses as string) : 0,
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