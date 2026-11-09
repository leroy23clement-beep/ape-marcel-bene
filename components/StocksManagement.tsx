'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StocksManagement() {
  const supabase = createClient()
  const [items, setItems] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Champs formulaire nouvel article
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Buvette')
  const [unit, setUnit] = useState('unité')

  // Champs formulaire achat
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [supplier, setSupplier] = useState('')
  const [expirationDate, setExpirationDate] = useState('')

  const loadInventory = async () => {
    // Récupération du catalogue
    const { data: itemsData } = await supabase
      .from('inventory_items')
      .select('*')
      .order('category', { ascending: true })

    // Récupération des lots d'achats avec leurs dates de péremption
    const { data: purchasesData } = await supabase
      .from('inventory_purchases')
      .select('*')
      .order('expiration_date', { ascending: true })

    if (itemsData) setItems(itemsData)
    if (purchasesData) setPurchases(purchasesData)
    setLoading(false)
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    const { error } = await supabase.from('inventory_items').insert({
      name,
      category,
      unit,
      current_stock: 0
    })

    if (!error) {
      setName('')
      loadInventory()
    }
  }

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemId || !quantity || !unitPrice) return

    const qty = parseInt(quantity, 10)
    const uPrice = parseFloat(unitPrice)
    const totalCost = qty * uPrice

    const { error } = await supabase.from('inventory_purchases').insert({
      item_id: selectedItemId,
      quantity: qty,
      total_cost: totalCost,
      supplier: supplier || null,
      expiration_date: expirationDate || null
    })

    if (!error) {
      setSelectedItemId('')
      setQuantity('')
      setUnitPrice('')
      setSupplier('')
      setExpirationDate('')
      loadInventory()
    }
  }

  const toggleExpand = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId)
  }

  const calculatedTotal = (quantity && unitPrice) ? (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2) : '0.00'

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-sm">Chargement de la réserve...</div>
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestion de la Réserve & Achats</h1>
        <p className="text-sm text-gray-600 mt-1">
          Suivez les stocks globaux, enregistrez les réassorts et consultez le détail des lots par date de péremption.
        </p>
      </header>

      {/* Formulaires d'action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Formulaire Nouvel Article */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <span>📦</span> Créer un nouvel article
          </h2>
          <form onSubmit={handleAddItem} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom de l'article</label>
              <input
                type="text"
                placeholder="ex: Coca-Cola 33cl"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
              <input
                type="text"
                placeholder="ex: Buvette, Restauration"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unité</label>
              <input
                type="text"
                placeholder="ex: unité, pack, kg"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium text-sm py-2 px-4 rounded-xl transition cursor-pointer"
            >
              Ajouter au catalogue
            </button>
          </form>
        </div>

        {/* Formulaire Enregistrer un Achat */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <span>🛒</span> Enregistrer un achat / réassort
          </h2>
          <form onSubmit={handleAddPurchase} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Article</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">Sélectionner un article</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Stock actuel : {item.current_stock} {item.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantité</label>
                <input
                  type="number"
                  min="1"
                  placeholder="ex: 97"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Prix unitaire (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ex: 0.75"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="text-xs text-gray-500 text-right bg-gray-50 p-2 rounded-lg border">
              Coût total calculé : <strong className="text-gray-800">{calculatedTotal} €</strong>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fournisseur</label>
                <input
                  type="text"
                  placeholder="ex: Métro, E.Leclerc"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de péremption</label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium text-sm py-2 px-4 rounded-xl transition cursor-pointer"
            >
              Valider l'achat
            </button>
          </form>
        </div>
      </div>

      {/* Tableau Réserve avec Sous-Détail Dépliable */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span>📊</span> État de la Réserve Actuelle & Détail des Lots
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="pb-3 w-8"></th>
                <th className="pb-3">Article</th>
                <th className="pb-3">Catégorie</th>
                <th className="pb-3 text-center">Stock Global</th>
                <th className="pb-3">Unité</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500 italic">
                    Aucun article dans la réserve pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const itemPurchases = purchases.filter((p) => p.item_id === item.id)
                  const isExpanded = expandedItemId === item.id

                  return (
                    <tr key={item.id} className="contents">
                      {/* Ligne Principale */}
                      <tr 
                        className={`hover:bg-gray-50 cursor-pointer transition ${isExpanded ? 'bg-purple-50/50' : ''}`}
                        onClick={() => toggleExpand(item.id)}
                      >
                        <td className="py-3 text-center font-bold text-gray-400">
                          {itemPurchases.length > 0 ? (isExpanded ? '▼' : '▶') : ''}
                        </td>
                        <td className="py-3 font-semibold text-gray-900 flex items-center gap-2">
                          {item.name}
                          {itemPurchases.length > 0 && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-normal">
                              {itemPurchases.length} lot(s)
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-gray-600">{item.category}</td>
                        <td className="py-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${item.current_stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.current_stock}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600">{item.unit}</td>
                      </tr>

                      {/* Sous-détail dépliable des lots */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50 p-4 border-y">
                            <div className="bg-white rounded-lg border p-3 space-y-2">
                              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                <span>📅</span> Détail des lots achetés & Dates de péremption
                              </h4>
                              {itemPurchases.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">Aucun lot enregistré pour cet article.</p>
                              ) : (
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b text-gray-400 uppercase">
                                      <th className="py-1">Date d'achat / Péremption</th>
                                      <th className="py-1 text-center">Quantité Achetée</th>
                                      <th className="py-1">Fournisseur</th>
                                      <th className="py-1 text-right">Prix unitaire</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {itemPurchases.map((p) => {
                                      const uPrice = (p.total_cost && p.quantity) ? (p.total_cost / p.quantity).toFixed(2) : '-'
                                      let expBadge = <span className="text-gray-400 italic">Non renseignée</span>

                                      if (p.expiration_date) {
                                        const expDate = new Date(p.expiration_date)
                                        const today = new Date()
                                        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                        
                                        if (diffDays < 0) {
                                          expBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Périmé ({expDate.toLocaleDateString('fr-FR')})</span>
                                        } else if (diffDays <= 30) {
                                          expBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">Périme bientôt ({expDate.toLocaleDateString('fr-FR')})</span>
                                        } else {
                                          expBadge = <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">{expDate.toLocaleDateString('fr-FR')}</span>
                                        }
                                      }

                                      return (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                          <td className="py-2 font-medium">{expBadge}</td>
                                          <td className="py-2 text-center font-bold text-gray-700">{p.quantity} {item.unit}</td>
                                          <td className="py-2 text-gray-600">{p.supplier || '-'}</td>
                                          <td className="py-2 text-right text-gray-600">{uPrice} €</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}