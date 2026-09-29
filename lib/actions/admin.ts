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