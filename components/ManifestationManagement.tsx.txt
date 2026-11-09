'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ManifestationsManagement() {
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [eventInventory, setEventInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Formulaire
  const [eventId, setEventId] = useState('')
  const [itemId, setItemId] = useState('')
  const [initialStock, setInitialStock] = useState('0')
  const [finalStock, setFinalStock] = useState('0')
  const [wasteStock, setWasteStock] = useState('0')
  const [unitPrice, setUnitPrice] = useState('')

  const loadData = async () => {
    const { data: evData } = await supabase.from('events').select('*').order('event_date', { ascending: false })
    const { data: itData } = await supabase.from('inventory_items').select('*').order('name', { ascending: true })
    const { data: invData } = await supabase.from('event_inventory').select('*, events(title), inventory_items(name)')
    
    if (evData) setEvents(evData)
    if (itData) setItems(itData)
    if (invData) setEventInventory(invData)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !itemId || !unitPrice) return

    const { error } = await supabase.from('event_inventory').insert({
      event_id: eventId,
      item_id: itemId,
      initial_stock: parseInt(initialStock, 10) || 0,
      final_stock: parseInt(finalStock, 10) || 0,
      waste_stock: parseInt(wasteStock, 10) || 0,
      unit_price: parseFloat(unitPrice) || 0,
    })

    if (!error) {
      setInitialStock('0')
      setFinalStock('0')
      setWasteStock('0')
      setUnitPrice('')
      loadData()
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-sm">Chargement des bilans...</div>
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Buvette & Bilans d'Événements</h1>
        <p className="text-sm text-gray-600 mt-1">
          Saisissez les stocks emportés et rapportés pour calculer les recettes de caisse.
        </p>
      </header>

      {/* Formulaire Saisie Stock Manifestation */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span>🥤</span> Saisir un bilan buvette / restauration
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Événement</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">Sélectionner un événement</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Article</label>
              <select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">Sélectionner un article</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name} (Réserve : {it.current_stock})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stock Initial (pris)</label>
              <input
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stock Final (restant)</label>
              <input
                type="number"
                min="0"
                value={finalStock}
                onChange={(e) => setFinalStock(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pertes / Offerts</label>
              <input
                type="number"
                min="0"
                value={wasteStock}
                onChange={(e) => setWasteStock(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prix Vente (€)</label>
              <input
                type="number"
                step="0.10"
                placeholder="ex: 1.50"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium text-sm py-2 px-4 rounded-xl transition cursor-pointer"
          >
            Enregistrer le bilan de cet article
          </button>
        </form>
      </div>

      {/* Tableau des ventes */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span>🧾</span> Ventes et Recettes Calculées
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="pb-3">Événement</th>
                <th className="pb-3">Article</th>
                <th className="pb-3 text-center">Pris / Restant</th>
                <th className="pb-3 text-center">Vendus</th>
                <th className="pb-3 text-right">CA Théorique</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {eventInventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500 italic">
                    Aucun bilan de buvette enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                eventInventory.map((row) => {
                  const sold = Math.max(0, row.initial_stock - row.final_stock - row.waste_stock)
                  const totalRevenue = sold * row.unit_price
                  return (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="py-3 font-semibold text-gray-900">{row.events?.title || "Événement"}</td>
                      <td className="py-3 text-gray-700">{row.inventory_items?.name}</td>
                      <td className="py-3 text-center text-gray-600">{row.initial_stock} / {row.final_stock}</td>
                      <td className="py-3 text-center font-bold text-purple-700">{sold}</td>
                      <td className="py-3 text-right font-bold text-gray-900">{totalRevenue.toFixed(2)} €</td>
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