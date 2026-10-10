import { Lock } from "lucide-react";
import Link from "next/link";

// Açık üst çubuk: logo, ders etiketi, anonimlik notu ve "Dersten ayrıl".
export function StudentHeader({ label }: { label: string }) {
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b-[1.5px] border-ink bg-surface px-5 py-3.5">
      <Link href="/" className="font-display text-[26px] leading-[30px] font-semibold tracking-[-0.02em] text-ink no-underline">
        Apex
      </Link>
      <span className="rounded-full border-[1.5px] border-ink bg-brand-tint px-3 py-[5px] text-[13px] leading-[18px] font-semibold text-ink">
        {label}
      </span>
      <span className="flex-1" />
      <span className="inline-flex items-center gap-1.5 text-[13px] leading-[18px] font-semibold text-ink-muted">
        <Lock size={15} strokeWidth={2.25} aria-hidden="true" />
        Anonim katıldın
      </span>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-ink bg-surface px-[18px] text-sm leading-5 font-semibold text-ink no-underline"
      >
        Dersten ayrıl
      </Link>
    </header>
  );
}
