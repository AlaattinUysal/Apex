import "server-only";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Doğrulanmış öğretmen (Supabase Auth sunucusuna sorar). Oturum yoksa null.
export async function getTeacher() {
  await connection(); // oturum doğrulaması geçerli zamanı kullanır: istek zamanında çalışmalı
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
