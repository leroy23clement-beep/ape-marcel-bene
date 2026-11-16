'use server'

import { revalidatePath } from 'next/cache'
import { AuthorizationError, requireBureau } from '@/lib/actions/_guards'

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_PHOTO_BYTES = 3 * 1024 * 1024 // 3 Mo

/**
 * Ajout d'un membre au trombinoscope.
 *
 * Avant : seul « un utilisateur est connecté » était vérifié, donc n'importe
 * quel parent pouvait ajouter un membre au bureau, et le fichier envoyé
 * (type, taille) n'était pas contrôlé.
 */
export async function addTeamMember(formData: FormData) {
  let guarded
  try {
    guarded = await requireBureau()
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { success: false, error: err.message }
    }
    throw err
  }
  const { supabase } = guarded

  try {
    const firstName = String(formData.get('firstName') ?? '').trim()
    const lastName = String(formData.get('lastName') ?? '').trim()
    const roleTitle = String(formData.get('roleTitle') ?? '').trim()
    const photoFile = formData.get('photoFile')

    if (!firstName || !lastName || !roleTitle) {
      return { success: false, error: 'Veuillez remplir les champs obligatoires (Prénom, Nom, Rôle).' }
    }

    let photoUrl: string | null = null

    if (photoFile instanceof File && photoFile.size > 0) {
      if (!ALLOWED_PHOTO_TYPES.includes(photoFile.type)) {
        return { success: false, error: 'Photo refusée : formats acceptés JPG, PNG, WEBP ou GIF.' }
      }
      if (photoFile.size > MAX_PHOTO_BYTES) {
        return { success: false, error: 'Photo trop lourde (3 Mo maximum).' }
      }

      const fileExt = (photoFile.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!fileExt) {
        return { success: false, error: 'Le nom du fichier photo n’a pas d’extension.' }
      }
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('team-photos')
        .upload(fileName, photoFile, { contentType: photoFile.type })

      if (uploadError) {
        return { success: false, error: 'Erreur Storage : ' + uploadError.message }
      }

      const { data: publicUrlData } = supabase.storage
        .from('team-photos')
        .getPublicUrl(fileName)

      photoUrl = publicUrlData.publicUrl
    }

    const { error: insertError } = await supabase.from('bureau_members').insert({
      first_name: firstName,
      last_name: lastName,
      role_title: roleTitle,
      photo_url: photoUrl,
    })

    if (insertError) {
      return { success: false, error: 'Erreur Insertion Base de données : ' + insertError.message }
    }

    revalidatePath('/about')
    revalidatePath('/team')
    revalidatePath('/bureau/team')

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Une erreur interne est survenue.'
    console.error('ERREUR LORS DE L’AJOUT DU MEMBRE:', message)
    return { success: false, error: message }
  }
}
