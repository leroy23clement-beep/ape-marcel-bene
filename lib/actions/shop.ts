'use server'

import { revalidatePath } from 'next/cache'
import { AuthorizationError, requireBureau, requireUser } from './_guards'

// Types minimaux : le projet n'a pas encore de `Database` généré
// (`lib/database.type.ts` vaut `any`), on se contente du nécessaire.
type ProductRow = { price: number | null; is_closed: boolean | null }

/**
 * Création / modification d'un produit de la boutique.
 *
 * Avant : seule la présence d'un utilisateur connecté était vérifiée, donc
 * n'importe quel parent pouvait publier un produit.
 */
export async function createProduct(formData: FormData) {
  let guarded
  try {
    guarded = await requireBureau()
  } catch (err) {
    if (err instanceof AuthorizationError) return { ok: false, error: err.message }
    throw err
  }
  const { supabase } = guarded

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { ok: false, error: 'Le nom du produit est obligatoire.' }

  const rawPrice = String(formData.get('price') ?? '').replace(',', '.')
  const price = rawPrice === '' ? 0 : Number(rawPrice)
  if (!Number.isFinite(price) || price < 0 || price > 5000) {
    return { ok: false, error: 'Prix invalide.' }
  }

  const description = String(formData.get('description') ?? '').trim()
  const externalLink = String(formData.get('external_link') ?? '').trim()
  if (externalLink && !/^https:\/\//i.test(externalLink)) {
    return { ok: false, error: 'Le lien externe doit commencer par https://' }
  }

  const startDate = String(formData.get('start_date') ?? '')
  const endDate = String(formData.get('end_date') ?? '')
  if (startDate && endDate && startDate > endDate) {
    return { ok: false, error: 'La date de fin précède la date de début.' }
  }

  const { error } = await supabase.from('products').insert({
    name,
    description: description || null,
    price: Math.round(price * 100) / 100,
    external_link: externalLink || null,
    start_date: startDate || null,
    end_date: endDate || null,
  })

  if (error) {
    console.error('Erreur lors de la création du produit :', error)
    return { ok: false, error: 'Impossible de créer le produit.' }
  }

  revalidatePath('/shop')
  return { ok: true }
}

/**
 * Commande d'un produit.
 *
 * Le prix et l'état de la vente sont relus en base côté serveur : le client
 * envoyait auparavant un prix et un statut calculés dans le navigateur, donc
 * modifiables (commande à 0 €), et son `user.id` pouvait être absent.
 */
export async function createOrder(formData: FormData) {
  const { supabase, user } = await requireUser()

  const productId = String(formData.get('productId') ?? '')
  const quantity = Number.parseInt(String(formData.get('quantity') ?? ''), 10)

  if (!productId) return { ok: false, error: 'Produit manquant.' }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return { ok: false, error: 'Quantité invalide (entre 1 et 99).' }
  }

  // Les colonnes réellement ajoutées (`is_closed`) ne sont pas typées dans le
  // projet ; la lecture est donc faite via un cast minimal.
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return { ok: false, error: 'Produit introuvable.' }
  }

  const productRow = product as ProductRow
  if (productRow.is_closed) {
    return { ok: false, error: 'Cette vente est clôturée.' }
  }

  const unitPrice = Number(productRow.price ?? 0)
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return { ok: false, error: 'Prix du produit invalide.' }
  }
  const totalPrice = Math.round(unitPrice * quantity * 100) / 100

  const { error } = await supabase.from('orders').insert({
    user_id: user.id,
    product_id: productId,
    quantity,
    total_price: totalPrice,
    status: 'pending',
  })

  if (error) {
    console.error('Erreur commande :', error)
    return { ok: false, error: 'Impossible d’enregistrer la commande.' }
  }

  revalidatePath('/shop')
  return { ok: true, totalPrice }
}
