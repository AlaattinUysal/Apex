"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { answerCard, markCardRead, runAnalysisNow } from "@/app/actions/cards";
import { setChatbotEnabled } from "@/app/actions/lessons";
import type { AnalysisResult } from "@/lib/analysis";
import { ANALYSIS } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

export type PanelCard = {
  id: string;
  topic_label: string;
  summary_text: string;
  kind: string;
  distinct_session_count: number;
  is_read: boolean;
  has_update: boolean;
};

type Feedback = { tone: "ok" | "warn" | "error"; text: string; time: string };

// Analiz sonucunu öğretmene anlaşılır bir cümleyle anlatır (düğmeye basınca "bir şey oldu mu?" belli olsun).
function describe(result: AnalysisResult | null, auto: boolean): Feedback {
  const time = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const prefix = auto ? "Otomatik analiz" : "Analiz";
  if (!result || result.status === "skipped") {
    return { tone: "warn", time, text: `${prefix}: başka bir analiz sürüyor ya da ders canlı değil.` };
  }
  if (result.status === "empty") return { tone: "ok", time, text: `${prefix}: bekleyen mesaj yok.` };
  if (result.status === "failed") {
    return { tone: "error", time, text: `${prefix}: yapay zekâ yanıt vermedi. Mesajlar bekliyor, tekrar denenecek.` };
  }
  return { tone: "ok", time, text: `${prefix}: ${result.messages} mesaj işlendi, ${result.cards} kart güncellendi.` };
}

function intervalLabel(ms: number) {
  const s = Math.round(ms / 1000);
  return s < 120 ? `${s} saniyede` : `${Math.round(s / 60)} dakikada`;
}

// Öğretmenin "Gelen Sorular" paneli: yalnızca AI'ın ürettiği konu kartları (ham mesaj yok).
// Kartlar değişince (yeni kart / güncelleme) Realtime ile sayfayı sunucudan tazeler.
export function TeacherPanel({
  lessonId,
  cards,
  chatbotEnabled,
  isLive,
}: {
  lessonId: string;
  cards: PanelCard[];
  chatbotEnabled: boolean;
  isLive: boolean;
}) {
  const router = useRouter();
  const unread = cards.filter((c) => !c.is_read || c.has_update).length;
  const [, startTransition] = useTransition();
  const [analysing, startAnalysis] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const runAnalysisAndReport = (auto: boolean) =>
    startAnalysis(async () => {
      const result = await runAnalysisNow(lessonId);
      setFeedback(describe(result, auto));
    });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`cards:${lessonId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topic_cards", filter: `lesson_id=eq.${lessonId}` },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, router]);

  // n8n zamanlayıcısına ek yedek: panel açıkken her 5 dakikada aynı analiz kodunu çalıştırır.
  // Kuyruk boşsa hiçbir şey yapmaz; aynı anda iki tur çalışmasını sunucu engeller.
  useEffect(() => {
    if (!isLive || ANALYSIS.autoIntervalMs <= 0) return;
    const id = setInterval(() => runAnalysisAndReport(true), ANALYSIS.autoIntervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, lessonId]);

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          Gelen Sorular
          {unread > 0 && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{unread}</span>
          )}
        </h2>
        <form action={setChatbotEnabled.bind(null, lessonId, !chatbotEnabled)}>
          <button className="text-xs text-muted underline hover:text-foreground">
            Soru alımı: {chatbotEnabled ? "açık" : "kapalı"}
          </button>
        </form>
      </div>

      {isLive && (
        <div className="flex flex-col gap-1">
          <button className="btn-ghost w-full" disabled={analysing} onClick={() => runAnalysisAndReport(false)}>
            {analysing ? "Analiz çalışıyor…" : "Analizi şimdi çalıştır"}
          </button>
          <p
            role="status"
            className={`text-center text-xs ${
              feedback?.tone === "error"
                ? "text-red-600 dark:text-red-400"
                : feedback?.tone === "warn"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted"
            }`}
          >
            {analysing
              ? "Mesajlar yapay zekâya gönderiliyor, birkaç saniye sürer…"
              : feedback
                ? `${feedback.text} (${feedback.time})`
                : (ANALYSIS.autoIntervalMs > 0
                  ? `Her ${intervalLabel(ANALYSIS.autoIntervalMs)} otomatik de çalışır.`
                  : "Otomatik analiz kapalı: yalnızca bu düğmeyle çalışır.")}
          </p>
        </div>
      )}

      {cards.length ? (
        <ul className="flex flex-col gap-3">
          {cards.map((card) => {
            const fresh = !card.is_read || card.has_update;
            return (
              <li
                key={card.id}
                className={`rounded-xl border border-border p-3 ${fresh ? "cursor-pointer hover:border-accent" : ""}`}
                onClick={() => {
                  if (fresh) startTransition(() => void markCardRead(lessonId, card.id));
                }}
              >
                <div className="flex items-start gap-2">
                  {fresh && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-red-600" aria-label="Yeni" />}
                  <p className="text-sm">{card.summary_text}</p>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {card.topic_label} · {card.distinct_session_count} öğrenci
                  {card.has_update && " · güncellendi"}
                  {card.kind === "feedback" && " · geri bildirim"}
                </p>
                <div className="mt-2 flex gap-3 text-xs">
                  <form action={answerCard.bind(null, lessonId, card.id)} onClick={(e) => e.stopPropagation()}>
                    <button className="text-muted underline hover:text-foreground">Cevaplandı</button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">Henüz soru yok. Öğrenci mesajları her 5 dakikada konu kartlarına dönüşür.</p>
      )}
    </aside>
  );
}
