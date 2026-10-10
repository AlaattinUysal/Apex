"use client";

import { Check, MessageSquareText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { markSummaryAnswered, runAnalysisNow } from "@/app/actions/cards";
import type { Summary } from "@/lib/ai-client";
import type { AnalysisResult } from "@/lib/analysis";
import { ANALYSIS } from "@/lib/config";
import { mmss, secondsToNextCycle } from "@/lib/cycle";
import { createClient } from "@/lib/supabase/client";
import { RichText } from "./rich-text";

type Feedback = { tone: "ok" | "warn" | "error"; text: string };

// Analiz sonucunu öğretmene anlaşılır bir cümleyle anlatır (düğmeye basınca "bir şey oldu mu?" belli olsun).
function describe(result: AnalysisResult | null, auto: boolean): Feedback {
  const prefix = auto ? "Otomatik analiz" : "Analiz";
  if (!result || result.status === "skipped") {
    return { tone: "warn", text: `${prefix}: başka bir analiz sürüyor ya da ders canlı değil.` };
  }
  if (result.status === "empty") return { tone: "ok", text: `${prefix}: bekleyen mesaj yok.` };
  if (result.status === "failed") {
    return { tone: "error", text: `${prefix}: yapay zekâ yanıt vermedi. Mesajlar bekliyor, tekrar denenecek.` };
  }
  return { tone: "ok", text: `${prefix}: ${result.messages} mesaj işlendi, özet güncellendi.` };
}

// "Ders işleyişi ve geri bildirim" başlığı her zaman en üstte (öğretmen kararı); diğerleri AI'ın verdiği sırada.
const isFeedback = (title: string) => /işleyiş|geri bildirim/.test(title.toLocaleLowerCase("tr"));

const RING_R = 18;
const RING_C = 2 * Math.PI * RING_R;

// Öğretmenin "Sınıfın soruları" paneli: tek bir özet (ham mesaj yok). Özet değişince Realtime ile sayfayı
// sunucudan tazeler. "Cevaplandı" özeti temizler, sonraki özet yalnızca yeni mesajlardan başlar.
export function TeacherPanel({
  lessonId,
  summary,
  summaryUpdatedAt,
  startedAt,
  isLive,
}: {
  lessonId: string;
  summary: Summary | null;
  summaryUpdatedAt: string | null;
  startedAt: string | null;
  isLive: boolean;
}) {
  const router = useRouter();
  const intervalSec = Math.round(ANALYSIS.autoIntervalMs / 1000);
  const [open, setOpen] = useState(true);
  const [answering, startAnswering] = useTransition();
  const [analysing, startAnalysis] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [remaining, setRemaining] = useState(intervalSec);
  const prevLeft = useRef(0);
  const busy = useRef(false);

  const sections = [...(summary?.sections ?? [])].sort((a, b) => Number(isFeedback(b.title)) - Number(isFeedback(a.title)));
  const firstTopic = sections.findIndex((s) => !isFeedback(s.title));

  const run = useCallback(
    (auto: boolean) => {
      if (busy.current) return;
      busy.current = true;
      startAnalysis(async () => {
        try {
          setFeedback(describe(await runAnalysisNow(lessonId), auto));
        } finally {
          busy.current = false;
        }
      });
    },
    [lessonId],
  );

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

  // Geri sayım + otomatik analiz tek sayaçta: tur sınırına gelince aynı analiz kodu çalışır (0 = kapalı).
  // Turlar ders başlangıcına çapalı (öğrenci ekranıyla aynı sayaç). Kuyruk boşsa hiçbir şey yapmaz;
  // aynı anda iki tur çalışmasını sunucu da engeller.
  useEffect(() => {
    if (!isLive || ANALYSIS.autoIntervalMs <= 0) return;
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    const id = setInterval(() => {
      const left = secondsToNextCycle(start, ANALYSIS.autoIntervalMs, Date.now());
      if (left > prevLeft.current && prevLeft.current > 0) run(true);
      prevLeft.current = left;
      setRemaining(left);
    }, 1000);
    return () => clearInterval(id);
  }, [isLive, startedAt, run]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-12 items-center gap-2 self-start rounded-full border-[1.5px] border-ink bg-surface px-5 text-[15px] leading-5 font-bold text-ink"
      >
        <MessageSquareText size={18} strokeWidth={2} aria-hidden="true" />
        Sınıfın soruları
      </button>
    );
  }

  const timed = isLive && ANALYSIS.autoIntervalMs > 0;
  const fraction = timed ? Math.min(1, remaining / intervalSec) : 0;

  return (
    <aside
      aria-label="Sınıfın soruları"
      className="flex min-h-0 min-w-0 flex-[1_1_440px] flex-col overflow-hidden rounded-[28px] border-[1.5px] border-ink bg-surface shadow-[8px_8px_0_var(--color-charcoal)]"
    >
      <header className="flex items-center gap-3 border-b-[1.5px] border-ink py-4 pr-3.5 pl-[22px]">
        <h2 className="m-0 font-display text-[26px] leading-[30px] font-semibold tracking-[-0.015em] text-ink">
          Sınıfın soruları
        </h2>
        <span className="flex-1" />
        {summaryUpdatedAt && sections.length > 0 && (
          <span className="inline-flex items-center gap-2 text-[13px] leading-[18px] font-semibold text-ink">
            <span className="size-[9px] rounded-full bg-badge" />
            <span suppressHydrationWarning>
              Güncellendi{" "}
              <span className="font-mono">
                {new Date(summaryUpdatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </span>
          </span>
        )}
        <button
          type="button"
          aria-label="Paneli kapat"
          onClick={() => setOpen(false)}
          className="inline-flex size-11 items-center justify-center rounded-full border-[1.5px] border-ink bg-surface text-ink"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto bg-sunken p-[18px]">
        {feedback && (
          <p
            role="status"
            className={`m-0 text-[13px] leading-[18px] font-semibold ${feedback.tone === "error" ? "text-badge" : "text-ink-muted"}`}
          >
            {feedback.text}
          </p>
        )}

        {sections.length ? (
          sections.map((section, index) => {
            const feedbackSection = isFeedback(section.title);
            return (
              <section
                key={section.title}
                className={`flex flex-col gap-3 rounded-[22px] border-[1.5px] px-[22px] py-5 ${
                  feedbackSection ? "border-dashed border-ink bg-paper" : "border-ink bg-surface"
                } ${index === firstTopic ? "shadow-brand-5" : ""}`}
              >
                <h3
                  className={`m-0 flex items-center gap-2.5 text-[17px] leading-[22px] font-bold ${feedbackSection ? "text-ink" : "text-brand"}`}
                >
                  <span className={`size-2.5 ${feedbackSection ? "rounded-full bg-charcoal" : "rounded-[3px] bg-brand"}`} />
                  {section.title}
                </h3>
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-[15px] leading-[23px] font-medium text-ink">
                      <span className="mt-[9px] size-1.5 flex-none rounded-full bg-ink" />
                      <span>
                        <RichText text={item.text} />
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        ) : (
          <section className="rounded-[22px] border-[1.5px] border-dashed border-ink bg-paper px-[22px] py-5">
            <p className="m-0 text-[15px] leading-[23px] font-medium text-ink-muted">
              Henüz soru yok. Öğrenci mesajları geldikçe burada başlıklara ayrılmış tek bir özet olarak görünür.
            </p>
          </section>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t-[1.5px] border-ink bg-surface px-[18px] py-3.5">
        <button
          type="button"
          disabled={!isLive || analysing}
          onClick={() => run(false)}
          title="Şimdi güncelle"
          className="flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left hover:opacity-80 disabled:cursor-default"
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            role="img"
            aria-label={timed ? `Sonraki güncellemeye ${Math.floor(remaining / 60)} dakika ${remaining % 60} saniye var` : "Otomatik güncelleme kapalı"}
          >
            <circle cx="22" cy="22" r={RING_R} fill="none" stroke="var(--color-sunken)" strokeWidth="5" />
            <circle
              cx="22"
              cy="22"
              r={RING_R}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${(RING_C * fraction).toFixed(1)} ${RING_C.toFixed(1)}`}
              transform="rotate(-90 22 22)"
            />
          </svg>
          <span className="flex flex-col">
            <span className="text-xs leading-4 font-medium text-ink-muted">
              {analysing ? "Güncelleniyor…" : "Sonraki güncelleme"}
            </span>
            <span className="font-mono text-lg leading-[22px] font-semibold text-ink">{timed ? mmss(remaining) : "—"}</span>
          </span>
        </button>

        <button
          type="button"
          disabled={answering || sections.length === 0}
          onClick={() =>
            startAnswering(async () => {
              await markSummaryAnswered(lessonId);
              setFeedback(null);
            })
          }
          className="ml-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-brand bg-brand px-6 text-[15px] leading-5 font-bold text-white shadow-[4px_4px_0_var(--color-charcoal)] disabled:opacity-50"
        >
          <Check size={18} strokeWidth={2.5} aria-hidden="true" />
          Cevaplandı
        </button>
      </footer>
    </aside>
  );
}
