'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

const ROLE_LABELS: Record<string, string> = {
  parent: "Parent d'élève",
  membre_codir: "Membre du CODIR",
  president: "Président(e)",
  vice_president: "Vice-Président(e)",
  secretaire: "Secrétaire",
  vice_secretaire: "Vice-Secrétaire",
  tresorier: "Trésorier(e)",
  vice_tresorier: "Vice-Trésorier(e)",
  admin: "Administrateur",
}

export default function ProfilePage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // États du formulaire d'ajout d'enfant
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newClassLevel, setNewClassLevel] = useState('')

  // État pour l'enfant en cours de modification (null si aucun)
  const [editingChildId, setEditingChildId] = useState<string | null>(null)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editClassLevel, setEditClassLevel] = useState('')

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
        .select('*, households(*)')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      if (profileData?.household_id) {
        fetchChildren(profileData.household_id)
      }
    }
    loadData()
  }, [])

  const fetchChildren = async (householdId: string) => {
    const { data: childrenData } = await supabase
      .from('children')
      .select('*')
      .eq('household_id', householdId)
    setChildren(childrenData || [])
  }

  // Mettre à jour le profil utilisateur
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const updates = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      phone: formData.get('phone'),
      updated_at: new Date(),
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    setLoading(false)
    if (error) {
      alert("Erreur lors de la mise à jour : " + error.message)
    } else {
      alert("Profil mis à jour avec succès !")
    }
  }

  // Ajouter un enfant
  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.household_id) {
      alert("Aucun foyer associé à votre profil.")
      return
    }

    const { error } = await supabase.from('children').insert({
      household_id: profile.household_id,
      first_name: newFirstName,
      last_name: newLastName,
      class_level: newClassLevel || null,
    })

    if (error) {
      alert("Erreur lors de l'ajout : " + error.message)
    } else {
      setNewFirstName('')
      setNewLastName('')
      setNewClassLevel('')
      fetchChildren(profile.household_id)
    }
  }

  // Activer le mode édition pour un enfant
  const startEditing = (child: any) => {
    setEditingChildId(child.id)
    setEditFirstName(child.first_name)
    setEditLastName(child.last_name)
    setEditClassLevel(child.class_level || '')
  }

  // Enregistrer les modifications d'un enfant
  const handleUpdateChild = async (childId: string) => {
    const { error } = await supabase
      .from('children')
      .update({
        first_name: editFirstName,
        last_name: editLastName,
        class_level: editClassLevel || null,
      })
      .eq('id', childId)

    if (error) {
      alert("Erreur lors de la modification : " + error.message)
    } else {
      setEditingChildId(null)
      fetchChildren(profile.household_id)
    }
  }

  // Supprimer un enfant (avec confirmation)
  const handleDeleteChild = async (childId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet enfant de votre foyer ?")) return

    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId)

    if (error) {
      alert("Erreur lors de la suppression : " + error.message)
    } else {
      fetchChildren(profile.household_id)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-8">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gérez vos informations personnelles, votre rôle et la composition de votre foyer.
          </p>
        </header>

        {/* Informations Personnelles */}
        <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-lg font-semibold text-gray-800">Informations Personnelles</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {ROLE_LABELS[profile?.role ?? "parent"] || profile?.role}
            </span>
          </div>

          <form onSubmit={handleUpdateProfile} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Prénom</label>
              <input
                type="text"
                name="first_name"
                defaultValue={profile?.first_name ?? ""}
                placeholder="Votre prénom"
                className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-emerald-500 text-gray-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Nom</label>
              <input
                type="text"
                name="last_name"
                defaultValue={profile?.last_name ?? ""}
                placeholder="Votre nom"
                className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-emerald-500 text-gray-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Email (non modifiable)</label>
              <input
                type="email"
                disabled
                value={user.email ?? ""}
                className="w-full text-sm p-2.5 rounded-lg border bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Téléphone</label>
              <input
                type="tel"
                name="phone"
                defaultValue={profile?.phone ?? ""}
                placeholder="06 00 00 00 00"
                className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-emerald-500 text-gray-900"
              />
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition cursor-pointer"
              >
                {loading ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </section>

        {/* Section Enfants du foyer */}
        <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">Enfants du foyer</h2>

          {/* Liste des enfants existants */}
          <div className="space-y-3">
            {children && children.length > 0 ? (
              children.map((child) => (
                <div key={child.id} className="p-3 border rounded-lg bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  {editingChildId === child.id ? (
                    // Formulaire de modification inline
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="text-xs p-2 border rounded bg-white text-gray-900"
                        placeholder="Prénom"
                      />
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="text-xs p-2 border rounded bg-white text-gray-900"
                        placeholder="Nom"
                      />
                      <input
                        type="text"
                        value={editClassLevel}
                        onChange={(e) => setEditClassLevel(e.target.value)}
                        className="text-xs p-2 border rounded bg-white text-gray-900"
                        placeholder="Classe"
                      />
                      <div className="md:col-span-3 flex justify-end gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setEditingChildId(null)}
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs rounded transition cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateChild(child.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded transition cursor-pointer"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Affichage normal de l'enfant
                    <>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{child.first_name} {child.last_name}</p>
                        {child.class_level && (
                          <p className="text-xs text-gray-500">Classe : {child.class_level}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(child)}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium rounded-lg transition cursor-pointer"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteChild(child.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-medium rounded-lg transition cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Aucun enfant enregistré dans le foyer pour le moment.</p>
            )}
          </div>

          {/* Formulaire d'ajout d'enfant */}
          <div className="pt-4 border-t space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Ajouter un enfant</h3>
            <form onSubmit={handleAddChild} className="grid gap-3 md:grid-cols-3">
              <input
                type="text"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                required
                placeholder="Prénom"
                className="text-sm p-2.5 rounded-lg border bg-white text-gray-900"
              />
              <input
                type="text"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                required
                placeholder="Nom"
                className="text-sm p-2.5 rounded-lg border bg-white text-gray-900"
              />
              <input
                type="text"
                value={newClassLevel}
                onChange={(e) => setNewClassLevel(e.target.value)}
                placeholder="Classe (ex: PS, CP, CM2)"
                className="text-sm p-2.5 rounded-lg border bg-white text-gray-900"
              />
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-gray-900 hover:bg-black text-white text-xs font-medium px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Ajouter l'enfant
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}