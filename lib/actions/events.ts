'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEvent(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const event_date = formData.get('event_date') as string
  const location = formData.get('location') as string
  const visibility = formData.get('visibility') as string || 'public'

  const { error } = await supabase.from('events').insert({
    title,
    description,
    event_date,
    location,
    visibility,
    is_internal: visibility !== 'public',
  })

  if (error) {
    console.error('Erreur lors de la création :', error)
    return
  }

  revalidatePath('/events')
}

export async function registerVolunteer(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const eventId = formData.get('eventId') as string
  const roleNeeded = formData.get('roleNeeded') as string

  const { error } = await supabase.from('event_volunteers').insert({
    event_id: eventId,
    user_id: user.id,
    role: roleNeeded,
  })

  if (error) {
    console.error('Erreur inscription bénévole :', error)
    return
  }

  revalidatePath('/events')
}