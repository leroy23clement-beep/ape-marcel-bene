'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

export default function AdminSchoolNoticesPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [notices, setNotices] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('info')
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split('T')[0]) // Date du jour par défaut

  useEffect(() => {
    async function load() {
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

      fetchNotices()
    }
    load()
  }, [])

  const fetchNotices = async () => {
    const { data } = await supabase
      .from('school_notices')
      .select('*')
      .order('notice_date', { ascending: false }) // Tri par date de l'information
    if (data) setNotices(data)
  }

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase
      .from('school_notices')
      .insert([{ title, content, category, notice_date: noticeDate }])

    if (!error) {
      setTitle('')
      setContent('')
      setNoticeDate(new Date().toISOString().split('T')[0])
      fetchNotices()
    } else {
      alert("Erreur lors de l'ajout")
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('school_notices').delete().eq('id', id)
    fetchNotices()
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion - Le coin de l'école</h1>

        {/* Formulaire d'ajout */}
        <form onSubmit={handleAddNotice} className="bg-white border p-5 rounded-xl shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm">Ajouter une information école</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Titre (ex: 📸 Photos de classe)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="p-2 border rounded-md text-sm text-gray-900 md:col-span-1"
            />
            <input
              type="date"
              value={noticeDate}
              onChange={(e) => setNoticeDate(e.target.value)}
              required
              className="p-2 border rounded-md text-sm bg-white text-gray-900"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 border rounded-md text-sm bg-white text-gray-900"
            >
              <option value="info">Information générale</option>
              <option value="photo">Photos de classe</option>
              <option value="trip">Sortie scolaire</option>
            </select>
          </div>

          <textarea
            placeholder="Contenu du message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            required
            className="w-full p-2 border rounded-md text-sm text-gray-900"
          />
          <button
            type="submit"
            className="bg-purple-700 text-white text-xs px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition cursor-pointer"
          >
            + Publier l'information
          </button>
        </form>

        {/* Liste des rappels existants */}
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm border-b pb-2">Informations actuellement publiées</h2>
          {notices.length > 0 ? (
            notices.map((notice) => {
              const formattedDate = notice.notice_date 
                ? new Date(notice.notice_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : ''

              return (
                <div key={notice.id} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg border gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs text-gray-900">{notice.title}</h3>
                      {formattedDate && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          📅 {formattedDate}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{notice.content}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium cursor-pointer shrink-0"
                  >
                    Supprimer
                  </button>
                </div>
              )
            })
          ) : (
            <p className="text-xs text-gray-500 italic">Aucune information pour le moment.</p>
          )}
        </div>
      </main>
    </div>
  )
}