'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProductTasksManager({ productId }: { productId: string }) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<any[]>([])
  const [bureauMembers, setBureauMembers] = useState<any[]>([])
  
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [loading, setLoading] = useState(false)

  // Charger les tâches existantes pour ce produit et la liste des membres du bureau
  useEffect(() => {
    async function loadData() {
      // 1. Récupérer les tâches de ce produit
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*, profiles:assigned_to(first_name, last_name)')
        .eq('product_id', productId)
        .order('due_date', { ascending: true })
      
      if (tasksData) setTasks(tasksData)

      // 2. Récupérer les membres du bureau (rôles admin, bureau, etc.)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'parent')

      if (profilesData) setBureauMembers(profilesData)
    }

    if (productId) loadData()
  }, [productId])

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!title) return

    setLoading(true)
    const { error } = await supabase.from('tasks').insert({
      title,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      assigned_to: assignedTo || null,
      product_id: productId,
      status: 'à faire'
    })

    if (!error) {
      setTitle('')
      setDueDate('')
      setAssignedTo('')
      // Recharger les tâches
      const { data } = await supabase
        .from('tasks')
        .select('*, profiles:assigned_to(first_name, last_name)')
        .eq('product_id', productId)
        .order('due_date', { ascending: true })
      if (data) setTasks(data)
    } else {
      alert("Erreur lors de l'ajout de la tâche : " + error.message)
    }
    setLoading(false)
  }

  async function handleDeleteTask(taskId: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId))
    }
  }

  return (
    <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm mt-4">
      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
        📋 Tâches du bureau associées à cette vente
      </h3>

      {/* Liste des tâches actuelles */}
      <div className="space-y-2">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border text-xs">
              <div className="space-y-1">
                <p className="font-bold text-gray-900">{task.title}</p>
                <div className="flex items-center gap-3 text-gray-500">
                  {task.due_date && (
                    <span>📅 {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                  )}
                  <span>👤 Attribué à : {task.profiles ? `${task.profiles.first_name} ${task.profiles.last_name || ''}` : 'Non assigné'}</span>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200 font-semibold">{task.status}</span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-red-600 hover:text-red-800 font-medium cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 italic">Aucune tâche spécifique assignée pour le moment.</p>
        )}
      </div>

      {/* Formulaire d'ajout rapide d'une tâche */}
      <form onSubmit={handleAddTask} className="pt-3 border-t grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <div className="md:col-span-1">
          <label className="block text-[11px] font-bold text-gray-700 mb-1">Tâche</label>
          <input
            type="text"
            placeholder="Ex: Récupérer les bons"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-lg text-xs bg-white text-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">Date limite</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 border rounded-lg text-xs bg-white text-gray-900"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">Membre du bureau</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full p-2 border rounded-lg text-xs bg-white text-gray-900"
          >
            <option value="">Sélectionner...</option>
            {bureauMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.first_name} ({member.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs py-2 rounded-lg transition cursor-pointer"
          >
            {loading ? "Ajout..." : "+ Ajouter la tâche"}
          </button>
        </div>
      </form>
    </div>
  )
}