'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function BureauTasksOverviewPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);

  const router = useRouter();
  const supabase = createClient();

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

        await fetchAllTasks();
      } catch (err) {
        console.error("Erreur d'initialisation:", err);
      } finally {
        setLoadingUser(false);
      }
    }

    initData();
  }, [router]);

  async function fetchAllTasks() {
    // Récupère toutes les tâches avec les informations de l'événement associé (titre)
    const { data, error } = await supabase
      .from("event_tasks")
      .select(`
        *,
        events (
          id,
          title,
          event_date
        )
      `)
      .order("due_date", { ascending: true });

    if (data) setTasks(data);
    if (error) console.error("Erreur chargement tâches:", error.message);
  }

  async function toggleTask(id: string, currentStatus: boolean) {
    await supabase.from('event_tasks').update({ completed: !currentStatus }).eq('id', id);
    fetchAllTasks();
  }

  const priorityBadge = (p: string) => {
    switch (p) {
      case 'haute': return <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-700 rounded-full font-semibold uppercase">Haute</span>;
      case 'moyenne': return <span className="px-2 py-0.5 text-[10px] bg-orange-100 text-orange-700 rounded-full font-semibold uppercase">Moyenne</span>;
      default: return <span className="px-2 py-0.5 text-[10px] bg-green-100 text-green-700 rounded-full font-semibold uppercase">Basse</span>;
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">Chargement en cours...</p>
      </div>
    );
  }

  const currentUserName = profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user?.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suivi des Tâches par Événement</h1>
            <p className="text-sm text-gray-600 mt-1">
              Vue d'ensemble de toutes les tâches de l'association. Celles qui vous sont assignées apparaissent en surbrillance.
            </p>
          </div>
          <div>
            <Link href="/bureau" className="text-sm font-medium text-gray-600 hover:underline">
              ← Retour Espace Bureau
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Liste de toutes les tâches ({tasks.length})</h2>

          <div className="space-y-3">
            {tasks.length > 0 ? (
              tasks.map((task) => {
                // Vérifie si la tâche est assignée à l'utilisateur connecté
                const isAssignedToMe = task.assigned_to && currentUserName && task.assigned_to.toLowerCase().includes(profile.first_name.toLowerCase());

                return (
                  <div 
                    key={task.id} 
                    className={`p-4 border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                      isAssignedToMe 
                        ? 'bg-purple-50/80 border-purple-300 shadow-xs' 
                        : 'bg-white hover:bg-gray-50'
                    } ${task.completed ? 'opacity-60 bg-gray-100' : ''}`}
                  >
                    <div className="space-y-1.5 flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id, task.completed)}
                        className="w-4 h-4 text-purple-600 rounded cursor-pointer mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                            {task.events?.title || "Événement général"}
                          </span>
                          {isAssignedToMe && (
                            <span className="text-[10px] font-bold uppercase bg-purple-700 text-white px-2 py-0.5 rounded animate-pulse">
                              Pour vous 🎯
                            </span>
                          )}
                        </div>

                        <p className={`text-sm font-bold text-gray-900 mt-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          {task.due_date && (
                            <span>📅 Échéance : {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                          )}
                          <span>👤 Assigné à : <strong className={isAssignedToMe ? "text-purple-900 font-extrabold" : "text-gray-700"}>{task.assigned_to || "Non assigné"}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {priorityBadge(task.priority)}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-6">Aucune tâche enregistrée pour le moment.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}