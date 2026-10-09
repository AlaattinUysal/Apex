import Link from "next/link";
import type { ReactNode } from "react";

// Landing: "Landing-html" tasarım taslağının uygulaması. Renk/boyut/gölge değerleri tasarımdan alındı.
// Bağlantılar: "Ders oluştur" -> /dashboard (giriş yoksa /login'e yönlenir), "Derse katıl" -> /join.

const pill =
  "inline-flex items-center justify-center rounded-full border-[1.5px] font-semibold no-underline transition-transform hover:-translate-y-px";
const primary = `${pill} border-forest bg-forest text-white`;
const outline = `${pill} border-ink bg-cream text-ink`;
const badge =
  "inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-cream px-3.5 py-1.5 text-[13px] leading-[18px] font-semibold text-ink";

function ArrowRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-sand px-1.5 py-px font-mono text-[13px] leading-5 font-medium">{children}</code>;
}

function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex size-[26px] flex-none items-center justify-center rounded-full bg-forest text-white">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="text-base leading-6 font-medium">{children}</span>
    </li>
  );
}

function Bullet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <li className={`flex gap-2.5 font-medium ${className}`}>
      <span className="mt-[9px] size-1.5 flex-none rounded-full bg-ink" />
      <span>{children}</span>
    </li>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Üst menü */}
      <header className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <Link href="/" className="font-display text-[30px] leading-[34px] font-semibold tracking-[-0.02em] text-ink no-underline">
          Apex
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          <a href="#nasil" className="inline-flex min-h-11 items-center px-3.5 text-[15px] leading-5 font-semibold text-ink no-underline">
            Nasıl çalışır
          </a>
          <a href="#kimin-icin" className="inline-flex min-h-11 items-center px-3.5 text-[15px] leading-5 font-semibold text-ink no-underline">
            Kimin için
          </a>
          <Link href="/join" className={`${outline} min-h-11 px-5 text-[15px] leading-5`}>
            Derse katıl
          </Link>
          <Link href="/dashboard" className={`${primary} min-h-11 px-5 text-[15px] leading-5`}>
            Ders oluştur
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-[1200px] flex-col items-center gap-12 px-5 pt-10 pb-[88px] sm:px-8">
        <div className="flex max-w-[860px] flex-col items-center gap-[22px] text-center">
          <span className={badge}>
            <span className="size-2 rounded-full bg-ink" />
            Canlı derste anonim soru
          </span>
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
            <Link href="/dashboard" className={`${primary} min-h-[52px] gap-2 px-7 text-base leading-6`}>
              Ders oluştur
              <ArrowRight size={20} />
            </Link>
            <Link href="/join" className={`${outline} min-h-[52px] px-7 text-base leading-6 shadow-[4px_4px_0_#262a29]`}>
              Kodum var, derse katıl
            </Link>
          </div>
        </div>

        {/* Önce / sonra paneli */}
        <div className="flex w-full flex-wrap items-center gap-7 rounded-[28px] border-[1.5px] border-ink bg-cream p-5 shadow-[8px_8px_0_#262a29] sm:p-10">
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-3">
            <span className="text-[13px] leading-[18px] font-bold tracking-[0.02em] text-slate">Öğrencilerden gelen mesajlar</span>
            <div className="box-content max-w-[92%] -rotate-[1.5deg] self-start rounded-[18px_18px_18px_6px] border-[1.5px] border-ink bg-mint px-3.5 py-2.5 text-base leading-[22px] font-medium">
              hocam for ile listeyi gezerken IndexError alıyorum neden
            </div>
            <div className="box-content max-w-[92%] rotate-1 self-end rounded-[18px_18px_6px_18px] border-[1.5px] border-ink bg-sand px-3.5 py-2.5 text-base leading-[22px] font-medium">
              listeye liste eklerken append mi extend mi
            </div>
            <div className="box-content max-w-[92%] -rotate-[0.5deg] self-start rounded-[18px_18px_18px_6px] border-[1.5px] border-ink bg-mint px-3.5 py-2.5 text-base leading-[22px] font-medium">
              son elemana nasıl ulaşıyoruz, len()-1 mi?
            </div>
            <div className="flex flex-col items-end gap-1 self-end">
              <div className="box-content max-w-full rounded-[18px_18px_6px_18px] border-[1.5px] border-dashed border-stone px-3.5 py-2.5 text-base leading-[22px] font-medium text-slate line-through">
                boş yapma hoca ders çok sıkıcı
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs leading-4 font-semibold text-slate">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                Öğretmene gitmez
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-[0_1_120px] flex-col items-center gap-2">
            <span className="inline-flex size-16 items-center justify-center rounded-full bg-forest text-white">
              <ArrowRight size={30} />
            </span>
            <span className="font-mono text-sm leading-5 font-semibold">5:00</span>
            <span className="text-center text-xs leading-4 font-medium text-slate">her turda</span>
          </div>

          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3">
            <span className="text-[13px] leading-[18px] font-bold tracking-[0.02em] text-slate">Öğretmenin gördüğü</span>
            <article className="flex flex-col gap-3.5 rounded-[20px] border-[1.5px] border-ink bg-cream p-[22px] shadow-[5px_5px_0_#0e5a4f]">
              <div className="flex items-center gap-2.5">
                <span className="font-display text-xl leading-[26px] font-semibold">Sınıfın soruları</span>
                <span className="ml-auto inline-flex items-center gap-1.5 text-[13px] leading-[18px] font-semibold">
                  <span className="size-[9px] rounded-full bg-brick" />
                  Güncellendi <span className="font-mono">02:20</span>
                </span>
              </div>
              <h3 className="flex items-center gap-2.5 text-[17px] leading-[22px] font-bold text-forest">
                <span className="size-2.5 rounded-[3px] bg-forest" />
                Listeler ve indeksleme
              </h3>
              <ul className="flex list-none flex-col gap-2.5 p-0">
                <Bullet className="text-[15px] leading-[23px]">
                  Döngüde <Code>range(len(liste))</Code> kullanırken alınan IndexError hatasının sebebi ve son elemana erişim soruldu.
                </Bullet>
                <Bullet className="text-[15px] leading-[23px]">
                  <Code>append()</Code> ile <Code>extend()</Code> arasındaki fark merak edildi.
                </Bullet>
              </ul>
              <div className="flex items-center justify-between gap-3 border-t border-ink/15 pt-3">
                <span className="text-[13px] leading-[18px] font-medium text-slate">3 mesaj · 1 mesaj elendi</span>
                <span className="inline-flex min-h-9 items-center rounded-full border-[1.5px] border-forest bg-forest px-3.5 text-sm leading-5 font-semibold text-white" aria-hidden="true">
                  Cevaplandı
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Güven şeridi */}
      <div className="bg-charcoal">
        <ul className="mx-auto flex max-w-[1200px] list-none flex-wrap items-center justify-center gap-x-7 gap-y-3 px-5 py-5 sm:px-8">
          {["Ad yok", "E-posta yok", "Ses yok", "Ham mesaj yok", "5 dakikada bir özet"].map((t) => (
            <li key={t} className="inline-flex items-center gap-2.5 text-base leading-6 font-semibold text-paper">
              <span className="size-2 rounded-full bg-mint" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Nasıl çalışır */}
      <section id="nasil" className="mx-auto flex max-w-[1200px] scroll-mt-4 flex-col gap-12 px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <span className={`${badge} self-start`}>Nasıl çalışır</span>
          <h2 className="font-display text-4xl leading-[1.08] font-semibold tracking-[-0.02em] sm:text-5xl sm:leading-[52px]">
            Üç adım, dersi hiç bölmeden.
          </h2>
        </div>
        <div className="flex flex-wrap gap-7">
          <Step n="1" title="Öğrenci kodla girer" text={'Ad, e-posta, hesap yok. Sorusunu yazar; sohbet her mesaja aynı cevabı verir: "Mesajın öğretmene iletilecek."'}>
            <div aria-hidden="true" className="mt-auto flex gap-1.5 pt-2">
              {["K", "7", "M", "2", "Q", "X"].map((c, i) => (
                <span
                  key={i}
                  className={`inline-flex h-[46px] w-[38px] items-center justify-center rounded-lg border-[1.5px] border-ink font-mono text-xl leading-6 font-semibold ${i > 3 ? "bg-mint" : "bg-cream"}`}
                >
                  {c}
                </span>
              ))}
            </div>
          </Step>
          <Step n="2" title="Apex birleştirir" text="Mesajlar 5 dakika birikir. Yapay zekâ hepsini birlikte okur, uygunsuzları eler, kalanları konulara ayırır.">
            <div aria-hidden="true" className="mt-auto flex items-center gap-3 pt-2">
              <span className="inline-flex items-center rounded-[14px] bg-forest px-4 py-2 font-mono text-[26px] leading-8 font-semibold text-white">5:00</span>
              <span className="text-sm leading-5 font-semibold">15 mesaj → 1 özet</span>
            </div>
          </Step>
          <Step n="3" title="Sen özeti okursun" text="Sorular konu başlıklarına ayrılıp kısa maddelere dönüşür. Ham mesaj yok; sadece sınıfın neyi anlamadığı.">
            <div aria-hidden="true" className="mt-auto flex flex-col gap-2 rounded-[14px] border-[1.5px] border-ink bg-cream px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-sm bg-forest" />
                <span className="flex-1 text-sm leading-5 font-bold text-forest">Listeler ve indeksleme</span>
                <span className="font-mono text-xs leading-4 font-medium text-slate">02:20</span>
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

      {/* Kimin için */}
      <section id="kimin-icin" className="mx-auto flex max-w-[1200px] scroll-mt-4 flex-wrap gap-7 px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5 rounded-[28px] border-[1.5px] border-ink bg-cream p-6 sm:p-10">
          <span className={`${badge} self-start !bg-sand`}>Öğretmen için</span>
          <h2 className="font-display text-[32px] leading-[1.1] font-semibold tracking-[-0.015em] sm:text-4xl sm:leading-10">
            Sınıf neyi anlamadı, tek bakışta.
          </h2>
          <ul className="flex list-none flex-col gap-3.5 p-0">
            <CheckItem>Sorular konu başlıklarına ayrılmış kısa maddeler olarak gelir.</CheckItem>
            <CheckItem>Ses yok, açılır pencere yok; özet yenilenince sadece &quot;Güncellendi&quot; yazar.</CheckItem>
            <CheckItem>Hakaret ve alakasız mesajlar sana hiç ulaşmaz.</CheckItem>
          </ul>
          <Link href="/dashboard" className={`${primary} mt-1 min-h-12 gap-2 self-start px-6 text-[15px] leading-5`}>
            Ders oluştur
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5 rounded-[28px] border-[1.5px] border-ink bg-mint p-6 sm:p-10">
          <span className={`${badge} self-start`}>Öğrenci için</span>
          <h2 className="font-display text-[32px] leading-[1.1] font-semibold tracking-[-0.015em] sm:text-4xl sm:leading-10">
            Sor, kimse kim olduğunu bilmesin.
          </h2>
          <ul className="flex list-none flex-col gap-3.5 p-0">
            <CheckItem>Ad, e-posta ya da hesap yok; ders kodu yeterli.</CheckItem>
            <CheckItem>Sorun benzerleriyle birleşip öğretmene ulaşır.</CheckItem>
            <CheckItem>Başkalarının mesajlarını göremezsin, onlar da seninkini.</CheckItem>
          </ul>
          <Link href="/join" className={`${outline} mt-1 min-h-12 self-start px-6 text-[15px] leading-5 shadow-[4px_4px_0_#262a29]`}>
            Derse katıl
          </Link>
        </div>
      </section>

      {/* Son çağrı */}
      <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="flex flex-col items-center gap-5 rounded-[32px] border-[1.5px] border-ink bg-cream px-6 py-12 text-center shadow-[8px_8px_0_#262a29] sm:px-8 sm:py-16">
          <h2 className="max-w-[720px] font-display text-[38px] leading-[1.08] font-semibold tracking-[-0.025em] sm:text-[56px] sm:leading-[60px]">
            Bir sonraki dersini aç.
          </h2>
          <p className="max-w-[520px] text-[17px] leading-[26px] font-medium text-slate">
            Dersi oluştur, kodu tahtaya yaz, soruları tek bir özette topla.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className={`${primary} min-h-[52px] px-7 text-base leading-6`}>
              Ders oluştur
            </Link>
            <Link href="/join" className={`${pill} min-h-[52px] border-ink bg-mint px-7 text-base leading-6 text-ink`}>
              Derse katıl
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t-[1.5px] border-ink">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-7 sm:px-8">
          <span className="font-display text-[22px] leading-[26px] font-semibold tracking-[-0.02em]">Apex</span>
          <span className="text-sm leading-5 font-medium">Ders sırasında öğrencinin sesi, öğretmenin önünde tek özet.</span>
        </div>
      </footer>
    </div>
  );
}

function Step({ n, title, text, children }: { n: string; title: string; text: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5 rounded-3xl border-[1.5px] border-ink bg-cream p-7 shadow-[6px_6px_0_#262a29]">
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-forest font-display text-xl leading-6 font-semibold text-white">
        {n}
      </span>
      <h3 className="text-2xl leading-[30px] font-semibold">{title}</h3>
      <p className="text-base leading-6 text-slate">{text}</p>
      {children}
    </div>
  );
}
