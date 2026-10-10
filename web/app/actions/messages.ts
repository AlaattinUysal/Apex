"use server";

import { refresh } from "next/cache";
import { RATE_LIMITS, TIMEOUT_RULES } from "@/lib/config";
import { getParticipantId } from "@/lib/participant";
import { checkAndRecord } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export type ChatState = { error?: string; sentAt?: number; banUntil?: number } | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Öğrenci mesajı: doğrula -> rate limit -> 'queued' olarak kaydet. AI'a burada GİTMEZ;
// 5 dakikalık analiz (tick) kuyruğu toplu işler.
export async function sendMessage(_: ChatState, formData: FormData): Promise<ChatState> {
  const lessonId = String(formData.get("lesson_id") ?? "");
  const text = String(formData.get("text") ?? "").trim();

  if (!UUID.test(lessonId)) return { error: "Geçersiz ders." };
  if (!text) return { error: "Mesaj boş olamaz." };
  if (text.length > RATE_LIMITS.maxChars) {
    return { error: `Mesaj en fazla ${RATE_LIMITS.maxChars} karakter olabilir.` };
  }

  // Kimlik: çerezdeki anonim token. İstemciden gelen hiçbir kimlik bilgisine güvenilmez.
  const participantId = await getParticipantId(lessonId);
  if (!participantId) return { error: "Oturumun sona ermiş. Kodla yeniden katıl." };

  const admin = createAdminClient();
  const { data: lesson } = await admin
    .from("lessons")
    .select("status, chatbot_enabled")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson || lesson.status !== "live") return { error: "Ders şu an canlı değil." };
  if (!lesson.chatbot_enabled) return { error: "Öğretmen şu an yeni soru almıyor." };

  // Abuse veya spam nedeniyle 5 dakika kısıtlama kontrolü
  const banCutoff = new Date(Date.now() - TIMEOUT_RULES.abuseSpamBanMs).toISOString();
  const { data: recentBan } = await admin
    .from("student_messages")
    .select("processed_at")
    .eq("lesson_id", lessonId)
    .eq("participant_id", participantId)
    .eq("status", "rejected")
    .in("reject_label", ["abuse", "spam"])
    .gt("processed_at", banCutoff)
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentBan?.processed_at) {
    const banUntil = new Date(recentBan.processed_at).getTime() + TIMEOUT_RULES.abuseSpamBanMs;
    const remainingMs = Math.max(0, banUntil - Date.now());
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
    return {
      error: `Uygunsuz içerik veya spam nedeniyle 5 dakika mesaj gönderemezsin. (Kalan süre: ~${remainingMinutes} dk)`,
      banUntil,
    };
  }

  const limited = checkAndRecord(`${lessonId}:${participantId}`, text);
  if (limited) return { error: limited };

  const { error } = await admin
    .from("student_messages")
    .insert({ lesson_id: lessonId, participant_id: participantId, original_text: text });
  if (error) return { error: "Mesaj gönderilemedi, tekrar dene." };

  refresh(); // istemci ekranını tazeler (mesaj listesi güncellenir); sayfa önbelleğini geçersiz kılmaz
  return { sentAt: Date.now() };
}
