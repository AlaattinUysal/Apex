import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service role: RLS'i atlar. Yalnızca sunucuda (Server Action / Route Handler) kullanılır.
// Öğrenci işlemleri ve tick bu istemciyle yapılır; tarayıcıya asla gitmez.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
