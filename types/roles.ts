/**
 * Source unique des rôles de l'application.
 *
 * Avant, ce fichier contenait une copie de `types/database.ts` (donc ni
 * `Role` ni `ADMIN_ROLES`), ce qui cassait `lib/auth.ts`. Les rôles sont
 * désormais centralisés ici pour que les écrans et les actions serveur
 * comparent la même liste.
 */

/** Tous les rôles connus (utilisé par `normalizeRole`). */
export const ALL_ROLES = [
  "parent",
  "membre_codir",
  "bureau",
  "president",
  "vice_president",
  "secretaire",
  "vice_secretaire",
  "tresorier",
  "vice_tresorier",
  "admin",
] as const satisfies readonly Role[];

export type Role =
  | "parent"
  | "membre_codir"
  | "bureau"
  | "president"
  | "vice_president"
  | "secretaire"
  | "vice_secretaire"
  | "tresorier"
  | "vice_tresorier"
  | "admin";

/** Rôles autorisés à accéder aux pages et actions d'administration. */
export const ADMIN_ROLES: Role[] = ["president", "admin"];

/** Rôles du bureau / CODIR : accès aux outils de gestion (stocks, finances, bureau). */
export const BUREAU_ROLES: Role[] = [
  "admin",
  "president",
  "vice_president",
  "secretaire",
  "vice_secretaire",
  "tresorier",
  "vice_tresorier",
  "bureau",
  "membre_codir",
];

/** Rôles pouvant envoyer une notification push à toute l'association. */
export const PUSH_SENDER_ROLES: Role[] = ["admin", "tresorier", "secretaire"];

/** Normalise un rôle venant de la base (casse, espaces, valeur inattendue). */
export function normalizeRole(value: unknown): Role | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().toLowerCase();
  return (ALL_ROLES as readonly string[]).includes(cleaned) ? (cleaned as Role) : null;
}

/** Vrai si le rôle fait partie de la liste (comparaison insensible à la casse). */
export function hasRole(
  role: string | null | undefined,
  allowed: readonly Role[]
): boolean {
  const normalized = normalizeRole(role);
  return normalized !== null && allowed.includes(normalized);
}
