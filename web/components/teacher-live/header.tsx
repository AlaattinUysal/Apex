"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { setChatbotEnabled, setLessonStatus } from "@/app/actions/lessons";

export type HeaderLesson = {
  id: string;
  title: string;
  class_name: string;
  topic: string;
  join_code: string;
  status: string;
  chatbot_enabled: boolean;
};

// Koyu üst çubuk: logo, ders bilgisi, katılım kodu (kopyala), soru kutusu anahtarı, dersi başlat/bitir.
export function TeacherHeader({ lesson }: { lesson: HeaderLesson }) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useOptimistic(lesson.chatbot_enabled);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(lesson.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Pano izni yoksa sessizce geç; kod zaten ekranda görünüyor.
    }
  };

  const toggleChatbot = () =>
    startTransition(async () => {
      setEnabled(!enabled);
      await setChatbotEnabled(lesson.id, !enabled);
    });

  const outlined =
    "inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-paper px-[18px] text-sm leading-5 font-semibold text-paper no-underline disabled:opacity-60";

  return (
    <header className="flex flex-wrap items-center gap-x-[18px] gap-y-3.5 bg-charcoal px-5 py-3.5 text-paper">
      <Link href="/" className="font-display text-[26px] leading-[30px] font-semibold tracking-[-0.02em] text-paper no-underline">
        Apex
      </Link>
      <span aria-hidden="true" className="h-7 w-px bg-paper/25" />
      <div className="flex flex-col">
        <span className="text-[15px] leading-5 font-bold text-paper">
          {lesson.title} · {lesson.class_name}
        </span>
        <span className="text-[13px] leading-[18px] font-medium text-brand-tint">{lesson.topic}</span>
      </div>

      <span className="flex-1" />

      <span className="inline-flex min-h-10 items-center gap-2.5 rounded-full bg-brand-tint py-0 pr-1.5 pl-3.5 text-ink">
        <span className="text-xs leading-4 font-semibold">Kod</span>
        <span className="font-mono text-[17px] leading-5 font-semibold tracking-[0.14em]">{lesson.join_code}</span>
        <button
          type="button"
          onClick={copyCode}
          aria-label={copied ? "Kod kopyalandı" : "Kodu kopyala"}
          className="inline-flex size-[30px] items-center justify-center rounded-full bg-surface text-ink"
        >
          {copied ? <Check size={15} strokeWidth={2} aria-hidden="true" /> : <Copy size={15} strokeWidth={2} aria-hidden="true" />}
        </button>
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggleChatbot}
        className="inline-flex min-h-11 items-center gap-2.5 px-1.5 text-paper"
      >
        <span
          className={`relative h-7 w-12 flex-none rounded-full border-[1.5px] border-brand-tint transition-colors ${enabled ? "bg-brand" : "bg-charcoal"}`}
        >
          <span
            className={`absolute top-0.5 size-[21px] rounded-full bg-white transition-[left] ${enabled ? "left-[21px]" : "left-0.5"}`}
          />
        </span>
        <span className="text-sm leading-5 font-semibold">{enabled ? "Soru kutusu açık" : "Soru kutusu kapalı"}</span>
      </button>

      {lesson.status === "draft" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => void (await setLessonStatus(lesson.id, "live")))}
          className="inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-brand-tint bg-brand-tint px-[18px] text-sm leading-5 font-semibold text-ink"
        >
          Dersi başlat
        </button>
      )}
      {lesson.status === "live" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => void (await setLessonStatus(lesson.id, "ended")))}
          className={outlined}
        >
          Dersi bitir
        </button>
      )}
      {lesson.status === "ended" && (
        <Link href="/dashboard" className={outlined}>
          Derslerime dön
        </Link>
      )}
    </header>
  );
}
