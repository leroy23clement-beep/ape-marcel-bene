import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { addChild } from "@/lib/actions/children";
import Navbar from "@/components/Navbar";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Profil & Foyer
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, households(*)")
    .eq("id", user.id)
    .single();

  // Liste des enfants du foyer
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("household_id", profile?.household_id ?? "");

  // Récupération des prochains événements à venir
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(3);

  // Récupération des statistiques financières de l'association (ex: table association_stats ou config globale)
  // On suppose une table 'association_stats' avec une ligne unique ou filtrée par l'année en cours
  const { data: stats } = await supabase
    .from("association_stats")
    .select("*")
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation */}
      <Navbar 
        userEmail={user.email} 
        firstName={profile?.first_name} 
        role={profile?.role} 
      />

      <div className="mx-auto max-w-4xl p-6 space-y-6">
        
        {/* Section Indicateurs Financiers de l'Association */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bénéfices Manifestations (Année)
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {stats?.total_profits ? `${stats.total_profits} €` : "0 €"}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full text-lg">
              💶
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dépensé pour les écoles
              </p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats?.total_school_expenses ? `${stats.total_school_expenses} €` : "0 €"}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full text-lg">
              🏫
            </div>
          </div>
        </div>

        <main className="grid gap-6 md:grid-cols-2">
          {/* Section Foyer & Enfants */}
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">
              Mon Foyer & Enfants
            </h2>

            <div className="space-y-2">
              {children && children.length > 0 ? (
                children.map((child) => (
                  <div
                    key={child.id}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {child.first_name} {child.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Classe : {child.class_name}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Aucun enfant enregistré pour le moment.
                </p>
              )}
            </div>

            <form action={addChild} className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700">
                Ajouter un enfant
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="firstName"
                  placeholder="Prénom"
                  required
                  className="p-2 border rounded-md text-sm text-gray-900"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Nom"
                  defaultValue={profile?.last_name ?? ""}
                  required
                  className="p-2 border rounded-md text-sm text-gray-900"
                />
              </div>
              <select
                name="className"
                required
                className="w-full p-2 border rounded-md text-sm bg-white text-gray-900"
              >
                <option value="">Sélectionner la classe...</option>
                <option value="TPS">TPS</option>
                <option value="PS">PS</option>
                <option value="MS">MS</option>
                <option value="GS">GS</option>
                <option value="CP">CP</option>
                <option value="CE1">CE1</option>
                <option value="CE2">CE2</option>
                <option value="CM1">CM1</option>
                <option value="CM2">CM2</option>
              </select>
              <button
                type="submit"
                className="w-full bg-black text-white text-sm py-2 rounded-md hover:bg-gray-800 transition cursor-pointer"
              >
                + Enregistrer l'enfant
              </button>
            </form>
          </div>

          {/* Section Prochains Événements */}
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">
              Prochains Événements
            </h2>

            <div className="space-y-3">
              {upcomingEvents && upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="p-3 bg-gray-50 border rounded-lg space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm text-gray-900">{event.title}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {new Date(event.event_date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    {event.location && (
                      <p className="text-xs text-gray-500">📍 {event.location}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Aucun événement à venir pour le moment.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}