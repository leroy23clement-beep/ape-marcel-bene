/** Doublure de `next/headers` : un magasin de cookies en mémoire. */
export async function cookies() {
  return {
    getAll: () => [],
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }
}

export async function headers() {
  return new Headers()
}
