import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// I modsætning til barnets app (skaerm-app) er denne portal ikke valgfrit
// koblet til Supabase — den ER en klient til backend'en, og giver ingen
// mening uden. Er nøglerne ikke sat, viser App.tsx en tydelig fejlskærm
// i stedet for at crashe.
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null
export const supabaseConfigured = supabase !== null
