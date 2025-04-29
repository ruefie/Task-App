// src/contexts/SupabaseContext.js
import React, { createContext, useContext } from "react";
import { supabase } from "../lib/supabaseClient";

const SupabaseContext = createContext(null);

export function SupabaseProvider({ children }) {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const client = useContext(SupabaseContext);
  if (!client) throw new Error("useSupabase must be inside SupabaseProvider");
  return client;
}
