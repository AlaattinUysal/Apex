"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessage } from "@/app/actions/messages";
import { RATE_LIMITS, STUDENT_REPLY } from "@/lib/config";

type Message = { id: string; text: string };

// Öğrenci tarafı chatbot: her mesaja aynı kısa cevabı verir. Durum/ret/önizleme gösterilmez.
export function StudentChat({
  lessonId,
  messages,
  blockedReason,
}: {
  lessonId: string;
  messages: Message[];
  blockedReason: string | null; // null ise yazılabilir
}) {
  const [state, action, pending] = useActionState(sendMessage, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Başarılı gönderimden sonra kutuyu temizle.
  useEffect(() => {
    if (state?.sentAt) formRef.current?.reset();
  }, [state]);

  // Yeni mesaj gelince (ve ilk açılışta) listeyi en alta kaydır: sohbet yukarıdan aşağı akar, yeni mesaj görünür.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight });
  }, [messages.length]);

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
          disabled={!!blockedReason}
          placeholder={blockedReason ?? "Sorunu buraya yaz…"}
          className="input resize-none"
        />
        {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
        <button type="submit" disabled={pending || !!blockedReason} className="btn">
          {pending ? "Gönderiliyor…" : "Gönder"}
        </button>
      </form>
    </div>
  );
}
