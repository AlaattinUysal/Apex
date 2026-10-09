import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const PARTICIPANT_COOKIE = "apex_participant";
export const PARTICIPANT_TTL_SECONDS = 6 * 60 * 60; // DB'deki expires_at ile aynı (6 saat)

export function newParticipantToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Çerezdeki token bu derse ait, süresi dolmamış bir katılımcıya karşılık geliyorsa id'sini döner.
export async function getParticipantId(lessonId: string): Promise<string | null> {
  const token = (await cookies()).get(PARTICIPANT_COOKIE)?.value;
  if (!token) return null;

  await connection(); // aşağıda geçerli zaman kullanılıyor: istek zamanında çalışmalı

  const { data } = await createAdminClient()
    .from("lesson_participants")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("token_hash", hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return data?.id ?? null;
}
