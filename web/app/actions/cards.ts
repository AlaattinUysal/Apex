"use server";

import { refresh } from "next/cache";
import { runAnalysis, type AnalysisResult } from "@/lib/analysis";
import { createClient } from "@/lib/supabase/server";

// Öğretmen "Cevaplandı"ya basınca özet temizlenir; bundan sonra yalnızca yeni onaylanan mesajlardan
// yeni bir özet başlar (lessons.summary_cleared_at). RLS: yalnızca dersin sahibi güncelleyebilir.
export async function markSummaryAnswered(lessonId: string) {
  const supabase = await createClient();
  await supabase
    .from("lessons")
    .update({ summary: null, summary_updated_at: null, summary_cleared_at: new Date().toISOString() })
    .eq("id", lessonId);
  refresh();
}

// Demo düğmesi / otomatik tur: aynı analiz kodunu çalıştırır. Sonucu arayüzde göstermek için döner.
export async function runAnalysisNow(lessonId: string): Promise<AnalysisResult | null> {
  const supabase = await createClient();
  // RLS: ders bu öğretmene ait değilse satır dönmez ve analiz çalışmaz.
  const { data: lesson } = await supabase.from("lessons").select("id").eq("id", lessonId).maybeSingle();
  const result = lesson ? await runAnalysis(lesson.id) : null;
  refresh();
  return result;
}
