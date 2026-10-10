"use client";

import { Check, Clock, Lock, Send } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { sendMessage } from "@/app/actions/messages";
import { ANALYSIS, RATE_LIMITS, STUDENT_REPLY } from "@/lib/config";
import { intervalLabel, mmss, secondsToNextCycle } from "@/lib/cycle";

type Message = { id: string; text: string };

const useTick = (active: boolean) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active]);
  return now;
};

// Öğrenci tarafı "Sorularım" paneli: kendi mesajları + sabit yanıt. Durum/ret/önizleme gösterilmez.
export function StudentChat({
  lessonId,
  messages,
  blockedReason,
  banUntil = null,
  startedAt,
  isLive,
}: {
  lessonId: string;
  messages: Message[];
  blockedReason: string | null; // null ise yazılabilir
  banUntil?: number | null;
  startedAt: string | null;
  isLive: boolean;
}) {
  const [state, action, pending] = useActionState(sendMessage, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const effectiveBanUntil = state?.banUntil ?? banUntil ?? null;
  const timed = isLive && !!startedAt && ANALYSIS.autoIntervalMs > 0;
  const now = useTick(!!effectiveBanUntil || timed);

  const remainingSec = effectiveBanUntil ? Math.max(0, Math.ceil((effectiveBanUntil - now) / 1000)) : 0;
  const isBanned = remainingSec > 0;
  const banTimeText = `${remainingSec >= 60 ? `${Math.floor(remainingSec / 60)} dk ` : ""}${remainingSec % 60} sn`;
  const currentBlocked = blockedReason ?? (isBanned ? `Uygunsuz içerik / spam nedeniyle kısıtlandın (${banTimeText})` : null);

  // Başarılı gönderimden sonra kutuyu temizle.
  useEffect(() => {
    if (state?.sentAt) formRef.current?.reset();
  }, [state]);

  // Yeni mesaj gelince (ve ilk açılışta) en alta kaydır: sohbet yukarıdan aşağı akar.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages.length]);

  return (
    <aside
      aria-label="Sorularım"
      className="flex min-h-0 min-w-0 flex-[1_1_400px] flex-col overflow-hidden rounded-[28px] border-[1.5px] border-ink bg-surface shadow-[8px_8px_0_var(--color-charcoal)]"
    >
      <header className="flex items-center justify-between gap-3 border-b-[1.5px] border-ink px-[22px] py-[18px]">
        <h2 className="m-0 font-display text-[26px] leading-[30px] font-semibold tracking-[-0.015em] text-ink">Sorularım</h2>
        {timed && startedAt && (
          <span className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-surface px-3 py-[5px] text-[13px] leading-[18px] font-semibold text-ink">
            <Clock size={14} strokeWidth={2.25} aria-hidden="true" />
            Sonraki özet{" "}
            <span className="font-mono" suppressHydrationWarning>
              {mmss(secondsToNextCycle(new Date(startedAt).getTime(), ANALYSIS.autoIntervalMs, now))}
            </span>
          </span>
        )}
      </header>

      <div ref={bodyRef} className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-paper p-[22px]">
        <div className="flex items-center gap-2.5 rounded-[18px] border-[1.5px] border-dashed border-line-strong px-4 py-3.5 text-sm leading-5 font-medium text-ink">
          <span className="inline-flex size-[30px] flex-none items-center justify-center rounded-full bg-brand-tint text-brand">
            <Lock size={16} strokeWidth={2.25} aria-hidden="true" />
          </span>
          {ANALYSIS.autoIntervalMs > 0
            ? `Soruların diğerleriyle birlikte özetlenir ve ${intervalLabel(ANALYSIS.autoIntervalMs)} bir öğretmene iletilir.`
            : "Soruların diğerleriyle birlikte özetlenir ve öğretmene iletilir."}{" "}
          Adın hiçbir yerde geçmez, mesajlarını yalnızca sen görürsün.
        </div>

        {messages.map((m) => (
          <div key={m.id} className="flex flex-col items-end gap-1.5">
            <div className="max-w-[86%] rounded-[20px_20px_6px_20px] border-[1.5px] border-ink bg-brand-tint px-4 py-3 text-base leading-6 font-medium break-words text-ink">
              {m.text}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[13px] leading-[18px] font-medium text-ink-muted">
              <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-brand text-white">
                <Check size={11} strokeWidth={3.5} aria-hidden="true" />
              </span>
              {STUDENT_REPLY}
            </span>
          </div>
        ))}

        {state?.error && (
          <p role="alert" className="m-0 text-sm leading-5 font-semibold text-badge">
            {state.error}
          </p>
        )}
        {isBanned && (
          <p className="m-0 text-sm leading-5 font-semibold text-badge">
            Uygunsuz içerik veya spam nedeniyle sohbetin 5 dakika kısıtlandı. Kalan süre: {banTimeText}
          </p>
        )}
      </div>

      <footer className="flex flex-col gap-2 border-t-[1.5px] border-ink bg-surface px-[18px] pt-4 pb-[18px]">
        <form
          ref={formRef}
          action={action}
          className="flex items-end gap-2.5 rounded-[22px] border-[1.5px] border-ink bg-surface py-2 pr-2 pl-4 shadow-[4px_4px_0_var(--color-charcoal)]"
        >
          <input type="hidden" name="lesson_id" value={lessonId} />
          <label htmlFor="soru-web" className="sr-only">
            Sorunu yaz
          </label>
          <textarea
            id="soru-web"
            name="text"
            rows={2}
            maxLength={RATE_LIMITS.maxChars}
            required
            disabled={!!currentBlocked}
            placeholder={currentBlocked ?? "Aklına takılanı yaz…"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            className="min-h-12 min-w-0 flex-1 resize-none border-0 bg-transparent py-1.5 text-base leading-[22px] font-medium text-ink outline-none placeholder:text-ink-muted/70"
          />
          <button
            type="submit"
            disabled={pending || !!currentBlocked}
            className="inline-flex min-h-12 flex-none items-center justify-center gap-2 rounded-full border-[1.5px] border-brand bg-brand px-[18px] text-[15px] leading-5 font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Gönderiliyor…" : "Gönder"}
            <Send size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </form>
        <span className="px-1.5 text-xs leading-4 font-medium text-ink-muted">
          Enter ile gönder · en fazla {RATE_LIMITS.maxChars} karakter
        </span>
      </footer>
    </aside>
  );
}
