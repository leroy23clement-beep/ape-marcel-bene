import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function AboutPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = profileData;
  }

  // Récupération des membres du trombinoscope
  const { data: members } = await supabase
    .from("bureau_members")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userEmail={user?.email || ""} 
        firstName={profile?.first_name} 
        role={profile?.role} 
      />

      <main className="mx-auto max-w-5xl p-6 space-y-10">
        
        {/* En-tête principal */}
        <header className="text-center space-y-3 bg-white border rounded-2xl p-8 shadow-sm">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            L'APE Marcel Béné, <span className="text-purple-700">c'est nous !</span>
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            11 membres actifs de l'Association des Parents d'Élèves des écoles Marcel Béné[cite: 9]. Une association loi 1901 où tout le monde peut être membre gratuitement[cite: 9].
          </p>
        </header>

        {/* Grille des 4 piliers inspirés du visuel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* POUR QUI ? */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-2 border-l-4 border-l-blue-500">
            <h2 className="text-lg font-bold text-blue-600 uppercase tracking-wide">👦👧 Pour qui ? Pour eux !</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Pour tous les enfants des écoles maternelle et élémentaire de Muizon, afin de leur offrir de beaux souvenirs et des activités mémorables.
            </p>
          </div>

          {/* POUR QUOI ? */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-2 border-l-4 border-l-indigo-500">
            <h2 className="text-lg font-bold text-indigo-600 uppercase tracking-wide">🎯 Pour quoi faire ?</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Pour participer aux financements de projets pédagogiques (sorties scolaires, intervenants extérieurs, spectacles, matériel pour les classes...)[cite: 9].
            </p>
          </div>

          {/* COMMENT ? */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-2 border-l-4 border-l-emerald-500">
            <h2 className="text-lg font-bold text-emerald-600 uppercase tracking-wide">🎉 Comment ?</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Au travers de manifestations (vente de gâteaux[cite: 9], boums, kermesse, Babybrac[cite: 9]...). Chaque animation est conçue pour récolter des fonds intégralement reversés aux écoles[cite: 9].
            </p>
          </div>

          {/* AVEC QUI ? */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-2 border-l-4 border-l-amber-500">
            <h2 className="text-lg font-bold text-amber-600 uppercase tracking-wide">🤝 Avec qui ?</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              En partenariat avec les équipes enseignantes, les représentants de parents d'élèves, la Mairie et les autres associations du village[cite: 9].
            </p>
          </div>

        </div>

        {/* SECTION : MAIS C'EST AUSSI VOUS */}
        <div className="bg-purple-900 text-white rounded-2xl p-8 text-center space-y-4 shadow-md">
          <h2 className="text-2xl font-bold">Mais c'est aussi VOUS ![cite: 9]</h2>
          <p className="text-sm text-purple-100 max-w-2xl mx-auto leading-relaxed">
            Tous les parents d'élèves qui souhaitent aider à l'organisation, la préparation de gâteaux ou l'installation lors des manifestations font partie intégrante de l'aventure[cite: 9]. Rejoignez-nous !
          </p>
        </div>

        {/* SECTION : TROMBINOSCOPE (Géré par le bureau) */}
        <section className="space-y-6 pt-4">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">Le Bureau & L'Équipe</h2>
            <p className="text-sm text-gray-600">Les visages derrière l'association.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {members && members.length > 0 ? (
              members.map((member) => (
                <div 
                  key={member.id} 
                  className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-3"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-purple-100 border-2 border-purple-200 flex items-center justify-center">
                    {member.photo_url ? (
                      <img 
                        src={member.photo_url} 
                        alt={`${member.first_name} ${member.last_name}`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-purple-700">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {member.first_name} {member.last_name}
                    </h3>
                    <span className="inline-block text-xs font-semibold uppercase bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                      {member.role_title}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 bg-white border rounded-xl text-gray-500 italic">
                L'équipe sera bientôt présentée ici.
              </div>
            )}
          </div>
        </section>

        {/* SECTION : GALERIE DES ÉVÉNEMENTS */}
        <section className="bg-white border rounded-2xl p-8 shadow-sm text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">📷 Galeries d'événements</h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Retrouvez en images les moments forts, les kermesses et les manifestations passées et à venir.
          </p>
          <div>
            <Link
              href="/events"
              className="inline-block bg-purple-700 hover:bg-purple-800 text-white font-semibold px-6 py-3 rounded-xl shadow transition text-sm cursor-pointer"
            >
              Voir tous les événements →
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}