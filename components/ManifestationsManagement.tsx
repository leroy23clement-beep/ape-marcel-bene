'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ManifestationsManagement() {
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [eventInventories, setEventInventories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)

  const [selectedEventId, setSelectedEventId] = useState('')
  const [rowsData, setRowsData] = useState<Record<string, { finalStock: string; waste: string; price: string }>>({})
  const [lastPrices, setLastPrices] = useState<Record<string, number>>({})

  const loadData = async () => {
    setLoading(true)
    setDbError(null)

    const { data: eventsData, error: evError } = await supabase.from('events').select('*')
    if (evError) setDbError(`Erreur events: ${evError.message}`)
    else setEvents(eventsData || [])
    
    const { data: itemsData, error: itError } = await supabase.from('inventory_items').select('*').order('name', { ascending: true })
    if (itError) console.error("Erreur items:", itError)
    
    if (itemsData) {
      setItems(itemsData)
      const initialRows: Record<string, { finalStock: string; waste: string; price: string }> = {}
      itemsData.forEach(item => {
        initialRows[item.id] = { finalStock: '', waste: '0', price: '' }
      })
      setRowsData(initialRows)
    }
    
    const { data: inventoryData, error: invError } = await supabase
      .from('event_inventory')
      .select('*, events(title), inventory_items(name, unit)')
      .order('id', { ascending: false })

    if (invError) console.error("Erreur inventory:", invError)
    
    if (inventoryData) {
      setEventInventories(inventoryData)
      const pricesMap: Record<string, number> = {}
      inventoryData.forEach((inv) => {
        if (inv.item_id && inv.unit_price && !pricesMap[inv.item_id]) {
          pricesMap[inv.item_id] = inv.unit_price
        }
      })
      setLastPrices(pricesMap)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleInputChange = (itemId: string, field: 'finalStock' | 'waste' | 'price', value: string) => {
    setRowsData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }))
  }

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId) {
      alert("Veuillez sélectionner un événement.")
      return
    }

    const itemsToSave = items.filter(item => {
      const row = rowsData[item.id]
      return row && row.finalStock !== ''
    })

    if (itemsToSave.length === 0) {
      alert("Veuillez saisir au moins un stock final restant.")
      return
    }

    // Vérifier si tous les articles sélectionnés ont bien un prix de vente valide
    for (const item of itemsToSave) {
      const row = rowsData[item.id]
      const price = row.price !== '' ? parseFloat(row.price) : (lastPrices[item.id] || 0)
      if (isNaN(price) || price <= 0) {
        alert(`Le prix de vente unitaire est requis et doit être supérieur à 0 pour l'article : ${item.name}`)
        return
      }
    }

    for (const item of itemsToSave) {
      const row = rowsData[item.id]
      const initialStockBeforeEvent = item.current_stock
      const final = parseInt(row.finalStock, 10)
      const waste = parseInt(row.waste, 10) || 0
      const price = row.price !== '' ? parseFloat(row.price) : lastPrices[item.id]

      const sold = Math.max(0, initialStockBeforeEvent - final - waste)
      const revenue = sold * price

      // 1. Insertion dans event_inventory
      const { error: insertError } = await supabase.from('event_inventory').insert({
        event_id: selectedEventId,
        item_id: item.id,
        initial_stock: initialStockBeforeEvent,
        final_stock: final,
        waste_stock: waste,
        sold_quantity: sold,
        unit_price: price,
        total_revenue: revenue
      })

      if (insertError) {
        alert(`Erreur insertion pour ${item.name} : ${insertError.message}`)
        return
      }

      // 2. Mise à jour du stock global
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ current_stock: final })
        .eq('id', item.id)

      if (updateError) {
        alert(`Erreur mise à jour stock pour ${item.name} : ${updateError.message}`)
        return
      }
    }

    alert("Bilan enregistré avec succès !")
    loadData()
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-sm">Chargement...</div>
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Buvette & Bilans d'Événements</h1>
        <p className="text-sm text-gray-600 mt-1">
          Remplissez le tableau des restes et validez tout en une seule fois.
        </p>
      </header>

      {dbError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <strong>Attention : </strong> {dbError}
        </div>
      )}

      <form onSubmit={handleSubmitAll} className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        <div className="max-w-md">
          <label className="block text-xs font-medium text-gray-700 mb-1">Événement concerné</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="">Sélectionner un événement</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title || ev.name || 'Événement sans nom'}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="p-3">Article</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3 text-center">Stock Réserve Actuel</th>
                <th className="p-3 text-center">Stock Final Restant</th>
                <th className="p-3 text-center">Pertes / Offerts</th>
                <th className="p-3 text-right">Prix Vente Unitaire (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500 italic">
                    Aucun article dans la réserve.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const row = rowsData[item.id] || { finalStock: '', waste: '0', price: '' }
                  const defaultPriceDisplay = row.price !== '' ? row.price : (lastPrices[item.id] !== undefined ? lastPrices[item.id] : '')

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-900">{item.name}</td>
                      <td className="p-3 text-gray-600 text-xs">{item.category}</td>
                      <td className="p-3 text-center">
                        <span className="bg-gray-100 text-gray-800 font-bold px-2 py-1 rounded text-xs">
                          {item.current_stock} {item.unit}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          placeholder="laisser vide si inchangé"
                          value={row.finalStock}
                          onChange={(e) => handleInputChange(item.id, 'finalStock', e.target.value)}
                          className="w-32 mx-auto rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={row.waste}
                          onChange={(e) => handleInputChange(item.id, 'waste', e.target.value)}
                          className="w-20 mx-auto rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={lastPrices[item.id] !== undefined ? `${lastPrices[item.id]} €` : "ex: 1.50"}
                          value={defaultPriceDisplay}
                          onChange={(e) => handleInputChange(item.id, 'price', e.target.value)}
                          className="w-28 ml-auto rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            className="bg-purple-700 hover:bg-purple-800 text-white font-medium text-sm py-3 px-6 rounded-xl transition cursor-pointer shadow-sm"
          >
            Enregistrer tout le bilan & mettre à jour les stocks
          </button>
        </div>
      </form>

      {/* Historique */}
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