#!/usr/bin/env node
/**
 * Vérifie que les secrets d'activation sont présents dans `.env.local`
 * SANS jamais afficher leur valeur.
 *
 *   npm run check:activation
 *
 * Une ligne « OK » ou « MANQUANT » par variable, puis un code de sortie 1
 * s'il en manque une (utilisable dans un script de déploiement).
 */
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'CRON_SECRET',
]

/**
 * Clé secrète serveur : `SUPABASE_SECRET_KEY` (nouveau nom Supabase,
 * `sb_secret_…`) ou l'ancien `SUPABASE_SERVICE_ROLE_KEY` (`eyJ…`).
 * Une seule des deux suffit — c'est celle que lit `lib/supabase/admin.ts`.
 */
const SECRET_KEY_NAMES = ['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY']

const file = path.join(process.cwd(), '.env.local')
const vars = { ...process.env }

if (existsSync(file)) {
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (!match) continue
    const [, name, raw] = match
    vars[name] = raw.replace(/^['"]|['"]$/g, '').trim()
  }
} else {
  console.log('⚠️  Aucun .env.local trouvé dans ce dossier.')
}

let missing = 0
for (const name of REQUIRED) {
  const value = vars[name]
  if (value) {
    console.log(`OK        ${name} (${value.length} caractères)`)
  } else {
    console.log(`MANQUANT  ${name}`)
    missing++
  }
}

// Clé secrète serveur : l'un ou l'autre nom convient
const secretName = SECRET_KEY_NAMES.find((name) => vars[name])
if (secretName) {
  console.log(`OK        ${secretName} (${vars[secretName].length} caractères)`)
  const other = SECRET_KEY_NAMES.find((name) => name !== secretName && vars[name])
  if (other) {
    console.log(`ℹ️  ${other} est aussi définie : c'est ${secretName} qui est utilisée.`)
  }
} else {
  console.log(`MANQUANT  ${SECRET_KEY_NAMES.join(' ou ')}`)
  missing++
}

// Contrôles de forme, sans jamais afficher la valeur
if (vars.CRON_SECRET && vars.CRON_SECRET.length < 24) {
  console.log('⚠️  CRON_SECRET fait moins de 24 caractères : utilise `openssl rand -hex 32`.')
}
if (vars.VAPID_PRIVATE_KEY && !/^[A-Za-z0-9_-]{40,}$/.test(vars.VAPID_PRIVATE_KEY)) {
  console.log('⚠️  VAPID_PRIVATE_KEY ne ressemble pas à une clé base64url : recopie-la en entier, sans guillemets.')
}
if (
  vars.NEXT_PUBLIC_SUPABASE_URL &&
  !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(vars.NEXT_PUBLIC_SUPABASE_URL)
) {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_URL ne ressemble pas à https://<projet>.supabase.co.')
}
for (const name of SECRET_KEY_NAMES) {
  if (vars[name]?.startsWith('NEXT_PUBLIC_') || vars[`NEXT_PUBLIC_${name}`]) {
    console.log(`⚠️  La clé secrète (${name}) ne doit jamais être préfixée NEXT_PUBLIC_.`)
  }
}
// Forme de la clé, pour repérer un mauvais copier-coller
const secretValue = secretName ? vars[secretName] : ''
if (secretValue.startsWith('sb_secret_')) {
  console.log('ℹ️  Clé secrète au nouveau format Supabase (sb_secret_…).')
} else if (secretValue.startsWith('eyJ')) {
  console.log('ℹ️  Clé secrète à l\'ancien format JWT (eyJ…, service_role). Fonctionne encore, mais Supabase la retire début 2027.')
} else if (secretValue) {
  console.log('⚠️  La clé secrète ne ressemble ni à sb_secret_… ni à eyJ… : vérifie le copier-coller.')
}

if (missing > 0) {
  console.log(`\n${missing} variable(s) manquante(s). Voir INSTALLATION.md.`)
  process.exit(1)
}
console.log('\nTout est en place : `npm run dev` peut démarrer.')
