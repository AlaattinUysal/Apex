"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { answerCard, markCardRead, runAnalysisNow } from "@/app/actions/cards";
import { setChatbotEnabled } from "@/app/actions/lessons";
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
    if (!isLive) return;
    const id = setInterval(() => {
      startTransition(() => {
        void runAnalysisNow(lessonId);
      });
    }, ANALYSIS.autoIntervalMs);
    return () => clearInterval(id);
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
          <form action={runAnalysisNow.bind(null, lessonId)}>
            <button className="btn-ghost w-full">Analizi şimdi çalıştır</button>
          </form>
          <p className="text-center text-xs text-muted">Her 5 dakikada otomatik de çalışır.</p>
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
