/** Doublure de `next/cache` : trace les invalidations sans effet. */
globalThis.__revalidated ??= []

export function revalidatePath(path) {
  globalThis.__revalidated.push(path)
}

export function revalidateTag(tag) {
  globalThis.__revalidated.push(tag)
}
