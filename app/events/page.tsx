import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createEvent, registerVolunteer } from "@/lib/actions/events";

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isBureau = profile?.role && profile.role !== "parent";
  const canSeeSecretariat = ["president", "secretaire", "vice_secretaire", "admin"].includes(profile?.role ?? "");

  const { data: events } = await supabase
    .from("events")
    .select("*, event_volunteers(*)")
    .order("event_date", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-8">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Événements APE</h1>
          <p className="text-sm text-gray-600 mt-1">
            Retrouvez la liste des manifestations et proposez votre aide !
          </p>
        </header>

        {/* Formulaire d'ajout réservé aux membres du Bureau */}
        {isBureau && (
          <section className="bg-purple-50/50 border border-purple-200 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
              <span>➕</span> Créer un nouvel événement
            </h2>

            <form action={createEvent} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Titre</label>
                <input type="text" name="title" required placeholder="ex: Fête de l'école" className="w-full text-sm p-2.5 rounded-lg border bg-white" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Date et heure</label>
                <input type="datetime-local" name="event_date" required className="w-full text-sm p-2.5 rounded-lg border bg-white" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Lieu (optionnel)</label>
                <input type="text" name="location" placeholder="ex: Cour de l'école" className="w-full text-sm p-2.5 rounded-lg border bg-white" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Visibilité</label>
                <select name="visibility" className="w-full text-sm p-2.5 rounded-lg border bg-white">
                  <option value="public">Public (Tous les parents)</option>
                  <option value="codir">CODIR uniquement</option>
                  {canSeeSecretariat && (
                    <option value="secretariat">Secrétariat / Présidence</option>
                  )}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-700">Description</label>
                <input type="text" name="description" placeholder="Détails de l'événement" className="w-full text-sm p-2.5 rounded-lg border bg-white" />
              </div>

              <div className="md:col-span-2 flex justify-end pt-2 border-t border-purple-200">
                <button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                  Publier l'événement
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Liste des événements */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Prochains événements</h2>
          {events && events.length > 0 ? (
            events.map((event) => {
              const isRegistered = event.event_volunteers?.some(
                (v: { user_id: string }) => v.user_id === user.id
              );

              return (
                <div key={event.id} className={`bg-white border rounded-xl p-6 shadow-sm space-y-4 ${
                  event.visibility === 'secretariat' ? 'border-red-300 bg-red-50/30' : event.visibility === 'codir' ? 'border-purple-300 bg-purple-50/30' : ''
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {event.visibility === 'secretariat' && (
                          <span className="text-[10px] font-bold uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
                            Secrétariat
                          </span>
                        )}
                        {event.visibility === 'codir' && (
                          <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                            CODIR
                          </span>
                        )}
                        <h3 className="font-bold text-gray-900 text-xl">{event.title}</h3>
                      </div>
                      {event.location && <p className="text-xs text-gray-500">📍 {event.location}</p>}
                    </div>

                    <span className="text-xs font-semibold px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {new Date(event.event_date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>

                  {event.description && <p className="text-sm text-gray-600">{event.description}</p>}

                  <div className="pt-3 border-t flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      👥 <strong>{event.event_volunteers?.length || 0}</strong> bénévole(s) inscrit(s)
                    </div>

                    {isRegistered ? (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium">
                        ✓ Vous êtes inscrit comme bénévole
                      </span>
                    ) : (
                      <form action={registerVolunteer} className="flex gap-2">
                        <input type="hidden" name="eventId" value={event.id} />
                        <input
                          type="text"
                          name="roleNeeded"
                          placeholder="Ex: Tenue de stand..."
                          className="text-xs px-3 py-1.5 border rounded-lg focus:outline-purple-600 bg-white"
                          required
                        />
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                        >
                          Je participe
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border rounded-xl p-8 text-center text-gray-500 text-sm">
              Aucun événement prévu pour le moment.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}