import type { ReactNode } from "react";
import { Code, Eyebrow } from "./ui";

function Step({ n, title, text, children }: { n: string; title: string; text: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5 rounded-3xl border-[1.5px] border-ink bg-surface p-7 shadow-hard-6">
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-brand font-display text-xl leading-6 font-semibold text-white">
        {n}
      </span>
      <h3 className="text-2xl leading-[30px] font-semibold">{title}</h3>
      <p className="text-base leading-6 text-ink-muted">{text}</p>
      {children}
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="nasil" className="mx-auto flex max-w-[1200px] scroll-mt-4 flex-col gap-12 px-5 py-16 sm:px-8 sm:py-24">
      <div className="flex max-w-[720px] flex-col gap-3.5">
        <Eyebrow className="self-start">Nasıl çalışır</Eyebrow>
        <h2 className="font-display text-4xl leading-[1.08] font-semibold tracking-[-0.02em] sm:text-5xl sm:leading-[52px]">
          Üç adım, dersi hiç bölmeden.
        </h2>
      </div>

      <div className="flex flex-wrap gap-7">
        <Step
          n="1"
          title="Öğrenci kodla girer"
          text={'Ad, e-posta, hesap yok. Sorusunu yazar; sohbet her mesaja aynı cevabı verir: "Mesajın öğretmene iletilecek."'}
        >
          <div aria-hidden="true" className="mt-auto flex gap-1.5 pt-2">
            {["K", "7", "M", "2", "Q", "X"].map((c, i) => (
              <span
                key={i}
                className={`inline-flex h-[46px] w-[38px] items-center justify-center rounded-lg border-[1.5px] border-ink font-mono text-xl leading-6 font-semibold ${i > 3 ? "bg-brand-tint" : "bg-surface"}`}
              >
                {c}
              </span>
            ))}
          </div>
        </Step>

        <Step
          n="2"
          title="Apex birleştirir"
          text="Mesajlar 5 dakika birikir. Yapay zekâ hepsini birlikte okur, uygunsuzları eler, kalanları konulara ayırır."
        >
          <div aria-hidden="true" className="mt-auto flex items-center gap-3 pt-2">
            <span className="inline-flex items-center rounded-[14px] bg-brand px-4 py-2 font-mono text-[26px] leading-8 font-semibold text-white">
              5:00
            </span>
            <span className="text-sm leading-5 font-semibold">15 mesaj → 1 özet</span>
          </div>
        </Step>

        <Step
          n="3"
          title="Sen özeti okursun"
          text="Sorular konu başlıklarına ayrılıp kısa maddelere dönüşür. Ham mesaj yok; sadece sınıfın neyi anlamadığı."
        >
          <div aria-hidden="true" className="mt-auto flex flex-col gap-2 rounded-[14px] border-[1.5px] border-ink bg-surface px-4 py-3.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-sm bg-brand" />
              <span className="flex-1 text-sm leading-5 font-bold text-brand">Listeler ve indeksleme</span>
              <span className="font-mono text-xs leading-4 font-medium text-ink-muted">02:20</span>
            </div>
            <span className="flex gap-2 text-sm leading-5 font-medium">
              <span className="mt-2 size-[5px] flex-none rounded-full bg-ink" />
              <span>
                <Code>append()</Code> ile <Code>extend()</Code> farkı soruldu.
              </span>
            </span>
          </div>
        </Step>
      </div>
    </section>
  );
}
