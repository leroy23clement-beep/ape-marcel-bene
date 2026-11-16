'use server'

import { revalidatePath } from 'next/cache'
import { AuthorizationError, requireBureau, requireUser } from './_guards'

/**
 * Création d'un événement.
 *
 * Avant : `visibility` et `event_date` venaient du formulaire sans contrôle
 * (une date vide ou invalide partait en base) et aucune vérification de rôle
 * n'était faite autrement que par la RLS.
 */
export async function createEvent(formData: FormData) {
  let guarded
  try {
    guarded = await requireBureau()
  } catch (err) {
    if (err instanceof AuthorizationError) return { ok: false, error: err.message }
    throw err
  }
  const { supabase } = guarded

  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { ok: false, error: 'Le titre est obligatoire.' }

  const rawDate = String(formData.get('event_date') ?? '')
  const eventDate = new Date(rawDate)
  if (!rawDate || Number.isNaN(eventDate.getTime())) {
    return { ok: false, error: 'Date de l’événement invalide.' }
  }

  const description = String(formData.get('description') ?? '')
  const location = String(formData.get('location') ?? '').trim()
  const visibility = String(formData.get('visibility') ?? 'public') === 'private' ? 'private' : 'public'
  const image_url = String(formData.get('image_url') ?? '').trim() || null

  const { error } = await supabase.from('events').insert({
    title,
    description,
    event_date: eventDate.toISOString(),
    location: location || null,
    visibility,
    is_internal: visibility !== 'public',
    image_url,
  })

  if (error) {
    console.error('Erreur insertion base de données :', error.message)
    return { ok: false, error: `Erreur base de données : ${error.message}` }
  }

  revalidatePath('/events')
  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Inscription d'un bénévole à un créneau.
 *
 * Avant : un double clic créait deux inscriptions (aucune contrainte gérée
 * côté action) et une erreur d'insertion était avalée (`return` sans message),
 * le formulaire semblait avoir fonctionné.
 */
export async function registerVolunteer(formData: FormData) {
  const { supabase, user } = await requireUser()

  const eventId = String(formData.get('eventId') ?? '')
  const roleNeeded = String(formData.get('roleNeeded') ?? '').trim()

  if (!eventId) return { ok: false, error: 'Événement manquant.' }
  if (!roleNeeded) return { ok: false, error: 'Créneau manquant.' }

  const { data: existing } = await supabase
    .from('event_volunteers')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .eq('role', roleNeeded)
    .maybeSingle()

  if (existing) {
    return { ok: false, error: 'Tu es déjà inscrit à ce créneau.' }
  }

  const { error } = await supabase.from('event_volunteers').insert({
    event_id: eventId,
    user_id: user.id,
    role: roleNeeded,
  })

  if (error) {
    console.error('Erreur inscription bénévole :', error)
    return { ok: false, error: 'Impossible de t’inscrire à ce créneau.' }
  }

  revalidatePath('/events')
  return { ok: true }
}
