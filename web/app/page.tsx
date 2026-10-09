import Link from "next/link";
import { JoinForm } from "@/components/join-form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-12 px-6 py-16">
      <header className="flex flex-col gap-4">
        <span className="font-mono text-sm font-semibold tracking-widest text-accent">APEX</span>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Utanmadan sor. Öğretmen sadece önemli olanı görsün.
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Öğrenciler ders sırasında anonim soru yazar. Yapay zekâ benzer soruları birleştirir,
          uygunsuzları eler ve öğretmene her konu için tek bir kısa kart gösterir.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold">Öğrenciyim</h2>
            <p className="text-sm text-muted">Öğretmeninin verdiği kodu gir. İsim veya e-posta gerekmez.</p>
          </div>
          <JoinForm />
        </section>

        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold">Öğretmenim</h2>
            <p className="text-sm text-muted">Ders aç, katılım kodunu paylaş, gelen soruları konu kartları olarak izle.</p>
          </div>
          <Link href="/login" className="btn-ghost">
            Öğretmen girişi
          </Link>
        </section>
      </div>
    </main>
  );
}
