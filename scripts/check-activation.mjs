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
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'CRON_SECRET',
]

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
if (vars.SUPABASE_SERVICE_ROLE_KEY && vars.SUPABASE_SERVICE_ROLE_KEY.startsWith('NEXT_PUBLIC_')) {
  console.log('⚠️  La clé service_role ne doit jamais être préfixée NEXT_PUBLIC_.')
}

if (missing > 0) {
  console.log(`\n${missing} variable(s) manquante(s). Voir INSTALLATION.md.`)
  process.exit(1)
}
console.log('\nTout est en place : `npm run dev` peut démarrer.')
