'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StocksManagement() {
  const supabase = createClient()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Champs formulaire nouvel article
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Buvette')
  const [unit, setUnit] = useState('unité')

  // Champs formulaire achat
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [supplier, setSupplier] = useState('')
  const [expirationDate, setExpirationDate] = useState('') // Nouveau champ

  const loadInventory = async () => {
    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .order('category', { ascending: true })
    if (data) setItems(data)
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
    if (!selectedItemId || !quantity || !totalCost) return

    const { error } = await supabase.from('inventory_purchases').insert({
      item_id: selectedItemId,
      quantity: parseInt(quantity, 10),
      total_cost: parseFloat(totalCost),
      supplier: supplier || null,
      expiration_date: expirationDate || null // Enregistrement de la date de péremption
    })

    if (!error) {
      setSelectedItemId('')
      setQuantity('')
      setTotalCost('')
      setSupplier('')
      setExpirationDate('')
      loadInventory()
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-sm">Chargement de la réserve...</div>
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestion de la Réserve & Achats</h1>
        <p className="text-sm text-gray-600 mt-1">
          Suivez les stocks globaux et enregistrez les achats fournisseurs avec leurs dates de péremption.
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
                  placeholder="ex: 48"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Coût total (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ex: 35.50"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
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
              className="w-full bg-purple-700 hover:bg-purple-800Text-white font-medium text-sm py-2 px-4 rounded-xl transition cursor-pointer"
            >
              Valider l'achat
            </button>
          </form>
        </div>
      </div>

      {/* Tableau Réserve */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span>📊</span> État de la Réserve Actuelle
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="pb-3">Article</th>
                <th className="pb-3">Catégorie</th>
                <th className="pb-3 text-center">Stock en Réserve</th>
                <th className="pb-3">Unité</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500 italic">
                    Aucun article dans la réserve pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-3 font-semibold text-gray-900">{item.name}</td>
                    <td className="py-3 text-gray-600">{item.category}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${item.current_stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.current_stock}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{item.unit}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}