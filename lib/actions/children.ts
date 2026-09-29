'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addChild(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) throw new Error('Foyer introuvable')

  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const className = formData.get('className') as string

  const { error } = await supabase.from('children').insert({
    household_id: profile.household_id,
    first_name: firstName,
    last_name: lastName,
    class_name: className,
  })

  if (error) {
    console.error('Erreur lors de l\'ajout de l\'enfant:', error)
    return { error: 'Impossible d\'ajouter l\'enfant' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}