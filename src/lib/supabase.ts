import { createClient } from '@supabase/supabase-js'
import { phoneToEmail, BRAND } from '@/lib/brand'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0

/**
 * Supabase client configured for static-export (GitHub Pages) deployment.
 *
 * Key production settings:
 * - autoRefreshToken: true  → tokens refresh silently before expiring
 * - persistSession: true    → session survives page reload (localStorage)
 * - detectSessionInUrl: false → we're a static SPA, no server callback route
 * - storageKey: namespaced   → avoids clashes if multiple apps share a domain
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storageKey: BRAND.storageKey,
      flowType: 'implicit',
    },
  }
)

// Re-export so existing imports keep working
export { phoneToEmail }
