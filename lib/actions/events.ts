'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEvent(formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non autorisé')

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const event_date = formData.get('event_date') as string
    const location = formData.get('location') as string
    const visibility = formData.get('visibility') as string || 'public'
    const image_url = formData.get('image_url') as string || null

    const { error } = await supabase.from('events').insert({
      title,
      description,
      event_date,
      location,
      visibility,
      is_internal: visibility !== 'public',
      image_url,
    })

    if (error) {
      console.error('Erreur insertion base de données :', error.message)
      throw new Error(`Erreur base de données : ${error.message}`)
    }

    revalidatePath('/events')
  } catch (err: any) {
    console.error('Erreur globale createEvent :', err.message)
    throw err
  }
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