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

  // Séparation des données par catégorie
  const eventsList = schoolNotices?.filter((notice) => notice.category === 'trip') || [];
  const generalInfosList = schoolNotices?.filter((notice) => notice.category !== 'trip') || [];

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

      <div className="mx-auto max-w-6xl p-6 flex flex-col space-y-6">
        
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🏫</span> Le coin de l'école & Informations
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Retrouvez ici toutes les actualités, photos de classes, sorties et rappels concernant les écoles de Muizon.
          </p>
        </header>

        {/* Grille principale en 3 colonnes : 2 pour le contenu, 1 pour le formulaire et les liens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Colonne de gauche (2 colonnes de large) : Événements d'un côté, Infos générales de l'autre */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Section 1 : Événements & Sorties */}
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
                  eventsList.map((notice) => (
                    <div 
                      key={notice.id} 
                      className="p-4 border rounded-xl space-y-2 shadow-sm bg-amber-50/60 border-amber-200 text-amber-900"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-sm">{notice.title}</h3>
                        {notice.notice_date && (
                          <span className="text-[11px] bg-white/90 px-2 py-0.5 rounded border shadow-sm whitespace-nowrap font-medium text-gray-600">
                            📅 {new Date(notice.notice_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{notice.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic bg-white p-4 rounded-xl border">
                    Aucun événement ou sortie pour le moment.
                  </p>
                )}
              </div>
            </div>

            {/* Section 2 : Informations Générales & Photos */}
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
                  generalInfosList.map((notice) => (
                    <div 
                      key={notice.id} 
                      className={`p-4 border rounded-xl space-y-2 shadow-sm ${
                        notice.category === 'photo' ? 'bg-blue-50/60 border-blue-200 text-blue-900' : 'bg-white border-purple-100 text-purple-900'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-sm">{notice.title}</h3>
                        {notice.notice_date && (
                          <span className="text-[11px] bg-white/90 px-2 py-0.5 rounded border shadow-sm whitespace-nowrap font-medium text-gray-600">
                            📅 {new Date(notice.notice_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{notice.content}</p>
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

          {/* Colonne de droite : Liens pratiques (Cantine...) & Formulaire de publication */}
          <div className="space-y-6">
            
            {/* Bloc Liens Utiles / Cantine */}
            <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                <span>🔗</span> Liens pratiques
              </h3>
              <div className="space-y-2">
                <a
                  href="https://www.muizon.fr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-2.5 bg-gray-50 hover:bg-purple-50 border rounded-lg text-xs font-medium text-gray-700 hover:text-purple-700 transition flex items-center justify-between"
                >
                  <span>🍽️ Portail Cantine & Périscolaire</span>
                  <span>↗</span>
                </a>
                <a
                  href="https://www.education.gouv.fr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-2.5 bg-gray-50 hover:bg-purple-50 border rounded-lg text-xs font-medium text-gray-700 hover:text-purple-700 transition flex items-center justify-between"
                >
                  <span>📅 Calendrier Scolaire Officiel</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Formulaire d'ajout (Réservé admin / bureau) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span>✍️</span> Publier une info
              </h3>

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
                      <option value="trip">Événement / Sortie / Voyage</option>
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
    </div>
  );
}