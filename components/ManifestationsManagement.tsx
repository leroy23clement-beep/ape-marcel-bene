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

  // État pour l'accordéon de l'historique (stocke l'ID de l'événement ouvert)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

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
      .select('*, events(id, title), inventory_items(name, unit)')
      .order('id', { ascending: false })

    if (invError) console.error("Erreur inventory:", invError)
    
    if (inventoryData) {
      setEventInventories(inventoryData)
      const pricesMap: Record<string, number> = {}
      inventoryData.forEach((inv) => {
        if (inv.item_id && inv.unit_price !== undefined && !pricesMap[inv.item_id]) {
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

    for (const item of itemsToSave) {
      const row = rowsData[item.id]
      const initialStockBeforeEvent = item.current_stock
      const final = parseInt(row.finalStock, 10)
      const waste = parseInt(row.waste, 10) || 0
      
      // Gestion du prix (accepte les décimaux comme 0.5)
      const price = row.price !== '' ? parseFloat(row.price.replace(',', '.')) : (lastPrices[item.id] || 0)

      // 1. Insertion dans event_inventory (avec prix unitaire et total si les colonnes le supportent, sinon fallback)
      const { error: insertError } = await supabase.from('event_inventory').insert({
        event_id: selectedEventId,
        item_id: item.id,
        initial_stock: initialStockBeforeEvent,
        final_stock: final,
        waste_stock: waste,
        unit_price: price
      })

      if (insertError) {
        alert(`Erreur insertion pour ${item.name} : ${insertError.message}`)
        return
      }

      // 2. Mise à jour du stock global dans inventory_items
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

  // Regrouper l'historique par événement pour l'affichage en accordéon
  const groupedHistory = eventInventories.reduce((acc: any, inv: any) => {
    const eventId = inv.events?.id || inv.event_id
    const eventTitle = inv.events?.title || 'Événement'
    if (!acc[eventId]) {
      acc[eventId] = { title: eventTitle, items: [] }
    }
    acc[eventId].items.push(inv)
    return acc
  }, {})

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-sm">Chargement...</div>
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Buvette & Bilans d'Événements</h1>
        <p className="text-sm text-gray-600 mt-1">
          Remplissez le tableau des restes et validez tout en une seule fois. Les prix acceptent les centimes (ex: 0.50).
        </p>
      </header>

      {dbError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <strong>Attention : </strong> {dbError}
        </div>
      )}

      {/* Formulaire de saisie globale */}
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
                <th className="p-3 text-right">Prix Unitaire (€)</th>
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
                          step="0.05"
                          min="0"
                          placeholder={lastPrices[item.id] !== undefined ? `${lastPrices[item.id]} €` : "ex: 0.50"}
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

      {/* Historique en Accordéon par Événement */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span>📊</span> Historique des Bilans et Recettes de Buvette
        </h2>

        {Object.keys(groupedHistory).length === 0 ? (
          <p className="py-6 text-center text-gray-500 italic text-sm">
            Aucun bilan de buvette enregistré pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedHistory).map(([eventId, group]: [string, any]) => {
              const isExpanded = expandedEventId === eventId
              return (
                <div key={eventId} className="border rounded-xl overflow-hidden transition">
                  {/* Ligne En-tête de l'événement (Cliquable pour dérouler) */}
                  <div
                    onClick={() => setExpandedEventId(isExpanded ? null : eventId)}
                    className="bg-gray-50 hover:bg-purple-50/50 p-4 flex justify-between items-center cursor-pointer transition select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-purple-700 font-bold">{isExpanded ? '▼' : '▶'}</span>
                      <h3 className="font-bold text-gray-900 text-base">{group.title}</h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-medium">
                        {group.items.length} article(s) enregistré(s)
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 italic">Cliquez pour {isExpanded ? 'replier' : 'voir le détail'}</span>
                  </div>

                  {/* Listing détaillé des articles de cet événement (Accordéon) */}
                  {isExpanded && (
                    <div className="p-4 bg-white border-t space-y-3">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <th className="pb-2">Article</th>
                            <th className="pb-2 text-center">Départ → Restant</th>
                            <th className="pb-2 text-center">Vendus / Consommés</th>
                            <th className="pb-2 text-right">Prix Unitaire</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {group.items.map((inv: any) => {
                            const soldCalc = Math.max(0, (inv.initial_stock || 0) - (inv.final_stock || 0) - (inv.waste_stock || 0))
                            return (
                              <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="py-2.5 font-medium text-gray-900">{inv.inventory_items?.name || 'Article'}</td>
                                <td className="py-2.5 text-center text-gray-600">
                                  {inv.initial_stock} → <strong className="text-purple-700">{inv.final_stock}</strong> {inv.inventory_items?.unit}
                                </td>
                                <td className="py-2.5 text-center font-bold text-gray-800">
                                  {soldCalc} {inv.inventory_items?.unit}
                                </td>
                                <td className="py-2.5 text-right text-gray-600 font-mono text-xs">
                                  {inv.unit_price !== undefined ? `${inv.unit_price} €` : '-'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}