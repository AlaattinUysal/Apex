"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendMessage } from "@/app/actions/messages";
import { RATE_LIMITS, STUDENT_REPLY } from "@/lib/config";

type Message = { id: string; text: string };

// Öğrenci tarafı chatbot: her mesaja aynı kısa cevabı verir. Durum/ret/önizleme gösterilmez.
export function StudentChat({
  lessonId,
  messages,
  blockedReason,
  banUntil = null,
}: {
  lessonId: string;
  messages: Message[];
  blockedReason: string | null; // null ise yazılabilir
  banUntil?: number | null;
}) {
  const [state, action, pending] = useActionState(sendMessage, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const effectiveBanUntil = state?.banUntil ?? banUntil ?? null;
  const [remainingSec, setRemainingSec] = useState<number>(() => {
    if (!effectiveBanUntil) return 0;
    return Math.max(0, Math.ceil((effectiveBanUntil - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!effectiveBanUntil) {
      setRemainingSec(0);
      return;
    }
    const update = () => {
      const sec = Math.max(0, Math.ceil((effectiveBanUntil - Date.now()) / 1000));
      setRemainingSec(sec);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [effectiveBanUntil]);

  // Başarılı gönderimden sonra kutuyu temizle.
  useEffect(() => {
    if (state?.sentAt) formRef.current?.reset();
  }, [state]);

  // Yeni mesaj gelince (ve ilk açılışta) listeyi en alta kaydır: sohbet yukarıdan aşağı akar, yeni mesaj görünür.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight });
  }, [messages.length]);

  const isBanned = remainingSec > 0;
  const banMinutes = Math.floor(remainingSec / 60);
  const banSeconds = remainingSec % 60;
  const banTimeText = `${banMinutes > 0 ? `${banMinutes} dk ` : ""}${banSeconds} sn`;
  const banMessage = isBanned
    ? `Uygunsuz içerik / spam nedeniyle kısıtlandın (${banTimeText})`
    : null;

  const currentBlocked = blockedReason ?? banMessage;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <ul ref={listRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && (
          <li className="text-sm text-muted">Henüz mesaj yazmadın. Aklına takılanı yaz, öğretmenine anonim iletilir.</li>
        )}
        {messages.map((m) => (
          <li key={m.id} className="flex shrink-0 flex-col gap-1">
            <p className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-sm text-accent-foreground">
              {m.text}
            </p>
            <p className="max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-border/60 px-3 py-2 text-sm">
              {STUDENT_REPLY}
            </p>
          </li>
        ))}
      </ul>

      <form ref={formRef} action={action} className="flex flex-col gap-2">
        <input type="hidden" name="lesson_id" value={lessonId} />
        <textarea
          name="text"
          rows={3}
          maxLength={RATE_LIMITS.maxChars}
          required
          disabled={!!currentBlocked}
          placeholder={currentBlocked ?? "Sorunu buraya yaz…"}
          className="input resize-none"
        />
        {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
        {isBanned && (
          <p className="rounded-lg bg-amber-500/10 p-2 text-xs font-medium text-amber-600 dark:text-amber-400">
            ⚠️ Uygunsuz içerik veya spam nedeniyle sohbetin 5 dakika kısıtlandı. Kalan süre: {banTimeText}
          </p>
        )}
        <button type="submit" disabled={pending || !!currentBlocked} className="btn">
          {pending ? "Gönderiliyor…" : isBanned ? `Kısıtlı (${banTimeText})` : "Gönder"}
        </button>
      </form>
    </div>
  );
}
