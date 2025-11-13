/* app wrapper */
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SupabaseProvider } from "../src/lib/supabase";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SupabaseProvider>
      <Component {...pageProps} />
    </SupabaseProvider>
  );
}
