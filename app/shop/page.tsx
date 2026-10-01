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
    // Récupérer les produits
    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts(prodData || [])

    // Récupérer les commandes
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
          .insert(productData)

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

        {/* Formulaire d'ajout / modification réservé au Bureau */}
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
            </form>
          </section>
        )}

        {/* Catalogue des ventes */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Ventes en cours</h2>
          <div className="space-y-4">
            {products && products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-900 text-base">{product.name}</h3>
                        {product.price > 0 && (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                            {product.price.toFixed(2)} €
                          </span>
                        )}
                      </div>

                      {(product.start_date || product.end_date) && (
                        <p className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded w-fit border border-purple-200">
                          🗓️ {product.start_date ? `Du ${new Date(product.start_date).toLocaleDateString("fr-FR")}` : ""} 
                          {product.end_date ? ` au ${new Date(product.end_date).toLocaleDateString("fr-FR")}` : ""}
                        </p>
                      )}

                      {product.description && (
                        <p className="text-xs text-gray-600 leading-relaxed">{product.description}</p>
                      )}
                    </div>

                    <div className="w-full md:w-auto space-y-3 min-w-[220px]">
                      {product.external_link ? (
                        <a
                          href={product.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex justify-center items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-medium py-2.5 rounded-lg transition"
                        >
                          🔗 Accéder au site de commande ↗
                        </a>
                      ) : (
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault()
                            const form = e.currentTarget
                            const qtyInput = form.elements.namedItem('quantity') as HTMLInputElement
                            handleOrder(product.id, parseInt(qtyInput.value) || 1)
                          }} 
                          className="flex items-center gap-2"
                        >
                          <input
                            type="number"
                            name="quantity"
                            min="1"
                            defaultValue="1"
                            className="w-16 text-xs p-2 border rounded-lg text-center bg-white text-gray-900"
                            required
                          />
                          <button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-2 rounded-lg transition cursor-pointer"
                          >
                            Commander
                          </button>
                        </form>
                      )}

                      {isBureau && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(product)}
                            className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded font-medium cursor-pointer"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1 rounded font-medium cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gestionnaire de tâches interne au bureau lié à cette vente */}
                  {isBureau && (
                    <div className="pt-3 border-t">
                      <ProductTasksManager productId={product.id} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white border rounded-xl p-8 text-center text-gray-500 text-sm">
                Aucune vente en cours pour le moment.
              </div>
            )}
          </div>
        </section>

        {/* Historique des commandes directes */}
        {userOrders && userOrders.length > 0 && (
          <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Mes commandes directes</h2>
            <div className="divide-y text-sm">
              {userOrders.map((order) => (
                <div key={order.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{order.products?.name}</p>
                    <p className="text-xs text-gray-500">Quantité : {order.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{order.total_price?.toFixed(2)} €</p>
                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {order.status === "pending" ? "En attente de règlement" : "Payée"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}