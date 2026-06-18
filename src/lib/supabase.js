import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loud + early — a misconfigured .env is the #1 cause of a blank app.
  console.error(
    'Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
  )
}

/**
 * Shared browser client. Persists the session in localStorage so the user
 * stays logged in across reloads.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/**
 * A throwaway client whose auth state is NOT persisted. Used by the admin
 * "Add member" flow: calling signUp() on the main client would replace the
 * admin's own session with the new member's. This isolated client signs the
 * new user up without touching the admin's localStorage session.
 */
export function makeIsolatedClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
