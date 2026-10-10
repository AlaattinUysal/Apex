import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { btnPrimary, btnSecondary, CheckItem, Eyebrow } from "./ui";

const heading =
  "font-display text-[32px] leading-[1.1] font-semibold tracking-[-0.015em] sm:text-4xl sm:leading-10";

export function Audience() {
  return (
    <section id="kimin-icin" className="mx-auto flex max-w-[1200px] scroll-mt-4 flex-wrap gap-7 px-5 pb-16 sm:px-8 sm:pb-24">
      {/* Öğretmen */}
      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5 rounded-[28px] border-[1.5px] border-ink bg-surface p-6 sm:p-10">
        <Eyebrow className="self-start !bg-sunken">Öğretmen için</Eyebrow>
        <h2 className={heading}>Sınıf neyi anlamadı, tek bakışta.</h2>
        <ul className="flex list-none flex-col gap-3.5 p-0">
          <CheckItem>Sorular konu başlıklarına ayrılmış kısa maddeler olarak gelir.</CheckItem>
          <CheckItem>Ses yok, açılır pencere yok; özet yenilenince sadece &quot;Güncellendi&quot; yazar.</CheckItem>
          <CheckItem>Hakaret ve alakasız mesajlar sana hiç ulaşmaz.</CheckItem>
        </ul>
        <Link href="/create" className={`${btnPrimary} mt-1 min-h-12 gap-2 self-start px-6 text-[15px] leading-5`}>
          Ders oluştur
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>

      {/* Öğrenci */}
      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5 rounded-[28px] border-[1.5px] border-ink bg-brand-tint p-6 sm:p-10">
        <Eyebrow className="self-start">Öğrenci için</Eyebrow>
        <h2 className={heading}>Sor, kimse kim olduğunu bilmesin.</h2>
        <ul className="flex list-none flex-col gap-3.5 p-0">
          <CheckItem>Ad, e-posta ya da hesap yok; ders kodu yeterli.</CheckItem>
          <CheckItem>Sorun benzerleriyle birleşip öğretmene ulaşır.</CheckItem>
          <CheckItem>Başkalarının mesajlarını göremezsin, onlar da seninkini.</CheckItem>
        </ul>
        <Link href="/join" className={`${btnSecondary} mt-1 min-h-12 self-start px-6 text-[15px] leading-5 shadow-hard-4`}>
          Derse katıl
        </Link>
      </div>
    </section>
  );
}
