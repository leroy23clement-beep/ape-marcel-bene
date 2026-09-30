'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function ManageTeamPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // États du formulaire
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  // 1. Vérification de l'authentification, du rôle et chargement des membres au montage
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

        // Charger les membres
        await fetchMembers();
      } catch (err) {
        console.error("Erreur d'initialisation:", err);
      } finally {
        setLoadingUser(false);
      }
    }

    initData();
  }, [router]);

  async function fetchMembers() {
    const { data } = await supabase
      .from("bureau_members")
      .select("*")
      .order("display_order", { ascending: true });
    
    if (data) setMembers(data);
  }

  // 2. Gestion de l'ajout d'un membre directement côté client (évite l'erreur 500 des Server Actions)
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const roleTitle = formData.get('roleTitle') as string;
    const photoFile = formData.get('photoFile') as File;

    try {
      let photoUrl = null;

      // Upload de la photo si présente
      if (photoFile && photoFile.size > 0 && photoFile.name !== 'undefined') {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('team-photos')
          .upload(fileName, photoFile);

        if (uploadError) {
          throw new Error("Erreur lors de l'upload de l'image : " + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('team-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrlData.publicUrl;
      }

      // Insertion dans Supabase
      const { error: insertError } = await supabase.from('bureau_members').insert({
        first_name: firstName,
        last_name: lastName,
        role_title: roleTitle,
        photo_url: photoUrl,
      });

      if (insertError) {
        throw new Error("Erreur d'insertion dans la base : " + insertError.message);
      }

      // Réinitialiser le formulaire et recharger la liste des membres
      e.currentTarget.reset();
      await fetchMembers();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion du Trombinoscope</h1>
            <p className="text-sm text-gray-600 mt-1">
              Ajoutez ou mettez à jour les membres affichés dans la page de présentation.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" target="_blank" className="text-sm font-medium text-purple-700 hover:underline">
              Voir la page publique ↗
            </Link>
            <Link href="/bureau" className="text-sm font-medium text-gray-600 hover:underline">
              ← Retour Espace Bureau
            </Link>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Ajouter un membre</h2>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="Ex: Clément"
                  className="w-full p-2 border rounded-md text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Ex: Leroy"
                  className="w-full p-2 border rounded-md text-sm text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fonction / Rôle (affiché) *</label>
                <input
                  type="text"
                  name="roleTitle"
                  required
                  placeholder="Ex: Président, Trésorier..."
                  className="w-full p-2 border rounded-md text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Photo depuis le PC (optionnel)</label>
                <input
                  type="file"
                  name="photoFile"
                  accept="image/*"
                  className="w-full p-1.5 border rounded-md text-sm text-gray-900 bg-white file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-700 text-white text-sm py-2 rounded-md hover:bg-purple-800 transition font-medium cursor-pointer disabled:opacity-50"
            >
              {loading ? "Enregistrement en cours..." : "+ Enregistrer le membre"}
            </button>
          </form>
        </div>

        {/* Liste des membres actuels */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Membres actuels ({members.length})</h2>

          <div className="space-y-3">
            {members.length > 0 ? (
              members.map((member) => (
                <div key={member.id} className="p-3 bg-gray-50 border rounded-lg flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-xs shrink-0">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{member.first_name} {member.last_name}</p>
                      <p className="text-xs text-purple-700 font-medium">{member.role_title}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Aucun membre enregistré pour le moment.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}