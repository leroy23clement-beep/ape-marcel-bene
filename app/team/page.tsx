import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default async function TeamPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Récupération du profil si connecté (pour la Navbar)
  let profile = null;
  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = profileData;
  }

  // Récupération des membres du bureau triés
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

      <main className="mx-auto max-w-5xl p-6 space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Qui sommes-nous ?</h1>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Découvrez les membres du bureau et de l'équipe de l'APE Marcel Béné qui œuvrent toute l'année pour les enfants.
          </p>
        </header>

        {/* Grille du trombinoscope */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {members && members.length > 0 ? (
            members.map((member) => (
              <div 
                key={member.id} 
                className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-3 hover:shadow-md transition"
              >
                {/* Photo ou Avatar par défaut */}
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

                {/* Informations */}
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
            <div className="col-span-full text-center py-10 bg-white border rounded-xl p-6 text-gray-500 italic">
              L'équipe sera bientôt présentée ici !
            </div>
          )}
        </div>
      </main>
    </div>
  );
}