import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HeroStage } from "./hero-stage";
import { btnPrimary, btnSecondary, Eyebrow } from "./ui";

export function Hero() {
  return (
    <section className="mx-auto flex max-w-[1200px] flex-col items-center gap-12 px-5 pt-10 pb-[88px] sm:px-8">
      <div className="flex max-w-[860px] flex-col items-center gap-[22px] text-center">
        <Eyebrow>
          <span className="size-2 rounded-full bg-ink" />
          Canlı derste anonim soru
        </Eyebrow>
        <h1 className="font-display text-[44px] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-[76px] sm:leading-[78px]">
          Utanmaya son,
          <br />
          utanmadan sor.
        </h1>
        <p className="max-w-[600px] text-[17px] leading-[27px] font-medium sm:text-[19px] sm:leading-[29px]">
          Öğrenciler dersi bölmeden soru yazar. Apex 5 dakikada bir mesajları toplar, uygunsuzları eler, aynı
          konudakileri birleştirir. Sen yalnızca konu konu hazırlanmış özeti görürsün.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/create" className={`${btnPrimary} min-h-[52px] gap-2 px-7 text-base leading-6`}>
            Ders oluştur
            <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
          </Link>
          <Link href="/join" className={`${btnSecondary} min-h-[52px] px-7 text-base leading-6 shadow-hard-4`}>
            Kodum var, derse katıl
          </Link>
        </div>
      </div>

      <HeroStage />
    </section>
  );
}
