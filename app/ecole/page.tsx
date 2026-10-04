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

  // Récupération de toutes les données de school_notices
  const { data: schoolNotices } = await supabase
    .from("school_notices")
    .select("*")
    .order("notice_date", { ascending: false });

  // Tri par catégorie
  const eventsList = schoolNotices?.filter((notice) => notice.category === 'trip') || [];
  const linksList = schoolNotices?.filter((notice) => notice.category === 'link') || [];
  const generalInfosList = schoolNotices?.filter((notice) => notice.category !== 'trip' && notice.category !== 'link') || [];

  // Actions serveur
  async function addSchoolNotice(formData: FormData) {
    'use server'
    const supabaseServer = await createClient();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;
    const notice_date = formData.get('notice_date') as string;

    if (!title) return;

    await supabaseServer.from("school_notices").insert({
      title,
      content: content || '',
      category: category || 'info',
      notice_date: notice_date || new Date().toISOString()
    });

    revalidatePath('/ecole');
  }

  async function deleteNotice(formData: FormData) {
    'use server'
    const supabaseServer = await createClient();
    const id = formData.get('id') as string;
    if (!id) return;

    await supabaseServer.from("school_notices").delete().eq('id', id);
    revalidatePath('/ecole');
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
                  eventsList.map((notice) => (
                    <NoticeCard key={notice.id} notice={notice} isAdminOrBureau={isAdminOrBureau} deleteAction={deleteNotice} />
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
                  generalInfosList.map((notice) => (
                    <NoticeCard key={notice.id} notice={notice} isAdminOrBureau={isAdminOrBureau} deleteAction={deleteNotice} />
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
                        <form action={deleteNotice}>
                          <input type="hidden" name="id" value={link.id} />
                          <button type="submit" className="text-red-500 hover:text-red-700 ml-2 font-bold cursor-pointer" title="Supprimer">
                            ✕
                          </button>
                        </form>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucun lien enregistré.</p>
                )}
              </div>
            </div>

            {/* Formulaire de publication (Annonces et Liens) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span>✍</span> Publier une info ou un lien
              </h3>

              {isAdminOrBureau ? (
                <form action={addSchoolNotice} className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Titre / Nom du lien</label>
                    <input type="text" name="title" required placeholder="Ex: Portail Cantine..." className="w-full p-2 border rounded-md text-xs text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type d'élément</label>
                    <select name="category" className="w-full p-2 border rounded-md text-xs bg-white text-gray-900">
                      <option value="info">Information générale</option>
                      <option value="photo">Photo / Souvenir</option>
                      <option value="trip">Événement / Sortie / Voyage</option>
                      <option value="link">Lien pratique (URL)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date affichée (ou URL si lien)</label>
                    <input type="date" name="notice_date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2 border rounded-md text-xs text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contenu (ou Lien https://... si lien)</label>
                    <textarea name="content" rows={3} placeholder="Détails ou URL du lien..." className="w-full p-2 border rounded-md text-xs text-gray-900" />
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

// Composant carte avec bouton supprimer
function NoticeCard({ notice, isAdminOrBureau, deleteAction }: { notice: any; isAdminOrBureau: boolean; deleteAction: any }) {
  return (
    <div className={`p-4 border rounded-xl space-y-2 shadow-sm ${
      notice.category === 'photo' ? 'bg-blue-50/60 border-blue-200 text-blue-900' :
      notice.category === 'trip' ? 'bg-amber-50/60 border-amber-200 text-amber-900' :
      'bg-white border-purple-100 text-purple-900'
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
        <div className="pt-2 border-t border-black/10 flex items-center justify-end gap-3 text-xs">
          <form action={deleteAction} onSubmit={(e) => { if(!confirm("Voulez-vous supprimer cet élément ?")) e.preventDefault(); }}>
            <input type="hidden" name="id" value={notice.id} />
            <button type="submit" className="text-red-600 hover:underline font-semibold cursor-pointer">
              🗑 Supprimer
            </button>
          </form>
        </div>
      )}
    </div>
  );
}