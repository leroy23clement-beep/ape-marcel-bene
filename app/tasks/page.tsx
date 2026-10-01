'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

export default function TasksPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      // Vérification rapide des droits bureau
      if (profileData?.role === 'parent') {
        window.location.href = '/dashboard'
        return
      }

      fetchTasks()
    }
    loadData()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        profiles:assigned_to (first_name, last_name, role),
        products:product_id (name)
      `)
      .order('due_date', { ascending: true })

    if (error) {
      console.error("Erreur chargement tâches:", error)
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (error) {
      alert("Erreur lors de la mise à jour du statut : " + error.message)
    } else {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Voulez-vous supprimer cette tâche ?")) return

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId))
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-5xl p-6 space-y-8">
        <header className="border-b pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suivi des Tâches du Bureau</h1>
            <p className="text-sm text-gray-600 mt-1">
              Visualisez et gérez l'ensemble des tâches associées aux ventes et aux projets de l'association.
            </p>
          </div>
          <button
            onClick={fetchTasks}
            className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-2 rounded-lg font-medium transition cursor-pointer"
          >
            🔄 Actualiser
          </button>
        </header>

        {/* Liste des tâches */}
        <section className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 text-sm">Liste globale des tâches ({tasks.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Chargement des tâches...</div>
          ) : tasks.length > 0 ? (
            <div className="divide-y">
              {tasks.map((task) => (
                <div key={task.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm">{task.title}</h3>
                      {task.products?.name && (
                        <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
                          🛍️ Vente : {task.products.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      {task.due_date && (
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          📅 Échéance : {new Date(task.due_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      <span>
                        👤 Assigné à : <strong className="text-gray-800">{task.profiles ? `${task.profiles.first_name} ${task.profiles.last_name || ''}` : 'Non assigné'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    {/* Sélecteur de statut */}
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className={`text-xs font-semibold p-1.5 rounded-lg border cursor-pointer ${
                        task.status === 'terminé' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : task.status === 'en cours' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="à faire">À faire</option>
                      <option value="en cours">En cours</option>
                      <option value="terminé">Terminé</option>
                    </select>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium p-1 cursor-pointer"
                      title="Supprimer la tâche"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-400 italic">
              Aucune tâche enregistrée pour le moment. Vous pouvez en ajouter directement depuis chaque fiche de vente dans la boutique.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}