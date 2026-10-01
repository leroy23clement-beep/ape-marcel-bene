'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

export default function LogoContestPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const [participantName, setParticipantName] = useState('')
  const [childClass, setChildClass] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(profileData)
        if (profileData) {
          setParticipantName(`${profileData.first_name} ${profileData.last_name || ''}`.trim())
        }
      }
    }
    loadUser()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !participantName) {
      alert("Veuillez remplir votre nom et joindre un fichier.")
      return
    }

    setUploading(true)
    try {
      // 1. Upload de l'image du logo dans Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('logo-contest').upload(fileName, file)
      
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('logo-contest').getPublicUrl(fileName)

      // 2. Enregistrement dans une table `logo_submissions`
      const { error: dbError } = await supabase.from('logo_submissions').insert({
        user_id: user ? user.id : null,
        participant_name: participantName,
        child_class: childClass,
        image_url: publicUrlData.publicUrl,
      })

      if (dbError) throw dbError

      setSuccess(true)
      setFile(null)
    } catch (error: any) {
      alert("Erreur lors de l'envoi : " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const isBureau = profile?.role && profile.role !== 'parent'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user?.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-3xl p-6 space-y-8">
        {/* En-tête et Règlement */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              🎨 Événement Spécial
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-3">
              Créons ensemble le nouveau logo de l'Association des Parents Marcel Béné Muizon !
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Notre association souhaite se doter d'un nouveau logo et nous aimerions que ce soit une création imaginée par les familles de notre école !
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <h3 className="font-bold text-gray-900">👨‍👩‍👧‍‍👦 Qui peut participer ?</h3>
            <p className="text-xs text-gray-600">Tous les parents et tous les enfants de l'école.</p>

            <h3 className="font-bold text-gray-900">📌 Quelques règles à respecter :</h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 pl-2">
              <li>Le logo doit obligatoirement comporter le texte : <strong className="text-gray-900">« Association des Parents d'élèves Marcel Béné Muizon »</strong></li>
              <li>Le dessin doit être simple et facilement reconnaissable.</li>
              <li>La lecture doit être claire, même en petit format.</li>
              <li>Utiliser au maximum 3 ou 4 couleurs cohérentes.</li>
              <li>Le logo doit représenter les valeurs : partage, bienveillance, entraide, éducation, convivialité…</li>
              <li>Les créations peuvent être réalisées à la main ou sur ordinateur, <strong className="text-red-600">mais pas par IA !</strong></li>
            </ul>

            <h3 className="font-bold text-gray-900">🏆 Et après ?</h3>
            <p className="text-xs text-gray-600">Toutes les propositions seront étudiées par l'association, puis un vote sera organisé afin d'élire le logo gagnant avant le 21 juin.</p>
          </div>
        </div>

        {/* Formulaire de participation */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">📥 Envoyer votre proposition</h2>

          {success ? (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl text-center space-y-2">
              <p className="font-bold text-sm">🎉 Merci beaucoup ! Votre proposition a bien été envoyée.</p>
              <p className="text-xs text-emerald-700">Le bureau l'examinera très prochainement.</p>
              <button 
                onClick={() => setSuccess(false)}
                className="mt-2 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer"
              >
                Envoyer une autre proposition
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Votre Nom / Prénom (ou Nom de famille)</label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Ex: Famille Dupont"
                  className="w-full p-2.5 border rounded-lg text-xs bg-white text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Classe de l'enfant (optionnel)</label>
                <input
                  type="text"
                  value={childClass}
                  onChange={(e) => setChildClass(e.target.value)}
                  placeholder="Ex: CM1 - École de Muizon"
                  className="w-full p-2.5 border rounded-lg text-xs bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Fichier du logo (Photo du dessin ou fichier numérique)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                  className="w-full p-2 border rounded-lg text-xs bg-white text-gray-900 cursor-pointer"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">Formats acceptés : JPG, PNG, WEBP</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-5 py-2.5 rounded-lg cursor-pointer transition"
                >
                  {uploading ? "Envoi en cours..." : "📤 Soumettre mon logo"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}