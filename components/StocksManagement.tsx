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
                  className="w-full rounded-lg border border-gray-30