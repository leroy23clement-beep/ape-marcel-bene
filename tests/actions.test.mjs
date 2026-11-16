/**
 * Tests d'autorisation des Server Actions.
 *
 * La règle testée : un membre « parent » (ou sans rôle) ne doit JAMAIS pouvoir
 * écrire ni notifier. Ces tests tournent sans base de données : le client
 * Supabase est remplacé par une doublure (voir `tests/setup.mjs`).
 *
 * Lancer : `npm test`
 */
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { resetSupabase, redirigeVers, aEcrit } from './setup.mjs'

const PARENT = { id: 'user-parent', email: 'parent@example.com' }
const BUREAU = { id: 'user-bureau', email: 'bureau@example.com' }

/** Cible d'erreur commune aux gardes de rôle. */
const DROIT_REFUSE = /réserv|bureau|autoris|refus/i

const formData = (values) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

/** Message d'un retour d'action (`{ error }` ou `{ ok: false, error }`). */
const erreur = (result) => (result && (result.error ?? result.message)) || ''

/** Vrai si l'action a refusé l'opération, sans rien écrire en base. */
const refus = (result) => Boolean(result && (result.ok === false || result.error)) && aEcrit() === false

beforeEach(() => {
  // Chaque test fixe son contexte avec `resetSupabase({...})`.
  resetSupabase({})
})

// ---------------------------------------------------------------------------
// 1. updateMembershipStatus — réservé au bureau
// ---------------------------------------------------------------------------
test('updateMembershipStatus : un parent ne peut pas valider une adhésion', async () => {
  resetSupabase({ user: PARENT, tables: { profiles: { row: { role: 'parent' } } } })

  const { updateMembershipStatus } = await import('@/lib/actions/membership.ts')
  const result = await updateMembershipStatus(
    formData({ membershipId: 'adh-1', status: 'validated' })
  )

  assert.ok(refus(result), 'un parent doit être refusé, sans aucune écriture')
  assert.match(erreur(result), DROIT_REFUSE)
})

test('updateMembershipStatus : un bureau ne peut pas valider sa propre adhésion', async () => {
  resetSupabase({
    user: BUREAU,
    tables: {
      profiles: { row: { role: 'tresorier' } },
      memberships: { row: { id: 'adh-2', user_id: BUREAU.id, status: 'pending' } },
    },
  })

  const { updateMembershipStatus } = await import('@/lib/actions/membership.ts')
  const result = await updateMembershipStatus(
    formData({ membershipId: 'adh-2', status: 'validated' })
  )

  assert.equal(aEcrit(), false, 'aucune écriture ne doit être tentée')
  assert.match(erreur(result), /propre|vous-même|soi/i)
})

test("updateMembershipStatus : un bureau valide l'adhésion d'un autre membre", async () => {
  const client = resetSupabase({
    user: BUREAU,
    tables: {
      profiles: { row: { role: 'tresorier' } },
      memberships: { row: { id: 'adh-3', user_id: 'autre-user', status: 'pending' } },
    },
  })

  const { updateMembershipStatus } = await import('@/lib/actions/membership.ts')
  const result = await updateMembershipStatus(
    formData({ membershipId: 'adh-3', status: 'validated' })
  )

  assert.ok(!erreur(result), `pas d'erreur attendue, reçu : ${erreur(result)}`)
  const ecriture = client.calls.find(
    (call) => call.table === 'memberships' && call.mode === 'update'
  )
  assert.ok(ecriture, 'un update sur memberships est attendu')
  assert.equal(ecriture.payload.status, 'validated')
})

test('updateMembershipStatus : un statut inconnu est refusé', async () => {
  resetSupabase({
    user: BUREAU,
    tables: {
      profiles: { row: { role: 'tresorier' } },
      memberships: { row: { id: 'adh-4', user_id: 'autre-user' } },
    },
  })

  const { updateMembershipStatus } = await import('@/lib/actions/membership.ts')
  const result = await updateMembershipStatus(formData({ membershipId: 'adh-4', status: 'paye' }))

  assert.equal(aEcrit(), false, 'un statut hors liste ne doit rien écrire')
  assert.ok(erreur(result))
})

// ---------------------------------------------------------------------------
// 2. createProduct — réservé au bureau
// ---------------------------------------------------------------------------
test('createProduct : un parent ne peut pas créer un produit', async () => {
  resetSupabase({ user: PARENT, tables: { profiles: { row: { role: 'parent' } } } })

  const { createProduct } = await import('@/lib/actions/shop.ts')
  const result = await createProduct(
    formData({ name: 'T-shirt', price: '12', stock: '10', description: 'Coton' })
  )

  assert.ok(refus(result), 'un parent doit être refusé, sans aucune écriture')
  assert.match(erreur(result), DROIT_REFUSE)
})

test('createProduct : un prix négatif est refusé', async () => {
  resetSupabase({ user: BUREAU, tables: { profiles: { row: { role: 'bureau' } } } })

  const { createProduct } = await import('@/lib/actions/shop.ts')
  const result = await createProduct(formData({ name: 'Mug', price: '-3', stock: '5' }))

  assert.equal(aEcrit(), false)
  assert.ok(erreur(result))
})

test('createProduct : un bureau crée le produit', async () => {
  const client = resetSupabase({ user: BUREAU, tables: { profiles: { row: { role: 'bureau' } } } })

  const { createProduct } = await import('@/lib/actions/shop.ts')
  const result = await createProduct(
    formData({ name: 'T-shirt', price: '12,50', stock: '10', description: 'Coton bio' })
  )

  assert.ok(!erreur(result), `pas d'erreur attendue, reçu : ${erreur(result)}`)
  const ecriture = client.calls.find((call) => call.table === 'products' && call.mode === 'insert')
  assert.ok(ecriture, 'un insert dans products est attendu')
  assert.equal(ecriture.payload.price, 12.5, 'le prix « 12,50 » doit être converti en 12.5')
})

// ---------------------------------------------------------------------------
// 3. createOrder — le prix vient de la base, jamais du navigateur
// ---------------------------------------------------------------------------
test('createOrder : le prix envoyé par le navigateur est ignoré', async () => {
  const client = resetSupabase({
    user: PARENT,
    tables: {
      profiles: { row: { role: 'parent' } },
      products: { row: { id: 'prod-1', price: 20, is_closed: false, stock: 5 } },
    },
  })

  const { createOrder } = await import('@/lib/actions/shop.ts')
  const result = await createOrder(
    formData({ productId: 'prod-1', quantity: '1', price: '0.01', total_price: '0.01' })
  )

  assert.ok(!erreur(result), `pas d'erreur attendue, reçu : ${erreur(result)}`)
  const ecriture = client.calls.find((call) => call.table === 'orders' && call.mode === 'insert')
  assert.ok(ecriture, 'un insert dans orders est attendu')
  assert.equal(ecriture.payload.total_price, 20, 'le total doit venir du prix en base (20 €)')
})

test('createOrder : un produit fermé aux commandes est refusé', async () => {
  resetSupabase({
    user: PARENT,
    tables: {
      profiles: { row: { role: 'parent' } },
      products: { row: { id: 'prod-2', price: 20, is_closed: true, stock: 5 } },
    },
  })

  const { createOrder } = await import('@/lib/actions/shop.ts')
  const result = await createOrder(formData({ productId: 'prod-2', quantity: '1' }))

  assert.equal(aEcrit(), false, 'aucune commande ne doit être créée')
  assert.ok(erreur(result))
})

// ---------------------------------------------------------------------------
// 4. addTeamMember — réservé au bureau
// ---------------------------------------------------------------------------
test("addTeamMember : un parent ne peut pas modifier l'équipe du bureau", async () => {
  resetSupabase({ user: PARENT, tables: { profiles: { row: { role: 'parent' } } } })

  const { addTeamMember } = await import('@/app/bureau/team/actions.ts')
  const result = await addTeamMember(
    formData({ first_name: 'Jean', last_name: 'Dupont', role: 'president' })
  )

  assert.ok(refus(result), 'un parent doit être refusé')
  assert.match(erreur(result), DROIT_REFUSE)
})

test('addTeamMember : une image non autorisée est refusée', async () => {
  resetSupabase({ user: BUREAU, tables: { profiles: { row: { role: 'bureau' } } } })

  // Un PDF renommé en .jpg reste un PDF : le type MIME prime sur l'extension.
  const pdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'photo.jpg', {
    type: 'application/pdf',
  })
  const data = formData({ first_name: 'Jean', last_name: 'Dupont', role: 'president' })
  data.set('photo', pdf)

  const { addTeamMember } = await import('@/app/bureau/team/actions.ts')
  const result = await addTeamMember(data)

  assert.equal(aEcrit(), false, 'aucun upload ne doit être tenté')
  assert.ok(erreur(result))
})

// ---------------------------------------------------------------------------
// 5. updateUserRole — pas d'auto-verrouillage
// ---------------------------------------------------------------------------
test('updateUserRole : un admin ne peut pas retirer son propre rôle', async () => {
  resetSupabase({ user: BUREAU, tables: { profiles: { row: { role: 'admin' } } } })

  const { updateUserRole } = await import('@/lib/actions/admin.ts')
  const result = await updateUserRole(formData({ userId: BUREAU.id, role: 'parent' }))

  assert.equal(aEcrit(), false)
  assert.match(erreur(result), /propre|dernier admin|vous-même/i)
})

test('updateUserRole : un rôle inconnu est refusé', async () => {
  resetSupabase({ user: BUREAU, tables: { profiles: { row: { role: 'admin' } } } })

  const { updateUserRole } = await import('@/lib/actions/admin.ts')
  const result = await updateUserRole(formData({ userId: 'autre-user', role: 'super-admin' }))

  assert.equal(aEcrit(), false)
  assert.ok(erreur(result))
})

// ---------------------------------------------------------------------------
// 6. Redirections : pas de destination externe
// ---------------------------------------------------------------------------
test('signIn : une destination externe est remplacée par /dashboard', async () => {
  resetSupabase({ user: PARENT, tables: { profiles: { row: { role: 'parent' } } } })

  const { signIn } = await import('@/lib/actions/auth.ts')
  await signIn(
    formData({ email: 'parent@example.com', password: 'motdepasse', next: 'https://exemple.com' })
  ).catch(() => {})

  assert.equal(redirigeVers(), '/dashboard')
})
