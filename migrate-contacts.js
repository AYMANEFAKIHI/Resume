// migrate-contacts.js
// Migrates contacts_db.json → Supabase contacts_db table
// Run: node migrate-contacts.js

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ── Load .env manually (no dotenv dependency needed) ─────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '.env')

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !process.env[key]) process.env[key] = val
  }
  console.log('✓ Loaded .env file')
} else {
  console.log('⚠  No .env file found — using existing environment variables')
}

// ── Validate ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  console.error('\n❌  SUPABASE_URL is missing.')
  console.error('   Add it to your .env file:')
  console.error('   SUPABASE_URL=https://your-project.supabase.co\n')
  process.exit(1)
}

if (!SERVICE_KEY) {
  console.error('\n❌  SUPABASE_SERVICE_ROLE_KEY is missing.')
  console.error('   Get it from: supabase.com → your project → Settings → API → service_role key')
  console.error('   Add it to your .env file:')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...\n')
  process.exit(1)
}

// ── Load contacts_db.json ─────────────────────────────────────────────────────
const jsonPath = path.join(__dirname, 'public', 'contacts_db.json')

if (!fs.existsSync(jsonPath)) {
  console.error(`\n❌  contacts_db.json not found at: ${jsonPath}\n`)
  process.exit(1)
}

const companies = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
console.log(`✓ Loaded ${companies.length} companies from contacts_db.json`)

// ── Flatten companies → individual contact rows ───────────────────────────────
const rows = []
for (const company of companies) {
  for (const contact of (company.contacts ?? [])) {
    rows.push({
      company_name: company.name     ?? null,
      city:         company.city     ?? null,
      address:      company.address  ?? null,
      contact_name: contact.name     ?? null,
      role:         contact.role     ?? null,
      email:        contact.email    ?? null,
      phone:        contact.phone    ?? null,
      is_hr:        contact.is_hr    ?? false,
    })
  }
}

console.log(`✓ Flattened to ${rows.length} contact rows`)

// ── Check table exists ────────────────────────────────────────────────────────
const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const { error: tableCheckError } = await sb.from('contacts_db').select('id').limit(1)
if (tableCheckError) {
  console.error('\n❌  Cannot access contacts_db table.')
  console.error('   Make sure you ran supabase-migration.sql first.')
  console.error('   Error:', tableCheckError.message, '\n')
  process.exit(1)
}

// ── Check if already migrated ─────────────────────────────────────────────────
const { count } = await sb.from('contacts_db').select('id', { count: 'exact', head: true })
if (count > 0) {
  console.log(`\n⚠  Table already has ${count} rows.`)
  const args = process.argv.slice(2)
  if (!args.includes('--force')) {
    console.log('   Run with --force to re-migrate and overwrite.')
    console.log('   node migrate-contacts.js --force\n')
    process.exit(0)
  }
  console.log('   --force flag detected, clearing table and re-migrating...')
  await sb.from('contacts_db').delete().neq('id', 0)
  console.log('   ✓ Table cleared')
}

// ── Insert in batches of 500 ──────────────────────────────────────────────────
const BATCH = 500
let inserted = 0

console.log(`\nInserting ${rows.length} rows in batches of ${BATCH}...`)

for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH)
  const { error } = await sb.from('contacts_db').insert(batch)
  if (error) {
    console.error(`\n❌  Error on batch ${i}–${i + batch.length}:`, error.message)
    console.error('   Rows inserted so far:', inserted)
    process.exit(1)
  }
  inserted += batch.length
  const pct = Math.round((inserted / rows.length) * 100)
  process.stdout.write(`\r   Progress: ${inserted}/${rows.length} rows (${pct}%)`)
}

console.log('\n\n✅  Migration complete!')
console.log(`   ${inserted} contact rows inserted into contacts_db table.`)
console.log(`   ${companies.length} companies covered.\n`)