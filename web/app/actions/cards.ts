"use server";

import { refresh } from "next/cache";
import { runAnalysis, type AnalysisResult } from "@/lib/analysis";
import { createClient } from "@/lib/supabase/server";

// Kart eylemleri RLS ile korunur: öğretmen yalnızca kendi dersinin kartında, yalnızca
// is_read / has_update / status alanlarını değiştirebilir.
export async function markCardRead(lessonId: string, cardId: string) {
  const supabase = await createClient();
  await supabase.from("topic_cards").update({ is_read: true, has_update: false }).eq("id", cardId);
  refresh();
}

export async function answerCard(lessonId: string, cardId: string) {
  const supabase = await createClient();
  await supabase
    .from("topic_cards")
    .update({ status: "answered", is_read: true, has_update: false })
    .eq("id", cardId);
  refresh();
}

// Demo düğmesi: n8n'e bağımlı olmadan aynı analiz kodunu çalıştırır. Sonucu arayüzde göstermek için döner.
export async function runAnalysisNow(lessonId: string): Promise<AnalysisResult | null> {
  const supabase = await createClient();
  // RLS: ders bu öğretmene ait değilse satır dönmez ve analiz çalışmaz.
  const { data: lesson } = await supabase.from("lessons").select("id").eq("id", lessonId).maybeSingle();
  const result = lesson ? await runAnalysis(lesson.id) : null;
  refresh();
  return result;
}
