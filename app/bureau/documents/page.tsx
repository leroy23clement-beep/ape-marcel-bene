'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function BureauDocumentsPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Compte-rendu (PV)');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function initData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const allowedRoles = ['admin', 'president', 'secretaire', 'tresorier', 'bureau'];
        if (!profileData || !allowedRoles.includes(profileData.role?.toLowerCase())) {
          router.push('/dashboard');
          return;
        }
        setProfile(profileData);

        await fetchDocuments();
      } catch (err) {
        console.error("Erreur d'initialisation:", err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, [router]);

  async function fetchDocuments() {
    const { data, error } = await supabase
      .from("bureau_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setDocuments(data);
    if (error) console.error("Erreur chargement documents:", error.message);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !file) {
      alert("Veuillez renseigner un titre et sélectionner un fichier.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('bureau-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('bureau-documents')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('bureau_documents').insert({
        title,
        category,
        file_url: publicData.publicUrl,
        uploaded_by: `${profile.first_name} ${profile.last_name || ''}`.trim(),
      });

      if (insertError) throw insertError;

      setTitle('');
      setFile(null);
      const fileInput = document.getElementById('docFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchDocuments();
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de l'upload : " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Voulez-vous supprimer ce document ?")) return;
    const { error } = await supabase.from('bureau_documents').delete().eq('id', id);
    if (!error) fetchDocuments();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">Chargement en cours...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user?.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents & Comptes-rendus (PV)</h1>
            <p className="text-sm text-gray-600 mt-1">
              Espace de stockage et de consultation des documents officiels de l'association.
            </p>
          </div>
          <div>
            <Link href="/bureau" className="text-sm font-medium text-gray-600 hover:underline">
              ← Retour Espace Bureau
            </Link>
          </div>
        </div>

        {/* Formulaire d'ajout de document */}
        <form onSubmit={handleUpload} className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Ajouter un nouveau document</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Titre du document *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: PV Réunion de bureau - Septembre 2026"
                className="w-full p-2.5 border rounded-lg text-xs text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-xs text-gray-900 bg-white"
              >
                <option value="Compte-rendu (PV)">📝 Compte-rendu (PV)</option>
                <option value="Statuts & Règlement">⚖️ Statuts & Règlement</option>
                <option value="Administratif & Financier">💶 Administratif & Financier</option>
                <option value="Autre">📁 Autre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fichier (PDF ou document scanné) *</label>
            <input
              id="docFileInput"
              type="file"
              required
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs p-2 border rounded-lg bg-white file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold py-2.5 rounded-lg transition cursor-pointer"
          >
            {uploading ? "Téléversement en cours..." : "+ Téléverser le document"}
          </button>
        </form>

        {/* Liste des documents */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Documents disponibles ({documents.length})</h2>

          <div className="space-y-3">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <div key={doc.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-xl gap-4 hover:bg-gray-50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                        {doc.category}
                      </span>
                      <span className="text-xs text-gray-500">Ajouté le {new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{doc.title}</p>
                    {doc.uploaded_by && (
                      <p className="text-xs text-gray-500">Par {doc.uploaded_by}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 font-medium transition"
                    >
                      📄 Consulter / Télécharger
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-6">Aucun document n'a été ajouté pour le moment.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}