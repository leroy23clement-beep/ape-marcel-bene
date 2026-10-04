import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Navbar from "@/components/Navbar";

export default async function EcolePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdminOrBureau = profile?.role && profile.role !== 'parent';

  // Récupération des actualités de l'école
  const { data: schoolNotices } = await supabase
    .from("school_notices")
    .select("*")
    .order("notice_date", { ascending: false });

  // Action pour ajouter une information scolaire
  async function addSchoolNotice(formData: FormData) {
    'use server'
    const supabaseServer = await createClient();
    
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;
    const notice_date = formData.get('notice_date') as string;

    if (!title || !content) return;

    await supabaseServer.from("school_notices").insert({
      title,
      content,
      category: category || 'info',
      notice_date: notice_date || new Date().toISOString()
    });

    revalidatePath('/ecole');
    revalidatePath('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar 
        userEmail={user.email} 
        firstName={profile?.first_name} 
        role={profile?.role} 
      />

      <div className="mx-auto max-w-5xl p-6 flex flex-col space-y-6">
        
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🏫</span> Le coin de l'école & Informations
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Retrouvez ici toutes les actualités, photos de classes, sorties et rappels concernant les écoles de Muizon.
          </p>
        </header>

        {/* Grille principale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Liste des infos de l'école (2 colonnes) */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Actualités récentes</h2>
            
            <div className="space-y-3">
              {schoolNotices && schoolNotices.length > 0 ? (
                schoolNotices.map((notice) => (
                  <div 
                    key={notice.id} 
                    className={`p-4 border rounded-xl space-y-2 shadow-sm ${
                      notice.category === 'photo' ? 'bg-blue-50/60 border-blue-200 text-blue-900' :
                      notice.category === 'trip' ? 'bg-amber-50/60 border-amber-200 text-amber-900' :
                      'bg-white border-purple-100 text-purple-900'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-sm">{notice.title}</h3>
                      {notice.notice_date && (
                        <span className="text-[11px] bg-white/80 px-2 py-0.5 rounded border shadow-sm whitespace-nowrap font-medium text-gray-600">
                          📅 {new Date(notice.notice_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{notice.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic bg-white p-4 rounded-xl border">
                  Aucune information scolaire pour le moment.
                </p>
              )}
            </div>
          </div>

          {/* Formulaire d'ajout (Réservé admin / bureau) */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Publier une info</h2>

            {isAdminOrBureau ? (
              <form action={addSchoolNotice} className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Titre de l'annonce</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="Ex: Sortie au théâtre..."
                    className="w-full p-2 border rounded-md text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
                  <select
                    name="category"
                    className="w-full p-2 border rounded-md text-xs bg-white text-gray-900"
                  >
                    <option value="info">Information générale</option>
                    <option value="photo">Photo / Souvenir</option>
                    <option value="trip">Sortie / Voyage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date affichée</label>
                  <input
                    type="date"
                    name="notice_date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 border rounded-md text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contenu</label>
                  <textarea
                    name="content"
                    rows={3}
                    required
                    placeholder="Détails de l'information..."
                    className="w-full p-2 border rounded-md text-xs text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold py-2 rounded-md transition cursor-pointer"
                >
                  + Publier l'annonce
                </button>
              </form>
            ) : (
              <div className="bg-gray-50 border rounded-xl p-4 text-xs text-gray-500 italic">
                * La publication d'informations scolaires est réservée aux membres de l'équipe et de l'administration.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}