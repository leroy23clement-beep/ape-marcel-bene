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
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      fetchShopData(user.id)
    }
    loadData()
  }, [])

  const fetchShopData = async (userId: string) => {
    const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(prodData || [])
    const { data: ordData } = await supabase.from('orders').select('*, products(*)').eq('user_id', userId).order('created_at', { ascending: false })
    setUserOrders(ordData || [])
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) { alert("Nom requis."); return }
    setLoading(true)
    try {
      const productData = { name, price: price ? parseFloat(price) : 0, external_link: externalLink || null, start_date: startDate || null, end_date: endDate || null, description: description || null }
      if (editingId) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingId)
        if (error) throw error
        alert("Mis à jour avec succès !")
      } else {
        const { error } = await supabase.from('products').insert({ ...productData, is_closed: false })
        if (error) throw error
        alert("Publié avec succès !")
      }
      resetForm()
      if (user) fetchShopData(user.id)
    } catch (error: any) {
      alert("Erreur : " + error.message)
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
    if (!confirm("Supprimer cette vente ?")) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      if (user) fetchShopData(user.id)
    } catch (error: any) { alert("Erreur : " + error.message) }
  }

  const handleToggleCloseSale = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('products').update({ is_closed: !currentStatus }).eq('id', productId)
      if (error) throw error
      if (user) fetchShopData(user.id)
    } catch (error: any) { alert("Erreur : " + error.message) }
  }

  const resetForm = () => {
    setEditingId(null); setName(''); setPrice(''); setExternalLink(''); setStartDate(''); setEndDate(''); setDescription('')
  }

  const handleOrder = async (productId: string, quantity: number) => {
    try {
      const product = products.find(p => p.id === productId)
      if (product?.is_closed) { alert("Vente clôturée."); return }
      const totalPrice = (product?.price || 0) * quantity
      const { error } = await supabase.from('orders').insert({ user_id: user.id, product_id: productId, quantity, total_price: totalPrice, status: 'pending' })
      if (error) throw error
      alert("Commande enregistrée !")
      fetchShopData(user.id)
    } catch (error: any) { alert("Erreur : " + error.message) }
  }

  const isBureau = profile?.role && profile.role !== "parent"
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />
      <main className="mx-auto max-w-4xl p-6 space-y-8">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Boutique & Ventes APE</h1>
          <p className="text-sm text-gray-600 mt-1">Commandez vos articles ou accédez aux ventes en ligne.</p>
        </header>

        {isBureau && (
          <section className="bg-purple-50/50 border border-purple-200 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-purple-200 pb-2">
              <h2 className="text-lg font-bold text-purple-900">🛍️ {editingId ? "Modifier" : "Ajouter"} un produit</h2>
              {editingId && <button type="button" onClick={resetForm} className="text-xs text-gray-600 underline cursor-pointer">Annuler</button>}
            </div>
            <form onSubmit={handleSaveProduct} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Nom</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Prix (€)</label>
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-gray-700">Lien externe</label>
                <input type="url" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Début</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Fin</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-700">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900" />
              </div>
              <div className="md:col-span-2 flex justify-end pt-2 border-t border-purple-200">
                <button type="submit" disabled={loading} className="bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer">
                  {loading ? "Enregistrement..." : editingId ? "Mettre à jour" : "Publier"}
                </button>
              </div>
            </form>
          </section>
        )}

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
                        {product.price > 0 && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">{product.price.toFixed(2)} €</span>}
                        {product.is_closed && <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">🚫 Clôturée</span>}
                      </div>
                      {(product.start_date || product.end_date) && (
                        <p className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded w-fit border border-purple-200">
                          🗓️ {product.start_date ? `Du ${new Date(product.start_date).toLocaleDateString("fr-FR")}` : ""} {product.end_date ? ` au ${new Date(product.end_date).toLocaleDateString("fr-FR")}` : ""}
                        </p>
                      )}
                      {product.description && <p className="text-xs text-gray-600 leading-relaxed">{product.description}</p>}
                    </div>

                    <div className="w-full md:w-auto space-y-3 min-w-[220px] flex flex-col items-end">
                      {product.is_closed ? (
                        <span className="w-full text-center px-4 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold border border-gray-200">Vente clôturée</span>
                      ) : product.external_link ? (
                        <a href={product.external_link} target="_blank" rel="noopener noreferrer" className="w-full inline-flex justify-center items-center gap-2 bg-purple-700 text-white text-xs font-medium py-2.5 rounded-lg">
                          🔗 Accéder au site ↗
                        </a>
                      ) : (
                        <form onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const qtyInput = form.elements.namedItem('quantity') as HTMLInputElement; handleOrder(product.id, parseInt(qtyInput.value) || 1); }} className="flex items-center gap-2 w-full">
                          <input type="number" name="quantity" min="1" defaultValue="1" className="w-16 text-xs p-2 border rounded-lg text-center bg-white text-gray-900" required />
                          <button type="submit" className="flex-1 bg-emerald-600 text-white text-xs font-medium py-2.5 rounded-lg cursor-pointer">Commander</button>
                        </form>
                      )}

                      {isBureau && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 w-full flex-wrap">
                          <button type="button" onClick={() => handleToggleCloseSale(product.id, product.is_closed)} className={`text-xs px-3 py-1 rounded font-medium cursor-pointer ${product.is_closed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>
                            {product.is_closed ? '🟢 Rouvrir' : '🔒 Clôturer'}
                          </button>
                          <button type="button" onClick={() => handleStartEdit(product)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded font-medium cursor-pointer">Modifier</button>
                          <button type="button" onClick={() => handleDeleteProduct(product.id)} className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded font-medium cursor-pointer">Supprimer</button>
                        </div>
                      )}
                    </div>
                  </div>
                  {isBureau && <div className="pt-3 border-t"><ProductTasksManager productId={product.id} /></div>}
                </div>
              ))
            ) : (
              <div className="bg-white border rounded-xl p-8 text-center text-gray-500 text-sm">Aucune vente en cours.</div>
            )}
          </div>
        </section>

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