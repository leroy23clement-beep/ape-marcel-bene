'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Html5Qrcode } from 'html5-qrcode'

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
  const [barcode, setBarcode] = useState('')

  // Champs formulaire achat
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [supplier, setSupplier] = useState('')
  const [expirationDate, setExpirationDate] = useState('')

  // État pour l'édition rapide du code-barres d'un article existant
  const [editingBarcodeId, setEditingBarcodeId] = useState<string | null>(null)
  const [tempBarcode, setTempBarcode] = useState('')

  // État du scanner
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const loadInventory = async () => {
    const { data: itemsData } = await supabase
      .from('inventory_items')
      .select('*')
      .order('category', { ascending: true })

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
    return () => {
      stopScanner()
    }
  }, [])

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    const { error } = await supabase.from('inventory_items').insert({
      name,
      category,
      unit,
      barcode: barcode || null,
      current_stock: 0
    })

    if (!error) {
      setName('')
      setBarcode('')
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

  // Mettre à jour le code-barres d'un article existant
  const handleUpdateBarcode = async (itemId: string) => {
    const { error } = await supabase
      .from('inventory_items')
      .update({ barcode: tempBarcode || null })
      .eq('id', itemId)

    if (!error) {
      setEditingBarcodeId(null)
      setTempBarcode('')
      loadInventory()
    } else {
      alert("Erreur lors de la mise à jour du code-barres.")
    }
  }

  // Scanner de code-barres
  const startScanner = async () => {
    setIsScanning(true)
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader")
        scannerRef.current = html5QrCode
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 100 } },
          (decodedText) => {
            stopScanner()
            const foundItem = items.find(i => i.barcode === decodedText)
            if (foundItem) {
              setSelectedItemId(foundItem.id)
              alert(`Article reconnu : ${foundItem.name}`)
            } else {
              alert(`Aucun article associé au code-barres : ${decodedText}. Vous pouvez l'ajouter en cliquant sur la flèche de l'article dans le tableau ci-dessous.`)
            }
          },
          () => {}
        )
      } catch (err) {
        console.error("Erreur caméra:", err)
        setIsScanning(false)
      }
    }, 100)
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (e) {}
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  const toggleExpand = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId)
    setEditingBarcodeId(null)
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
          Scannez vos produits lors des courses, gérez les codes-barres et suivez les lots.
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
                <input
                  type="text"
                  placeholder="ex: Buvette"
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
                  placeholder="ex: unité, pack"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code-barres (Optionnel)</label>
              <input
                type="text"
                placeholder="ex: 5449000000996"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
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
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span>🛒</span> Enregistrer un achat
            </h2>
            <button
              type="button"
              onClick={isScanning ? stopScanner : startScanner}
              className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium text-xs py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>📷</span> {isScanning ? "Fermer la caméra" : "Scanner un code-barres"}
            </button>
          </div>

          {isScanning && (
            <div className="bg-black rounded-lg overflow-hidden p-2 relative">
              <div id="reader" className="w-full"></div>
              <button
                type="button"
                onClick={stopScanner}
                className="mt-2 w-full bg-red-600 text-white text-xs py-1 rounded font-medium"
              >
                Arrêter le scan
              </button>
            </div>
          )}

          <form onSubmit={handleAddPurchase} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Article</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">Sélectionner ou scanner un article</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.barcode ? `(🔍 ${item.barcode})` : ''} (Stock : {item.current_stock} {item.unit})
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
                  placeholder="ex: 24"
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
                  placeholder="ex: Métro"
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

      {/* Tableau Réserve avec Gestion des Code-Barres dans l'accordéon */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span>📊</span> État de la Réserve & Gestion des Codes-Barres
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="pb-3 w-8"></th>
                <th className="pb-3">Article</th>
                <th className="pb-3">Catégorie</th>
                <th className="pb-3">Code-barres</th>
                <th className="pb-3 text-center">Stock Global</th>
                <th className="pb-3">Unité</th>
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
                  const itemPurchases = purchases.filter((p) => p.item_id === item.id)
                  const isExpanded = expandedItemId === item.id

                  return (
                    <tr key={item.id} className="contents">
                      <tr 
                        className={`hover:bg-gray-50 cursor-pointer transition ${isExpanded ? 'bg-purple-50/50' : ''}`}
                        onClick={() => toggleExpand(item.id)}
                      >
                        <td className="py-3 text-center font-bold text-gray-400">
                          {isExpanded ? '▼' : '▶'}
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
                        <td className="py-3 text-gray-500 font-mono text-xs">
                          {item.barcode ? (
                            <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{item.barcode}</span>
                          ) : (
                            <span className="italic text-gray-400">Non associé</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${item.current_stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.current_stock}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600">{item.unit}</td>
                      </tr>

                      {/* Zone d'expansion : Code-barres modifiable + lots de péremption */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50 p-4 border-y space-y-4">
                            
                            {/* Bloc Gestion Code-Barres pour cet article existant */}
                            <div className="bg-white rounded-lg border p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
                              <div className="text-xs space-y-0.5">
                                <span className="font-bold text-gray-700">Code-barres associé :</span>
                                <p className="text-gray-500">Permet de reconnaître l'article automatiquement lors du scan des courses.</p>
                              </div>
                              
                              {editingBarcodeId === item.id ? (
                                <div className="flex gap-2 items-center w-full sm:w-auto">
                                  <input
                                    type="text"
                                    placeholder="Entrer le code-barres"
                                    value={tempBarcode}
                                    onChange={(e) => setTempBarcode(e.target.value)}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateBarcode(item.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                                  >
                                    Enregistrer
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingBarcodeId(null)}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-medium"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingBarcodeId(item.id)
                                    setTempBarcode(item.barcode || '')
                                  }}
                                  className="bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-medium px-3 py-1.5 rounded-lg transition"
                                >
                                  {item.barcode ? "Modifier le code-barres" : "+ Associer un code-barres"}
                                </button>
                              )}
                            </div>

                            {/* Bloc Détail des lots achetés & péremptions */}
                            <div className="bg-white rounded-lg border p-3 space-y-2">
                              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                📅 Détail des lots achetés & Péremptions
                              </h4>
                              {itemPurchases.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">Aucun lot enregistré pour cet article.</p>
                              ) : (
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b text-gray-400 uppercase">
                                      <th className="py-1">Péremption / Statut</th>
                                      <th className="py-1 text-center">Quantité</th>
                                      <th className="py-1">Fournisseur</th>
                                      <th className="py-1 text-right">Prix Unitaire</th>
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