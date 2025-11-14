/* supabase "use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Create a React context for Supabase
const SupabaseContext = createContext<SupabaseClient | null>(null);

interface Props {
  children: React.ReactNode;
}

export function SupabaseProvider({ children }: Props) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnon) {
      // Return a dummy object to avoid errors if supabase isn't configured yet
      return createClient("https://example.com", "public-anon-key");
    }
    return createClient(supabaseUrl, supabaseAnon);
  }, [supabaseUrl, supabaseAnon]);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => useContext(SupabaseContext);
*/