import 'server-only'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import {
  ADMIN_ROLES,
  BUREAU_ROLES,
  hasRole,
  normalizeRole,
  type Role,
} from '@/types/roles'

/**
 * Gardes d'autorisation pour les Server Actions.
 *
 * Constat de la revue : plusieurs actions (`sendPushNotification`,
 * `updateMembershipStatus`, `createProduct`, `addTeamMember`) se contentaient
 * de vérifier « un utilisateur est connecté ». N'importe quel parent pouvait
 * donc valider sa propre adhésion, publier un produit ou envoyer une
 * notification à toute l'association. Ces gardes vérifient le rôle côté
 * serveur, avant toute écriture.
 */

export type Guarded = {
  supabase: SupabaseClient<any, 'public', any>
  user: User
  role: Role
}

export class AuthorizationError extends Error {
  constructor(message = 'Droit refusé.') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/** Récupère l'utilisateur connecté et son rôle normalisé, ou lève une erreur. */
export async function requireUser(): Promise<Guarded> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new AuthorizationError('Non authentifié.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = normalizeRole(profile?.role)
  if (!role) throw new AuthorizationError('Rôle inconnu.')

  return { supabase, user, role }
}

/** Garde générique : l'utilisateur doit avoir l'un des rôles fournis. */
export async function requireRole(allowed: readonly Role[]): Promise<Guarded> {
  const guarded = await requireUser()
  if (!allowed.includes(guarded.role)) {
    throw new AuthorizationError('Droit refusé : rôle insuffisant.')
  }
  return guarded
}

/** Réservé à la présidence et à l'administration. */
export function requireAdmin(): Promise<Guarded> {
  return requireRole(ADMIN_ROLES)
}

/** Réservé au bureau / CODIR. */
export function requireBureau(): Promise<Guarded> {
  return requireRole(BUREAU_ROLES)
}

/** Vrai si l'utilisateur courant a le rôle donné (pour filtrer une réponse). */
export function guardHasRole(guarded: Guarded, allowed: readonly Role[]): boolean {
  return hasRole(guarded.role, allowed)
}
