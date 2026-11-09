'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ManifestationsManagement() {
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [eventInventories, setEventInventories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Champs du formulaire simplifié
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [finalStock, setFinalStock] = useState('')
  const [wasteStock, setWasteStock] = useState('0')
  const [salePrice, setSalePrice] = useState('')

  const loadData = async () => {
    // Récupération de tous les événements
    const { data: eventsData, error: evError } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })

    if (evError) console.error("Erreur chargement events:", evError)
    
    // Récupération des articles
    const { data: itemsData, error: itError } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true })

    if (itError) console.error("Erreur chargement items:", itError)
    
    // Récupération de l'historique des bilans
    const { data: inventoryData, error: invError } = await supabase
      .from('event_inventory')
      .select('*, events(title), inventory_items(name, unit)')
      .order('id', { ascending: false })

    if (invError) console.error("Erreur chargement inventory:", invError)

    if (eventsData) setEvents(eventsData)
    if (itemsData) setItems(itemsData)
    if (inventoryData) setEventInventories(inventoryData)
    
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId || !selectedItemId || finalStock === '' || !salePrice) return

    const currentItem = items.find(i => i.id === selectedItemId)
    if (!currentItem) return

    const initialStockBeforeEvent = currentItem.current_stock
    const final = parseInt(finalStock, 10)
    const waste = parseInt(wasteStock, 10) || 0
    const price = parseFloat(salePrice)

    const sold = Math.max(0, initialStockBeforeEvent - final - waste)
    const revenue = sold * price

    const { error: insertError } = await supabase.from('event_inventory').insert({
      event_id: selectedEventId,
      item_id: selectedItemId,
      initial_stock: initialStockBeforeEvent,
      final_stock: final,
      waste_stock: waste,
      sold_quantity: sold,
      unit_price: price,
      total_revenue: revenue
    })

    if (insertError) {
      alert("Erreur lors de l'enregistrement du bilan.")
      return
    }

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ current_stock: final })
      .eq('id', selectedItemId)

    if (updateError) {
      alert("Erreur lors de la mise à jour du stock global.")
      return
    }

    setSelectedEventId('')
    setSelectedItemId('')
    setFinalStock('')
    setWasteStock('0')
    setSalePrice('')
    loadData()
  }

  const selectedItemData = items.find(i => i.id === selectedItemId)

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-sm">Chargement des bilans de manifestations...</div>
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Buvette & Bilans d'Événements</h1>
        <p className="text-sm text-gray-600 mt-1">
          Sélectionnez l'événement, saisissez le stock final restant et déduisez automatiquement les ventes.
        </p>
      </header>

      {/* Formulaire Simplifié */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span>🥤</span> Saisie du Bilan par Article
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Événement</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">Sélectionner un événement ({events.length} dispo)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.date ? new Date(ev.date).toLocaleDateString('fr-FR') : 'Date non définie'})
                  </option>
                ))}
              </select>
            </div>

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
                    {item.name} (En réserve : {item.current_stock} {item.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Stock Final Restant <span className="text-purple-700 font-bold">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="ex: 12"
                value={finalStock}
                onChange={(e) => setFinalStock(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {selectedItemData && (
                <p className="text-[11px] text-gray-500 mt-1">
                  Stock actuel en réserve : <strong className="text-gray-800">{selectedItemData.current_stock} {selectedItemData.unit}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pertes / Offerts (Casse, etc.)</label>
              <input
                type="number"
                min="0"
                placeholder="ex: 2"
                value={wasteStock}
                onChange={(e) => setWasteStock(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prix de vente unitaire (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="ex: 1.50"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium text-sm py-2.5 px-4 rounded-xl transition cursor-pointer"
          >
            Enregistrer le bilan & mettre à jour le stock
          </button>
        </form>
      </div>

      {/* Historique des Ventes et Recettes Calculées */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span>📊</span> Historique des Bilans et Recettes de Buvette
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="pb-3">Événement</th>
                <th className="pb-3">Article</th>
                <th className="pb-3 text-center">Départ / Restant</th>
                <th className="pb-3 text-center">Vendus</th>
                <th className="pb-3 text-right">CA Théorique</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {eventInventories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500 italic">
                    Aucun bilan de buvette enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                eventInventories.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="py-3 font-semibold text-gray-900">{inv.events?.title || 'Événement'}</td>
                    <td className="py-3 text-gray-700">{inv.inventory_items?.name || 'Article'}</td>
                    <td className="py-3 text-center text-gray-600">
                      {inv.initial_stock} → <strong className="text-purple-700">{inv.final_stock}</strong> {inv.inventory_items?.unit}
                    </td>
                    <td className="py-3 text-center font-bold text-gray-800">
                      {inv.sold_quantity} {inv.inventory_items?.unit}
                    </td>
                    <td className="py-3 text-right font-extrabold text-green-700">
                      {inv.total_revenue?.toFixed(2)} €
                    </td>
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