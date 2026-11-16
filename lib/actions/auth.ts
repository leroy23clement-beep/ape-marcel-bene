'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/** N'accepte qu'un chemin interne : évite une redirection ouverte via `?next=`. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === 'string' ? value : ''
  if (!next.startsWith('/') || next.startsWith('//')) return '/dashboard'
  return next
}

export type AuthResult =
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | { ok: true; message?: string }

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNext(formData.get('next'))

  const fieldErrors: Record<string, string> = {}
  if (!email) fieldErrors.email = "L'adresse e-mail est obligatoire."
  if (!password) fieldErrors.password = 'Le mot de passe est obligatoire.'
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: 'Vérifie les champs du formulaire.', fieldErrors }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return {
      ok: false,
      error:
        error.message === 'Invalid login credentials'
          ? 'Identifiants incorrects'
          : error.message,
    }
  }

  redirect(next)
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')
  const firstName = String(formData.get('firstName') ?? '').trim()
  const lastName = String(formData.get('lastName') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()

  const fieldErrors: Record<string, string> = {}
  if (!firstName) fieldErrors.firstName = 'Le prénom est obligatoire.'
  if (!lastName) fieldErrors.lastName = 'Le nom est obligatoire.'
  if (!email) fieldErrors.email = "L'adresse e-mail est obligatoire."
  if (password.length < 8) fieldErrors.password = 'Le mot de passe doit faire au moins 8 caractères.'
  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = 'Les mots de passe doivent être identiques'
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: 'Vérifie les champs du formulaire.', fieldErrors }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      },
    },
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, message: 'Compte créé avec succès !' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
