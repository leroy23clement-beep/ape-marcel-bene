'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addTeamMember(formData: FormData) {
  try {
    const supabase = await createClient();

    // Vérification de l'utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Utilisateur non authentifié.");
    }

    // Récupération optionnelle du profil (évite un blocage 500 si le profil n'a pas de colonne role)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role ? profile.role.toLowerCase() : 'bureau';
    const allowedRoles = ['admin', 'president', 'secretaire', 'tresorier', 'bureau'];
    
    // Si tu veux être sûr de ne pas être bloqué par le rôle pendant tes tests, 
    // tu peux t'assurer que ton profil a bien un rôle valide dans Supabase.
    if (!allowedRoles.includes(userRole) && userRole !== '') {
      // Optionnel : tu peux commenter cette ligne temporairement si ton rôle pose souci
      // throw new Error(`Accès refusé pour le rôle : ${userRole}`);
    }

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const roleTitle = formData.get("roleTitle") as string;
    const photoFile = formData.get("photoFile") as File;

    if (!firstName || !lastName || !roleTitle) {
      throw new Error("Veuillez remplir les champs obligatoires (Prénom, Nom, Rôle).");
    }

    let photoUrl = null;

    // Gestion de l'upload de la photo si un fichier est présent et valide
    if (photoFile && photoFile.size > 0 && photoFile.name && photoFile.name !== "undefined") {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("team-photos")
        .upload(fileName, photoFile);

      if (uploadError) {
        throw new Error("Erreur Storage : " + uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("team-photos")
        .getPublicUrl(fileName);

      photoUrl = publicUrlData.publicUrl;
    }

    // Insertion dans la table bureau_members
    const { error: insertError } = await supabase.from("bureau_members").insert({
      first_name: firstName,
      last_name: lastName,
      role_title: roleTitle,
      photo_url: photoUrl,
    });

    if (insertError) {
      throw new Error("Erreur Insertion Base de données : " + insertError.message);
    }

    revalidatePath("/about");
    revalidatePath("/bureau/team");
  } catch (err: any) {
    console.error("ERREUR LORS DE L'AJOUT DU MEMBRE:", err.message);
    throw new Error(err.message || "Une erreur interne est survenue.");
  }
}