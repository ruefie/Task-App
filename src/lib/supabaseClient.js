// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Read Vite envs (only VITE_* are exposed at build time)
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

// Flag so other code can choose to degrade gracefully if needed
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Only create the client when both values exist
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "supabase.auth.token",
        storage: window.localStorage,
      },
    })
  : null;

// Helpful console hint in case something’s missing in production
if (!isSupabaseConfigured) {
  const where = import.meta.env.PROD ? " (GitHub Pages build)" : " (local dev)";
  // eslint-disable-next-line no-console
  console.warn(
    `Supabase is not configured${where}. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.`
  );
}

// Optional helper if you want hard failures where required:
// export function requireSupabase() {
//   if (!supabase) throw new Error("Supabase client not initialized. Check env vars.");
//   return supabase;
// }
