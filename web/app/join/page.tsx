import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "@/components/join-form";

export const metadata: Metadata = { title: "Derse katıl — Apex" };

// Öğrenci katılım sayfası. Ad, e-posta, hesap yok; öğretmenin verdiği 6 haneli kod yeterli.
export default function JoinPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="mx-auto w-full max-w-[1200px] px-5 py-6 sm:px-8">
        <Link href="/" className="font-display text-[30px] leading-[34px] font-semibold tracking-[-0.02em] text-ink no-underline">
          Apex
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 items-start justify-center px-5 pb-16 sm:px-8 sm:pt-6">
        <div className="flex w-full max-w-[460px] flex-col gap-6 rounded-[28px] border-[1.5px] border-ink bg-cream p-6 shadow-[8px_8px_0_#262a29] sm:p-10">
          <div className="flex flex-col gap-2">
            <span className="self-start rounded-full border-[1.5px] border-ink bg-mint px-3.5 py-1.5 text-[13px] leading-[18px] font-semibold">
              Öğrenci
            </span>
            <h1 className="font-display text-4xl leading-[1.1] font-semibold tracking-[-0.02em]">Derse katıl</h1>
            <p className="text-base leading-6 text-slate">
              Öğretmeninin verdiği kodu yaz. Ad, e-posta ya da hesap gerekmez; sorun anonim kalır.
            </p>
          </div>
          <JoinForm />
        </div>
      </main>
    </div>
  );
}
