/**
 * One-time helper — creates (or promotes) an ADMIN account.
 *
 *   node src/createAdmin.js <email> <password> "<Full Name>"
 *
 * Or set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME in .env.local and run with
 * no args. Uses the service-role key (read in Node only, never bundled), so it
 * can create a confirmed auth user via the admin API and write the profile row
 * past RLS.
 *
 * Idempotent: if the auth user already exists, it just (re)writes the profile
 * row with role = 'admin'.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(name) {
  try {
    const text = readFileSync(resolve(projectRoot, name), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let val = m[2].trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!(m[1] in process.env)) process.env[m[1]] = val
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

const [argEmail, argPassword, ...nameParts] = process.argv.slice(2)
const email = (argEmail || process.env.ADMIN_EMAIL || '').trim()
const password = argPassword || process.env.ADMIN_PASSWORD || ''
const fullName = (nameParts.join(' ') || process.env.ADMIN_NAME || '').trim()

if (!email || password.length < 6 || !fullName) {
  console.error(
    '\nUsage: node src/createAdmin.js <email> <password> "<Full Name>"' +
      '\n(password must be at least 6 characters)\n',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Find an existing auth user by email (pages through admin.listUsers). */
async function findUserByEmail(target) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase())
    if (found) return found
    if (data.users.length < 1000) break
  }
  return null
}

async function main() {
  let userId

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip the confirmation email
    user_metadata: { full_name: fullName },
  })

  if (error) {
    // Likely already registered — look them up and continue.
    console.warn(`createUser said: ${error.message}. Checking for an existing user…`)
    const existing = await findUserByEmail(email)
    if (!existing) {
      console.error('Could not create or find that user. Aborting.')
      process.exit(1)
    }
    userId = existing.id
    console.log(`Found existing auth user ${userId}.`)
  } else {
    userId = data.user.id
    console.log(`Created auth user ${userId}.`)
  }

  const { error: profErr } = await supabase
    .from('profiles')
    .upsert({ id: userId, full_name: fullName, role: 'admin' })
  if (profErr) {
    console.error('Failed to write profile row:', profErr.message)
    process.exit(1)
  }

  console.log(`\n✅ Admin ready — log in as ${email} and you'll land on /admin.\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
