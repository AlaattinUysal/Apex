"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { markSummaryAnswered, runAnalysisNow } from "@/app/actions/cards";
import { setChatbotEnabled } from "@/app/actions/lessons";
import type { Summary } from "@/lib/ai-client";
import type { AnalysisResult } from "@/lib/analysis";
import { ANALYSIS } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

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
  return { tone: "ok", time, text: `${prefix}: ${result.messages} mesaj işlendi, özet güncellendi.` };
}

const isFeedback = (title: string) => /işleyiş|geri bildirim/.test(title.toLocaleLowerCase("tr"));

function intervalLabel(ms: number) {
  const s = Math.round(ms / 1000);
  return s < 120 ? `${s} saniyede` : `${Math.round(s / 60)} dakikada`;
}

// Öğretmenin "Gelen Sorular" paneli: tek bir özet kartı (ham mesaj yok). Özet değişince Realtime ile
// sayfayı sunucudan tazeler. "Cevaplandı" özeti temizler, sonraki özet yalnızca yeni mesajlardan başlar.
export function TeacherPanel({
  lessonId,
  summary,
  summaryUpdatedAt,
  chatbotEnabled,
  isLive,
}: {
  lessonId: string;
  summary: Summary | null;
  summaryUpdatedAt: string | null;
  chatbotEnabled: boolean;
  isLive: boolean;
}) {
  const router = useRouter();
  const [answering, startAnswering] = useTransition();
  const [analysing, startAnalysis] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // "Ders işleyişi ve geri bildirim" başlığı her zaman en üstte; diğerleri AI'ın verdiği sırada (sıralama kararlı).
  const sections = [...(summary?.sections ?? [])].sort((a, b) => Number(isFeedback(b.title)) - Number(isFeedback(a.title)));

  const runAnalysisAndReport = (auto: boolean) =>
    startAnalysis(async () => {
      const result = await runAnalysisNow(lessonId);
      setFeedback(describe(result, auto));
    });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`lesson:${lessonId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lessons", filter: `id=eq.${lessonId}` },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, router]);

  // Panel açıkken belirli aralıkla aynı analiz kodunu çalıştırır (0 = kapalı). Kuyruk boşsa hiçbir şey yapmaz;
  // aynı anda iki tur çalışmasını sunucu engeller.
  useEffect(() => {
    if (!isLive || ANALYSIS.autoIntervalMs <= 0) return;
    const id = setInterval(() => runAnalysisAndReport(true), ANALYSIS.autoIntervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, lessonId]);

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Gelen Sorular</h2>
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
                : ANALYSIS.autoIntervalMs > 0
                  ? `Her ${intervalLabel(ANALYSIS.autoIntervalMs)} otomatik de çalışır.`
                  : "Otomatik analiz kapalı: yalnızca bu düğmeyle çalışır."}
          </p>
        </div>
      )}

      {sections.length ? (
        <article className="flex flex-col gap-4 rounded-xl border border-border p-4">
          <header className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold">Sınıfın soruları</h3>
            {summaryUpdatedAt && (
              <span className="text-xs text-muted" suppressHydrationWarning>
                Güncellendi{" "}
                {new Date(summaryUpdatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </header>

          {sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-1.5">
              <h4 className="text-sm font-semibold text-accent">{section.title}</h4>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
                {section.items.map((item, i) => (
                  <li key={i}>{item.text}</li>
                ))}
              </ul>
            </section>
          ))}

          <button
            className="btn w-full"
            disabled={answering}
            onClick={() =>
              startAnswering(async () => {
                await markSummaryAnswered(lessonId);
                setFeedback(null);
              })
            }
          >
            {answering ? "Temizleniyor…" : "Cevaplandı"}
          </button>
        </article>
      ) : (
        <p className="text-sm text-muted">
          Henüz soru yok. Öğrenci mesajları analiz çalışınca burada başlıklara ayrılmış bir özet olarak görünür.
        </p>
      )}
    </aside>
  );
}
