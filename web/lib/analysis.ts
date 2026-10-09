import "server-only";
import { analyzeBatch } from "@/lib/ai-client";
import { ANALYSIS } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export type AnalysisResult = {
  status: "skipped" | "empty" | "completed" | "failed";
  messages: number;
  cards: number;
  error?: string;
};

// 5 dakikalık analiz (FAZ1.md §4.3). Hem n8n zamanlayıcısı hem "Analizi şimdi çalıştır" düğmesi bunu çağırır.
// Kuyruktaki mesajları AI'a toplu gönderir, cevaba göre mesajları ve kartları günceller.
// AI hata verirse mesajlar 'queued' kalır, sonraki turda tekrar denenir.
export async function runAnalysis(lessonId: string): Promise<AnalysisResult> {
  const admin = createAdminClient();
  const skipped: AnalysisResult = { status: "skipped", messages: 0, cards: 0 };

  const { data: lesson } = await admin
    .from("lessons")
    .select("id, title, topic, status")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson || lesson.status !== "live") return skipped;

  // Aynı derste aynı anda iki tur çalışmasın (n8n + elle tetikleme çakışması).
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
    .select("id, participant_id, original_text")
    .eq("lesson_id", lessonId)
    .eq("status", "queued")
    .order("created_at")
    .limit(ANALYSIS.maxBatch);
  if (!queued?.length) return { status: "empty", messages: 0, cards: 0 };

  const { data: run } = await admin
    .from("analysis_runs")
    .insert({ lesson_id: lessonId, message_count: queued.length })
    .select("id")
    .single();

  try {
    const { data: openCards } = await admin
      .from("topic_cards")
      .select("id, topic_label, summary_text")
      .eq("lesson_id", lessonId)
      .eq("status", "open");
    const existing = openCards ?? [];
    const existingIds = new Set<string>(existing.map((c) => c.id));

    // AI'a yalnızca metin ve id'ler gider; oturum kimliği (participant_id) gitmez.
    const result = await analyzeBatch({
      lesson: { subject: lesson.title, topic: lesson.topic },
      open_cards: existing.map((c) => ({ card_id: c.id, topic_label: c.topic_label, summary_text: c.summary_text })),
      messages: queued.map((m) => ({ message_id: m.id, text: m.original_text })),
    });

    // Yeni kartlar: AI'ın geçici referansı ("new:1") -> gerçek kart id'si.
    const refToId = new Map<string, string>();
    for (const card of result.new_cards) {
      const { data } = await admin
        .from("topic_cards")
        .insert({
          lesson_id: lessonId,
          topic_label: card.topic_label,
          summary_text: card.summary_text,
          kind: card.kind,
        })
        .select("id")
        .single();
      if (data) refToId.set(card.ref, data.id);
    }

    const now = new Date().toISOString();
    const touched = new Set<string>();

    for (const decision of result.messages) {
      if (decision.decision === "reject") {
        await admin
          .from("student_messages")
          .update({ status: "rejected", reject_label: decision.reject_reason, processed_at: now })
          .eq("id", decision.message_id);
        continue;
      }

      const ref = decision.card_ref ?? "";
      const cardId = refToId.get(ref) ?? (existingIds.has(ref) ? ref : null);
      if (!cardId) continue; // kart oluşturulamadıysa mesaj 'queued' kalır, sonraki tur dener
      await admin
        .from("student_messages")
        .update({ status: "delivered", card_id: cardId, processed_at: now })
        .eq("id", decision.message_id);
      touched.add(cardId);
    }

    // AI mevcut kartın sorusunu yeniden yazmayı önerdiyse güncelle.
    for (const update of result.updated_cards) {
      if (!existingIds.has(update.card_id)) continue;
      await admin.from("topic_cards").update({ summary_text: update.summary_text }).eq("id", update.card_id);
    }

    // Sayaçları yeniden hesapla: benzersiz oturum sayısı (aynı öğrenci 10 kez sorsa 1).
    for (const cardId of touched) {
      const { data: delivered } = await admin
        .from("student_messages")
        .select("participant_id")
        .eq("card_id", cardId)
        .eq("status", "delivered");
      const rows = delivered ?? [];
      await admin
        .from("topic_cards")
        .update({
          message_count: rows.length,
          distinct_session_count: new Set(rows.map((r) => r.participant_id)).size,
          updated_at: now,
          // Mevcut kart yeni mesaj aldıysa öğretmende tekrar "güncellendi" görünür.
          ...(existingIds.has(cardId) ? { has_update: true } : {}),
        })
        .eq("id", cardId);
    }

    // Hiçbir mesaja bağlanmayan yeni kartları temizle (boş kart öğretmene gösterilmesin).
    for (const id of refToId.values()) {
      if (!touched.has(id)) await admin.from("topic_cards").delete().eq("id", id);
    }

    await admin
      .from("analysis_runs")
      .update({ status: "completed", completed_at: now, card_count: touched.size })
      .eq("id", run?.id);

    return { status: "completed", messages: queued.length, cards: touched.size };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await admin
      .from("analysis_runs")
      .update({ status: "failed", completed_at: new Date().toISOString(), error })
      .eq("id", run?.id);
    return { status: "failed", messages: queued.length, cards: 0, error };
  }
}
