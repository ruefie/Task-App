// src/contexts/SupabaseContext.js
// import React, { createContext, useContext } from "react";
// import { supabase } from "../lib/supabaseClient";

// const SupabaseContext = createContext(null);

// export function SupabaseProvider({ children }) {
//   return (
//     <SupabaseContext.Provider value={supabase}>
//       {children}
//     </SupabaseContext.Provider>
//   );
// }

// export function useSupabase() {
//   const client = useContext(SupabaseContext);
//   if (!client) throw new Error("useSupabase must be inside SupabaseProvider");
//   return client;
// }




import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const SupabaseCtx = createContext({
  supabase: null,
  isConfigured: false,
  session: null,
});

export function SupabaseProvider({ children }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data }) => setSession(data?.session || null)).catch(() => {});

    // Subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  const value = useMemo(
    () => ({ supabase, isConfigured: isSupabaseConfigured, session }),
    [session]
  );

  // When not configured, render a tiny banner (so app won't crash)
  if (!isSupabaseConfigured) {
    return (
      <div style={{
        margin: 16, padding: 12, border: "1px solid #e5e7eb",
        borderLeft: "4px solid #c53030", borderRadius: 8, background: "#fff",
        fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif"
      }}>
        <strong style={{ color: "#c53030" }}>Supabase not configured</strong>
        <div style={{ color: "#374151", marginTop: 6 }}>
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your GitHub Actions
          repository secrets and redeploy.
        </div>
      </div>
    );
  }

  return <SupabaseCtx.Provider value={value}>{children}</SupabaseCtx.Provider>;
}

export const useSupabase = () => useContext(SupabaseCtx);
