'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import ProductTasksManager from '@/components/ProductTasksManager'

export default function ShopPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Champs du formulaire d'ajout / modification
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      fetchShopData(user.id)
    }
    loadData()
  }, [])

  const fetchShopData = async (userId: string) => {
    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts(prodData || [])

    const { data: ordData } = await supabase
      .from('orders')
      .select('*, products(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setUserOrders(ordData || [])
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      alert("Veuillez renseigner un nom de produit.")
      return
    }

    setLoading(true)
    try {
      const productData = {
        name,
        price: price ? parseFloat(price) : 0,
        external_link: externalLink || null,
        start_date: startDate || null,
        end_date: endDate || null,
        description: description || null,
      }

      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId)

        if (error) throw error
        alert("Vente mise à jour avec succès !")
      } else {
        const { error } = await supabase
          .from('products')
          .insert({ ...productData, is_closed: false })

        if (error) throw error
        alert("Vente / Produit publié avec succès !")
      }

      resetForm()
      if (user) fetchShopData(user.id)
    } catch (error: any) {
      console.error("Erreur:", error)
      alert("Erreur lors de l'enregistrement : " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = (product: any) => {
    setEditingId(product.id)
    setName(product.name || '')
    setPrice(product.price ? product.price.toString() : '')
    setExternalLink(product.external_link || '')
    setStartDate(product.start_date ? product.start_date.split('T')[0] : '')
    setEndDate(product.end_date ? product.end_date.split('T')[0] : '')
    setDescription(product.description || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette vente/produit ?")) return

    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      if (user) fetchShopData(user.id)
    } catch (error: any) {
      alert("Erreur lors de la suppression : " + error.message)
    }
  }

  const handleToggleCloseSale = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_closed: !currentStatus })
        .eq('id', productId)

      if (error) throw error
      if (user) fetchShopData(user.id)
    } catch (error: any) {
      alert("Erreur lors de la modification du statut : " + error.message)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setPrice('')
    setExternalLink('')
    setStartDate('')
    setEndDate('')
    setDescription('')
  }

  const handleOrder = async (productId: string, quantity: number) => {
    try {
      const product = products.find(p => p.id === productId)
      if (product?.is_closed) {
        alert("Cette vente est clôturée, il n'est plus possible de commander.")
        return
      }

      const totalPrice = (product?.price || 0) * quantity

      const { error } = await supabase.from('orders').insert({
        user_id: user.id,
        product_id: productId,
        quantity,
        total_price: totalPrice,
        status: 'pending'
      })

      if (error) throw error

      alert("Commande enregistrée avec succès !")
      fetchShopData(user.id)
    } catch (error: any) {
      console.error("Erreur commande:", error)
      alert("Erreur lors de la commande : " + error.message)
    }
  }

  const isBureau = profile?.role && profile.role !== "parent"

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-8">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Boutique & Ventes APE</h1>
          <p className="text-sm text-gray-600 mt-1">
            Commandez vos articles ou accédez aux ventes en ligne pour soutenir les projets de l'école.
          </p>
        </header>

        {isBureau && (
          <section className="bg-purple-50/50 border border-purple-200 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-purple-200 pb-2">
              <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                <span>🛍️</span> {editingId ? "Modifier le produit / la vente" : "Ajouter un produit / Une vente"}
              </h2>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="text-xs text-gray-600 hover:text-gray-900 underline font-medium cursor-pointer"
                >
                  Annuler la modification
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProduct} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Nom du produit / de la vente</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="ex: Vente de Jus de Pomme, Tickets Tombola..."
                  className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Prix unitaire (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-gray-700">Lien du site de vente externe (optionnel)</label>
                <input
                  type="url"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="ex: https://www.helloasso.com/associations/ape/evenements/..."
                  className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Date de début de vente</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Date de fin de vente</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Informations sur la livraison, consignes, dates de retrait..."
                  className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900"
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-2 border-t border-purple-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-700 hover:bg-purple-800 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  {loading ? "Enregistrement..." : editingId ? "Mettre à jour" : "Publier la vente"}
                </button>
              </div>