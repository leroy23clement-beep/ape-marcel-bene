import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function BureauCalendarPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Sécurité : Vérification du rôle bureau ou supérieur
  const allowedRoles = ['admin', 'president', 'secretaire', 'tresorier', 'bureau'];
  if (!profile || !allowedRoles.includes(profile.role?.toLowerCase())) {
    redirect("/dashboard");
  }

  // Récupération des réunions du calendrier bureau
  const { data: meetings } = await supabase
    .from("bureau_calendar")
    .select("*")
    .order("event_date", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <div className="mx-auto max-w-4xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendrier du Bureau</h1>
            <p className="text-sm text-gray-600 mt-1">
              Dates des réunions de préparation et points internes.
            </p>
          </div>
          <Link href="/bureau" className="text-sm font-medium text-purple-700 hover:underline">
            ← Retour Espace Bureau
          </Link>
        </div>

        {/* Liste des réunions */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Prochaines réunions</h2>

          <div className="space-y-3">
            {meetings && meetings.length > 0 ? (
              meetings.map((meeting) => (
                <div key={meeting.id} className="p-4 bg-gray-50 border rounded-lg flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900">{meeting.title}</h3>
                    {meeting.description && (
                      <p className="text-xs text-gray-600">{meeting.description}</p>
                    )}
                    {meeting.location && (
                      <p className="text-xs text-gray-500">📍 {meeting.location}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-3 py-1 rounded-full whitespace-nowrap">
                    {new Date(meeting.event_date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                Aucune réunion planifiée pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}