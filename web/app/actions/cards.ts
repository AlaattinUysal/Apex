"use server";

import { revalidatePath } from "next/cache";
import { runAnalysis } from "@/lib/analysis";
import { createClient } from "@/lib/supabase/server";

// Kart eylemleri RLS ile korunur: öğretmen yalnızca kendi dersinin kartında, yalnızca
// is_read / has_update / status alanlarını değiştirebilir.
export async function markCardRead(lessonId: string, cardId: string) {
  const supabase = await createClient();
  await supabase.from("topic_cards").update({ is_read: true, has_update: false }).eq("id", cardId);
  revalidatePath(`/live/${lessonId}`);
}

export async function answerCard(lessonId: string, cardId: string) {
  const supabase = await createClient();
  await supabase
    .from("topic_cards")
    .update({ status: "answered", is_read: true, has_update: false })
    .eq("id", cardId);
  revalidatePath(`/live/${lessonId}`);
}

// Demo düğmesi: n8n'e bağımlı olmadan aynı analiz kodunu çalıştırır.
export async function runAnalysisNow(lessonId: string) {
  const supabase = await createClient();
  // RLS: ders bu öğretmene ait değilse satır dönmez ve analiz çalışmaz.
  const { data: lesson } = await supabase.from("lessons").select("id").eq("id", lessonId).maybeSingle();
  if (lesson) await runAnalysis(lesson.id);
  revalidatePath(`/live/${lessonId}`);
}
