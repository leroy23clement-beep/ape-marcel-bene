'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = (formData.get('next') as string) || '/dashboard'

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      ok: false,
      error: error.message === 'Invalid login credentials' 
        ? 'Identifiants incorrects' 
        : error.message,
    }
  }

  redirect(next)
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string

  // Validation basique
  if (password !== confirmPassword) {
    return {
      ok: false,
      error: 'Les mots de passe ne correspondent pas.',
      fieldErrors: { confirmPassword: 'Les mots de passe doivent être identiques' },
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  })

  if (error) {
    return {
      ok: false,
      error: error.message,
    }
  }

  return {
    ok: true,
    message: 'Compte créé avec succès !',
  }
}
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}