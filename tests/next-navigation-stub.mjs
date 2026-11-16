/**
 * Doublure de `next/navigation` : enregistre la redirection au lieu de la
 * lancer (une vraie `redirect()` ne fonctionne que dans une requête Next).
 * Les tests lisent la cible avec `redirigeVers()`.
 */
export function redirect(url) {
  globalThis.__lastRedirect = String(url)
  const error = new Error(`NEXT_REDIRECT:${url}`)
  error.digest = `NEXT_REDIRECT;replace;${url};307;`
  throw error
}

export function notFound() {
  const error = new Error('NEXT_NOT_FOUND')
  error.digest = 'NEXT_NOT_FOUND'
  throw error
}

export function usePathname() {
  return '/'
}

export function useSearchParams() {
  return new URLSearchParams()
}

export function useRouter() {
  return { push: () => {}, replace: () => {}, refresh: () => {}, back: () => {} }
}
