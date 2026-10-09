import { createBrowserClient } from "@supabase/ssr";

// Tarayıcı istemcisi (publishable key): yalnızca Realtime dinlemek için. Veriye RLS ile erişir.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
