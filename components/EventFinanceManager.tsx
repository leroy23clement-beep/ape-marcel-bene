'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function EventFinanceManager({ eventId }: { eventId: string }) {
  const [finances, setFinances] = useState<any[]>([]);
  const [type, setType] = useState('depense'); // 'depense' ou 'recette'
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchFinances();
  }, [eventId]);

  async function fetchFinances() {
    const { data } = await supabase
      .from('event_finances')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    if (data) setFinances(data);
  }

  async function handleAddFinance(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !amount) {
      alert("Veuillez remplir au moins la description et le montant.");
      return;
    }

    setLoading(true);
    try {
      let receiptUrl = null;

      // Si un fichier (facture scannée ou PDF) est joint
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('finance-receipts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('finance-receipts')
          .getPublicUrl(fileName);

        receiptUrl = publicData.publicUrl;
      }

      const { error } = await supabase.from('event_finances').insert({
        event_id: eventId,
        type,
        category: category || (type === 'depense' ? 'Achat / Facture' : 'Vente / Entrée'),
        description,
        invoice_number: invoiceNumber || null,
        amount: parseFloat(amount),
        receipt_url: receiptUrl,
      });

      if (error) throw error;

      // Réinitialisation du formulaire
      setDescription('');
      setInvoiceNumber('');
      setAmount('');
      setCategory('');
      setFile(null);
      const fileInput = document.getElementById(`fileInput-${eventId}`) as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchFinances();
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de l'enregistrement : " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Voulez-vous supprimer cette ligne financière ?")) return;
    await supabase.from('event_finances').delete().eq('id', id);
    fetchFinances();
  }

  // Calculs des totaux
  const totalRecettes = finances
    .filter((f) => f.type === 'recette')
    .reduce((acc, f) => acc + Number(f.amount), 0);

  const totalDepenses = finances
    .filter((f) => f.type === 'depense')
    .reduce((acc, f) => acc + Number(f.amount), 0);

  const bilan = totalRecettes - totalDepenses;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 bg-emerald-50/40 p-4 rounded-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <span>💶</span> Gestion Trésorerie (Recettes & Dépenses)
        </h4>
        <div className="flex gap-3 text-xs font-semibold">
          <span className="text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">Recettes : +{totalRecettes.toFixed(2)} €</span>
          <span className="text-red-700 bg-red-100 px-2.5 py-1 rounded">Dépenses : -{totalDepenses.toFixed(2)} €</span>
          <span className={`px-2.5 py-1 rounded text-white ${bilan >= 0 ? 'bg-emerald-700' : 'bg-red-600'}`}>
            Bilan : {bilan.toFixed(2)} €
          </span>
        </div>
      </div>

      {/* Formulaire d'ajout de dépense / recette */}
      <form onSubmit={handleAddFinance} className="bg-white p-4 rounded-lg border shadow-xs space-y-3">
        <p className="text-xs font-bold text-gray-800">Ajouter une écriture financière</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
            >
              <option value="depense">📉 Dépense</option>
              <option value="recette">📈 Recette</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Libellé / Catégorie</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Fournitures, Buvette..."
              className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">N° de facture (optionnel)</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Ex: FAC-2026-001"
              className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Montant en € *</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détail de la dépense ou recette..."
              className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Justificatif / Facture (Photo ou Fichier)</label>
            <input
              id={`fileInput-${eventId}`}
              type="file"
              accept="image/*,application/pdf"
              capture="environment" /* Permet d'ouvrir directement l'appareil photo sur mobile */
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs p-1 border rounded bg-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded transition font-medium cursor-pointer"
        >
          {loading ? "Enregistrement..." : "+ Enregistrer l'opération"}
        </button>
      </form>

      {/* Liste des mouvements financiers */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700">Détail des opérations enregistrées :</p>
        {finances.length > 0 ? (
          finances.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white border rounded-lg gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.type === 'recette' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {item.type}
                  </span>
                  <span className="text-xs font-bold text-gray-900">{item.category}</span>
                  {item.invoice_number && (
                    <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Facture n° {item.invoice_number}</span>
                  )}
                </div>
                <p className="text-xs text-gray-600">{item.description}</p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className={`text-sm font-bold ${item.type === 'recette' ? 'text-emerald-700' : 'text-red-600'}`}>
                  {item.type === 'recette' ? '+' : '-'}{Number(item.amount).toFixed(2)} €
                </span>

                {item.receipt_url && (
                  <a
                    href={item.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded border border-purple-200 transition font-medium"
                    title="Voir le justificatif"
                  >
                    📄 Facture
                  </a>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500 italic text-center py-2">Aucune dépense ni recette enregistrée pour cet événement.</p>
        )}
      </div>
    </div>
  );
}