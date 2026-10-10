import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getTeacher } from "@/lib/auth";
import { authDestination } from "@/lib/auth-destination";

export const metadata: Metadata = { title: "Öğretmen girişi — Apex" };

// Giriş için ayrı bir tasarım dosyası yok; tasarım sistemindeki kart + kalın gölge diliyle, katılım sayfasının kardeşi.
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="mx-auto w-full max-w-[1200px] px-5 py-6 sm:px-8">
        <Link href="/" className="font-display text-[30px] leading-[34px] font-semibold tracking-[-0.02em] text-ink no-underline">
          Apex
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 items-start justify-center px-5 pb-16 sm:px-8 sm:pt-6">
        <div className="flex w-full max-w-[460px] flex-col gap-6 rounded-[28px] border-[1.5px] border-ink bg-surface p-6 shadow-hard-8 sm:p-10">
          <div className="flex flex-col gap-2">
            <span className="self-start rounded-full border-[1.5px] border-ink bg-brand-tint px-3.5 py-1.5 text-[13px] leading-[18px] font-semibold">
              Öğretmen
            </span>
            <h1 className="font-display text-4xl leading-[1.1] font-semibold tracking-[-0.02em]">Öğretmen girişi</h1>
            <p className="text-base leading-6 text-ink-muted">Dersini oluşturmak ve sınıfın sorularını görmek için giriş yap.</p>
          </div>
          <Suspense fallback={null}>
            <LoginContent searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function LoginContent({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const next = authDestination((await searchParams).next);
  if (await getTeacher()) redirect(next);
  return <AuthForm next={next} />;
}
