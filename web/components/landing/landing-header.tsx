import Link from "next/link";
import { btnPrimary, btnSecondary } from "./ui";

export function LandingHeader() {
  return (
    <header className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8">
      <Link href="/" className="font-display text-[30px] leading-[34px] font-semibold tracking-[-0.02em] text-ink no-underline">
        Apex
      </Link>
      <nav aria-label="Ana menü" className="flex flex-wrap items-center gap-2">
        <a href="#nasil" className="inline-flex min-h-11 items-center px-3.5 text-[15px] leading-5 font-semibold text-ink no-underline">
          Nasıl çalışır
        </a>
        <a href="#kimin-icin" className="inline-flex min-h-11 items-center px-3.5 text-[15px] leading-5 font-semibold text-ink no-underline">
          Kimin için
        </a>
        <Link href="/join" className={`${btnSecondary} min-h-11 px-5 text-[15px] leading-5`}>
          Derse katıl
        </Link>
        <Link href="/create" className={`${btnPrimary} min-h-11 px-5 text-[15px] leading-5`}>
          Ders oluştur
        </Link>
      </nav>
    </header>
  );
}
