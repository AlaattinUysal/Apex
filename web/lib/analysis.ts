import "server-only";
import { summarizeBatch } from "@/lib/ai-client";
import { ANALYSIS } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export type AnalysisResult = {
  status: "skipped" | "empty" | "completed" | "failed";
  messages: number; // bu turda işlenen (kuyruktaki) mesaj sayısı
  error?: string;
};

// Analiz turu. Hem panel düğmesi/zamanlayıcı hem de dışarıdan tetikleyen tick çağırır.
// Kuyruktaki mesajları AI'a verir; AI her mesajı onaylar/reddeder ve tek bir okunabilir özet yazar.
// Özet, öğretmen son "Cevaplandı"ya bastığından beri onaylanan TÜM mesajlardan baştan üretilir
// (AI stateless, önceki özetle birleştirme yok). AI hata verirse mesajlar 'queued' kalır.
export async function runAnalysis(lessonId: string): Promise<AnalysisResult> {
  const admin = createAdminClient();
  const skipped: AnalysisResult = { status: "skipped", messages: 0 };

  const { data: lesson } = await admin
    .from("lessons")
    .select("id, title, topic, status, summary_cleared_at")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson || lesson.status !== "live") return skipped;

  // Aynı derste aynı anda iki tur çalışmasın (panel zamanlayıcısı + elle tetikleme çakışması).
  const staleBefore = new Date(Date.now() - ANALYSIS.staleRunMs).toISOString();
  const { data: running } = await admin
    .from("analysis_runs")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("status", "running")
    .gt("started_at", staleBefore)
    .limit(1);
  if (running?.length) return skipped;

  const { data: queued } = await admin
    .from("student_messages")
    .select("id, original_text")
    .eq("lesson_id", lessonId)
    .eq("status", "queued")
    .order("created_at")
    .limit(ANALYSIS.maxBatch);
  if (!queued?.length) return { status: "empty", messages: 0 };

  const { data: run } = await admin
    .from("analysis_runs")
    .insert({ lesson_id: lessonId, message_count: queued.length })
    .select("id")
    .single();

  try {
    // Özet bağlamı: son "Cevaplandı"dan beri onaylanmış mesajlar.
    let approvedQuery = admin
      .from("student_messages")
      .select("id, original_text")
      .eq("lesson_id", lessonId)
      .eq("status", "delivered")
      .order("created_at")
      .limit(ANALYSIS.maxApproved);
    if (lesson.summary_cleared_at) approvedQuery = approvedQuery.gt("processed_at", lesson.summary_cleared_at);
    const { data: approved } = await approvedQuery;

    // AI'a yalnızca metin ve id'ler gider; oturum kimliği (participant_id) gitmez.
    const result = await summarizeBatch({
      lesson: { subject: lesson.title, topic: lesson.topic },
      approved: (approved ?? []).map((m) => ({ message_id: m.id, text: m.original_text })),
      new_messages: queued.map((m) => ({ message_id: m.id, text: m.original_text })),
    });

    const now = new Date().toISOString();
    for (const d of result.decisions) {
      await admin
        .from("student_messages")
        .update(
          d.decision === "deliver"
            ? { status: "delivered", processed_at: now }
            : { status: "rejected", reject_label: d.reject_reason, processed_at: now },
        )
        .eq("id", d.message_id);
    }

    // Özeti kaydet. Analiz sürerken öğretmen "Cevaplandı"ya bastıysa (summary_cleared_at değiştiyse)
    // eski içeriği geri yazma.
    const hasContent = result.summary.sections.length > 0;
    let save = admin
      .from("lessons")
      .update({ summary: hasContent ? result.summary : null, summary_updated_at: hasContent ? now : null })
      .eq("id", lessonId);
    save = lesson.summary_cleared_at
      ? save.eq("summary_cleared_at", lesson.summary_cleared_at)
      : save.is("summary_cleared_at", null);
    await save;

    await admin
      .from("analysis_runs")
      .update({ status: "completed", completed_at: now, card_count: result.summary.sections.length })
      .eq("id", run?.id);

    return { status: "completed", messages: queued.length };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await admin
      .from("analysis_runs")
      .update({ status: "failed", completed_at: new Date().toISOString(), error })
      .eq("id", run?.id);
    return { status: "failed", messages: queued.length, error };
  }
}
