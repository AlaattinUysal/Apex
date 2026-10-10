import Link from "next/link";
import { btnPrimary, btnTint } from "./ui";

export function ClosingCta() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8 sm:pb-24">
      <div className="flex flex-col items-center gap-5 rounded-[32px] border-[1.5px] border-ink bg-surface px-6 py-12 text-center shadow-hard-8 sm:px-8 sm:py-16">
        <h2 className="max-w-[720px] font-display text-[38px] leading-[1.08] font-semibold tracking-[-0.025em] sm:text-[56px] sm:leading-[60px]">
          Bir sonraki dersini aç.
        </h2>
        <p className="max-w-[520px] text-[17px] leading-[26px] font-medium text-ink-muted">
          Dersi oluştur, kodu tahtaya yaz, soruları tek bir özette topla.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/create" className={`${btnPrimary} min-h-[52px] px-7 text-base leading-6`}>
            Ders oluştur
          </Link>
          <Link href="/join" className={`${btnTint} min-h-[52px] px-7 text-base leading-6`}>
            Derse katıl
          </Link>
        </div>
      </div>
    </section>
  );
}
