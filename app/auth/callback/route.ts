import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Seules les destinations internes sont acceptées après connexion.
 * Avant : `new URL(next, origin)` acceptait `https://exemple.com`, ce qui
 * permettait une redirection ouverte depuis un lien de confirmation.
 */
function safeNext(next: string | null): string {
  if (!next) return '/dashboard'
  // Rejette une URL absolue, protocol-relative ou contenant un schéma
  if (!next.startsWith('/') || next.startsWith('//')) return '/dashboard'
  return next
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = safeNext(requestUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=callback_error', requestUrl.origin))
}
