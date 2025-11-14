// pages/_app.tsx
import "../../styles/globals.css";
import type { AppProps } from "next/app";
import React from "react";

import { SupabaseProvider } from "@/lib/supabase";

// Prompt UI providers / query client (purely UI & caching)
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SupabaseProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Component {...pageProps} />
        </TooltipProvider>
      </QueryClientProvider>
    </SupabaseProvider>
  );
}
