'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string) || 0
  const external_link = formData.get('external_link') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string

  const { error } = await supabase.from('products').insert({
    name,
    description,
    price,
    external_link,
    start_date: start_date || null,
    end_date: end_date || null,
  })

  if (error) {
    console.error('Erreur lors de la création du produit :', error)
    return
  }

  revalidatePath('/shop')
}

export async function createOrder(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const productId = formData.get('productId') as string
  const quantity = parseInt(formData.get('quantity') as string, 10)

  const { data: product } = await supabase
    .from('products')
    .select('price')
    .eq('id', productId)
    .single()

  if (!product) throw new Error('Produit introuvable')

  const totalPrice = product.price * quantity

  const { error } = await supabase.from('orders').insert({
    user_id: user.id,
    product_id: productId,
    quantity,
    total_price: totalPrice,
    status: 'pending',
  })

  if (error) {
    console.error('Erreur commande :', error)
    return
  }

  revalidatePath('/shop')
}