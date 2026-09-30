'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function ManageCalendarPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // États du formulaire
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  // 1. Vérification de l'authentification et des rôles
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

        await fetchMeetings();
      } catch (err) {
        console.error("Erreur d'initialisation:", err);
      } finally {
        setLoadingUser(false);
      }
    }

    initData();
  }, [router]);

  // 2. Charger la liste des réunions (triées par "event_date")
  async function fetchMeetings() {
    const { data, error } = await supabase
      .from("bureau_calendar")
      .select("*")
      .order("event_date", { ascending: true });
    
    if (data) setMeetings(data);
    if (error) console.error("Erreur chargement réunions:", error.message);
  }

  // 3. Ajouter une réunion
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const eventDate = formData.get('eventDate') as string;
    const location = formData.get('location') as string;
    const description = formData.get('description') as string;

    try {
      const { error: insertError } = await supabase.from('bureau_calendar').insert({
        title,
        event_date: eventDate,
        location: location || null,
        description: description || '', // Si vide, envoie une chaîne vide pour éviter l'erreur NOT NULL
      });

      if (insertError) {
        throw new Error("Erreur lors de l'ajout de la réunion : " + insertError.message);
      }

      form.reset();
      await fetchMeetings();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  // 4. Supprimer une réunion
  async function handleDelete(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer cette réunion ?")) return;

    const { error } = await supabase
      .from("bureau_calendar")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
    } else {
      await fetchMeetings();
    }
  }

  if (loadingUser) {
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
            <h1 className="text-2xl font-bold text-gray-900">Calendrier du Bureau</h1>
            <p className="text-sm text-gray-600 mt-1">
              Planifiez et gérez les dates des réunions de préparation et points internes.
            </p>
          </div>
          <div>
            <Link href="/bureau" className="text-sm font-medium text-gray-600 hover:underline">
              ← Retour Espace Bureau
            </Link>
          </div>
        </div>

        {/* Formulaire d'ajout de réunion */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Planifier une réunion</h2>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Titre de la réunion *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ex: Point préparation Fête des Enfants"
                  className="w-full p-2 border rounded-md text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date et heure *</label>
                <input
                  type="datetime-local"
                  name="eventDate"
                  required
                  className="w-full p-2 border rounded-md text-sm text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Lieu (optionnel)</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Ex: Salle de la mairie / En visio"
                  className="w-full p-2 border rounded-md text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description / Ordre du jour (optionnel)</label>
                <input
                  type="text"
                  name="description"
                  placeholder="Ex: Budget, répartition des stands..."
                  className="w-full p-2 border rounded-md text-sm text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-700 text-white text-sm py-2 rounded-md hover:bg-purple-800 transition font-medium cursor-pointer disabled:opacity-50"
            >
              {loading ? "Planification en cours..." : "+ Planifier la réunion"}
            </button>
          </form>
        </div>

        {/* Liste des prochaines réunions */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Prochaines réunions ({meetings.length})</h2>

          <div className="space-y-3">
            {meetings.length > 0 ? (
              meetings.map((meeting) => {
                const formattedDate = meeting.event_date ? new Date(meeting.event_date).toLocaleString('fr-FR', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                }) : '';

                return (
                  <div key={meeting.id} className="p-4 bg-gray-50 border rounded-lg flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-gray-900">{meeting.title}</p>
                      {formattedDate && <p className="text-xs font-medium text-purple-700">📅 {formattedDate}</p>}
                      {meeting.location && <p className="text-xs text-gray-600">📍 {meeting.location}</p>}
                      {meeting.description && <p className="text-xs text-gray-500 italic mt-1">{meeting.description}</p>}
                    </div>
                    <button
                      onClick={() => handleDelete(meeting.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition shrink-0 cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 italic">Aucune réunion planifiée pour le moment.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}