/**
 * One-time seed script — inserts every brand from brands.csv into the
 * `brands` table.
 *
 *   1. Put your keys in env files at the project root:
 *        .env        →  VITE_SUPABASE_URL=...   (VITE_SUPABASE_ANON_KEY=...)
 *        .env.local  →  SUPABASE_SERVICE_ROLE_KEY=...   (NEVER commit this)
 *   2. Run from the project root:  node src/seed.js
 *
 * Uses the service-role key so it bypasses RLS. The key is read here in Node
 * only and is never bundled into the browser app.
 *
 * Idempotent: brands whose name already exists are skipped, so re-running is
 * safe.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// --- tiny .env loader (no dotenv dependency) -------------------------------
function loadEnvFile(name) {
  try {
    const text = readFileSync(resolve(projectRoot, name), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const key = m[1]
      let val = m[2].trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {
    /* file optional */
  }
}

loadEnvFile('.env')
loadEnvFile('.env.local')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    '\nMissing env. Need VITE_SUPABASE_URL (.env) and SUPABASE_SERVICE_ROLE_KEY (.env.local).\n',
  )
  process.exit(1)
}

// --- minimal CSV parser (handles quoted fields + embedded commas) ----------
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      if (row.some((v) => v.trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    if (row.some((v) => v.trim() !== '')) rows.push(row)
  }
  return rows
}

async function main() {
  const csv = readFileSync(resolve(projectRoot, 'brands.csv'), 'utf8')
  const rows = parseCsv(csv)
  const header = rows.shift().map((h) => h.trim().toLowerCase())
  const iName = header.indexOf('name')
  const iCat = header.indexOf('category')
  const iFest = header.indexOf('fest_tag')
  if (iName < 0 || iCat < 0 || iFest < 0) {
    console.error('brands.csv must have columns: name, category, fest_tag')
    process.exit(1)
  }

  const all = rows.map((r) => ({
    name: r[iName].trim(),
    category: r[iCat].trim(),
    fest_tag: r[iFest].trim(),
  }))
  console.log(`Parsed ${all.length} brands from brands.csv`)

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  })

  // Skip brands that already exist (idempotent re-runs).
  const { data: existing, error: exErr } = await supabase
    .from('brands')
    .select('name')
  if (exErr) {
    console.error('Could not read existing brands:', exErr.message)
    process.exit(1)
  }
  const have = new Set((existing || []).map((b) => b.name))
  const toInsert = all.filter((b) => b.name && !have.has(b.name))
  const skipped = all.length - toInsert.length

  if (toInsert.length === 0) {
    console.log(`Nothing to insert — all ${all.length} brands already present.`)
    return
  }

  const { error } = await supabase.from('brands').insert(toInsert)
  if (error) {
    console.error('Insert failed:', error.message)
    process.exit(1)
  }

  console.log(`✅ Inserted ${toInsert.length} brands. Skipped ${skipped} existing.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
