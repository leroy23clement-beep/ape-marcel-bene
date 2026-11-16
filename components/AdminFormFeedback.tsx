'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

/**
 * Retour utilisateur pour les formulaires `/admin` qui utilisent
 * `action={serverAction}` : le résultat de l'action (`{ ok, error }`) n'était
 * affiché nulle part, une erreur était donc totalement silencieuse.
 */
export default function AdminFormFeedback({
  state,
}: {
  state?: { ok?: boolean; error?: string } | null
}) {
  useEffect(() => {
    if (!state) return
    if (state.ok) toast.success('Modification enregistrée.')
    else if (state.error) toast.error(state.error)
  }, [state])

  return null
}
