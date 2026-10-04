'use client'

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function EcolePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [schoolNotices, setSchoolNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire d'ajout
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("info");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newContent, setNewContent] = useState("");

  // Édition en cours (par ID)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("info");
  const [editDate, setEditDate] = useState("");
  const [editContent, setEditContent] = useState("");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(prof);

      fetchNotices();
    }
    loadData();
  }, []);

  async function fetchNotices() {
    const { data } = await supabase
      .from("school_notices")
      .select("*")
      .order("notice_date", { ascending: false });
    setSchoolNotices(data || []);
    setLoading(false);
  }

  const isAdminOrBureau = profile?.role && profile.role !== 'parent';

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle) return;

    await supabase.from("school_notices").insert({
      title: newTitle,
      content: newContent || '',
      category: newCategory || 'info',
      notice_date: newDate || new Date().toISOString()
    });

    setNewTitle("");
    setNewContent("");
    fetchNotices();
  }

  async function handleUpdate(id: string, e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("school_notices").update({
      title: editTitle,
      content: editContent || '',
      category: editCategory || 'info',
      notice_date: editDate || new Date().toISOString()
    }).eq('id', id);

    setEditingId(null);
    fetchNotices();
  }

  async function handleDelete(id: string) {
    if (!confirm("Voulez-vous supprimer cet élément ?")) return;
    await supabase.from("school_notices").delete().eq('id', id);
    fetchNotices();
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">Chargement...</div>;
  }

  const eventsList = schoolNotices.filter((notice) => notice.category === 'trip');
  const linksList = schoolNotices.filter((notice) => notice.category === 'link');
  const generalInfosList = schoolNotices.filter((notice) => notice.category !== 'trip' && notice.category !== 'link');

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar 
        userEmail={user?.email} 
        firstName={profile?.first_name} 
        role={profile?.role} 
      />

      <div className="mx-auto max-w-6xl p-6 flex flex-col space-y-6">
        
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🏫</span> Le coin de l'école & Informations
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Retrouvez ici toutes les actualités, photos de classes, sorties et rappels concernant les écoles de Muizon.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Colonne de gauche : Événements & Infos Générales */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Section Événements */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span>🚌</span> Événements, Sorties & Projets
                </h2>
                <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-semibold">
                  {eventsList.length}
                </span>
              </div>

              <div className="space-y-3">
                {eventsList.length > 0 ? (
                  eventsList.map((notice: any) => (
                    <div key={notice.id} className="p-4 border rounded-xl space-y-2 shadow-sm bg-amber-50/60 border-amber-200 text-amber-900">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-sm">{notice.title}</h3>
                        {notice.notice_date && (
                          <span className="text-[11px] bg-white/95 px-2 py-0.5 rounded border shadow-sm whitespace-nowrap font-medium text-gray-600">
                            📅 {new Date(notice.notice_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{notice.content}</p>

                      {isAdminOrBureau && (
                        <div className="pt-2 border-t border-black/10 space-y-2 text-xs">
                          {editingId === notice.id ? (
                            <form onSubmit={(e) => handleUpdate(notice.id, e)} className="p-3 bg-purple-50/80 border border-purple-200 rounded-lg space-y-2.5">
                              <div>
                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Titre</label>
                                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required className="w-full p-1.5 border rounded text-xs bg-white text-gray-900" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Catégorie</label>
                                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full p-1.5 border rounded text-xs bg-white text-gray-900">
                                  <option value="info">Information générale</option>
                                  <option value="photo">Photo / Souvenir</option>
                                  <option value="trip">Événement / Sortie / Voyage</option>
                                  <option value="link">Lien pratique (URL)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Date</label>
                                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full p-1.5 border rounded text-xs bg-white text-gray-900" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Contenu</label>
                                <textarea rows={2} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-1.5 border rounded text-xs bg-white text-gray-900" />
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded text-xs bg-gray-200 text-gray-700">Annuler</button>
                                <button type="submit" className="bg-purple-700 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-purple-800">Enregistrer</button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex justify-between items-center pt-1">
                              <button onClick={() => {
                                setEditingId(notice.id);
                                setEditTitle(notice.title);
                                setEditCategory(notice.category);
                                setEditDate(notice.notice_date ? notice.notice_date.split('T')[0] : '');
                                setEditContent(notice.content);
                              }} className="text-purple-700 font-semibold hover:underline">
                                ✏️ Modifier
                              </button>
                              <button onClick={() => handleDelete(notice.id)} className="text-red-600 hover:underline font-semibold">
                                🗑 Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic bg-white p-4 rounded-xl border">
                    Aucun événement ou sortie pour le moment.
                  </p>
                )}
              </div>
            </div>

            {/* Section Infos Générales */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span>📢</span> Informations Générales & Vie Scolaire
                </h2>
                <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-semibold">
                  {generalInfosList.length}
                </span>
              </div>

              <div className="space-y-3">
                {generalInfosList.length > 0 ? (
                  generalInfosList.map((notice: any) => (
                    <div key={notice.id} className={`p-4 border rounded-xl space-y-2 shadow-sm ${
                      notice.category === 'photo' ? 'bg-blue-50/60 border-blue-200 text-blue-900' : 'bg-white border-purple-100 text-purple-900'
                    }`}>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-sm">{notice.title}</h3>
                        {notice.notice_date && (
                          <span className="text-[11px] bg-white/95 px-2 py-0.5 rounded border shadow-sm whitespace-nowrap font-medium text-gray-600">
                            📅 {new Date(notice.notice_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{notice.content}</p>

                      {isAdminOrBureau && (
                        <div className="pt-2 border-t border-black/10 space-y-2 text-xs">
                          {editingId === notice.id ? (
                            <form onSubmit={(e) => handleUpdate(notice.id, e)} className="p-3 bg-purple-50/80 border border-purple-200 rounded-lg space-y-2.5">
                              <div>
                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Titre</label>
                                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required className="w-full p-1.5 border rounded text-xs bg-white text-gray-900" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Catégorie</label>
                                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full p-1.5 border rounded text-xs bg-white text-gray-900">
                                  <option value="info">Information générale</option>
                                  <option value="photo">Photo / Souvenir</option>
                                  <option value="trip">Événement / Sortie / Voyage</option>
                                  <option value="link">Lien pratique (URL)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Date</label>
                                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full p-1.5 border rounded text-xs bg-white text-gray-900" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Contenu</label>
                                <textarea rows={2} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-1.5 border rounded text-xs bg-white text-gray-900" />
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded text-xs bg-gray-200 text-gray-700">Annuler</button>
                                <button type="submit" className="bg-purple-700 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-purple-800">Enregistrer</button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex justify-between items-center pt-1">
                              <button onClick={() => {
                                setEditingId(notice.id);
                                setEditTitle(notice.title);
                                setEditCategory(notice.category);
                                setEditDate(notice.notice_date ? notice.notice_date.split('T')[0] : '');
                                setEditContent(notice.content);
                              }} className="text-purple-700 font-semibold hover:underline">
                                ✏️ Modifier
                              </button>
                              <button onClick={() => handleDelete(notice.id)} className="text-red-600 hover:underline font-semibold">
                                🗑 Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic bg-white p-4 rounded-xl border">
                    Aucune information générale pour le moment.
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Colonne de droite : Liens pratiques & Formulaire */}
          <div className="space-y-6">
            
            {/* Bloc Liens Pratiques */}
            <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                <span>🔗</span> Liens pratiques
              </h3>
              <div className="space-y-2">
                {linksList && linksList.length > 0 ? (
                  linksList.map((link: any) => (
                    <div key={link.id} className="flex items-center justify-between bg-gray-50 hover:bg-purple-50 border rounded-lg px-3 py-2 text-xs transition">
                      <a href={link.content} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-700 hover:text-purple-700 flex-1 truncate">
                        🔗 {link.title} ↗
                      </a>
                      {isAdminOrBureau && (
                        <button onClick={() => handleDelete(link.id)} className="text-red-500 hover:text-red-700 ml-2 font-bold cursor-pointer" title="Supprimer">
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucun lien enregistré.</p>
                )}
              </div>
            </div>

            {/* Formulaire de publication */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span>✍</span> Publier une info ou un lien
              </h3>

              {isAdminOrBureau ? (
                <form onSubmit={handleAdd} className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Titre / Nom du lien</label>
                    <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required placeholder="Ex: Portail Cantine..." className="w-full p-2 border rounded-md text-xs text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type d'élément</label>
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full p-2 border rounded-md text-xs bg-white text-gray-900">
                      <option value="info">Information générale</option>
                      <option value="photo">Photo / Souvenir</option>
                      <option value="trip">Événement / Sortie / Voyage</option>
                      <option value="link">Lien pratique (URL)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date affichée</label>
                    <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full p-2 border rounded-md text-xs text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contenu (ou URL si lien)</label>
                    <textarea rows={3} value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Détails ou URL du lien..." className="w-full p-2 border rounded-md text-xs text-gray-900" />
                  </div>
                  <button type="submit" className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold py-2 rounded-md transition cursor-pointer">
                    + Publier
                  </button>
                </form>
              ) : (
                <div className="bg-gray-50 border rounded-xl p-4 text-xs text-gray-500 italic">
                  * Réservé aux membres de l'administration.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}