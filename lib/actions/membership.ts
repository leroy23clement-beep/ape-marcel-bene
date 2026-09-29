'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitMembership(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const schoolYear = formData.get('schoolYear') as string
  const amount = parseFloat(formData.get('amount') as string) || 5.00
  const paymentMethod = formData.get('paymentMethod') as string

  const { error } = await supabase.from('memberships').insert({
    user_id: user.id,
    school_year: schoolYear,
    amount,
    payment_method: paymentMethod,
    status: paymentMethod === 'helloasso' ? 'validated' : 'pending',
  })

  if (error) {
    console.error('Erreur adhésion :', error)
    return
  }

  revalidatePath('/membership')
}

export async function updateMembershipStatus(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const membershipId = formData.get('membershipId') as string
  const status = formData.get('status') as string

  const { error } = await supabase
    .from('memberships')
    .update({ status })
    .eq('id', membershipId)

  if (error) {
    console.error('Erreur mise à jour adhésion :', error)
    return
  }

  revalidatePath('/membership')
}