import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { JoinForm } from "@/components/join-form";
import { LandingZoom } from "@/components/landing/landing-zoom";
import styles from "@/components/join-page.module.css";

export const metadata: Metadata = { title: "Derse katıl — Apex" };

// Öğrenci katılım sayfası. Ad, e-posta, hesap yok; öğretmenin verdiği 6 haneli kod yeterli.
export default function JoinPage() {
  return (
    <div className={`lp-zoom min-h-[calc(100vh/var(--lp-zoom,1))] ${styles.page}`}>
      <LandingZoom />
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>Apex</Link>
        <Link href="/create" className={styles.teacherLink}>Öğretmen misin? Ders oluştur</Link>
      </header>

      <main className={styles.main}>
        <section aria-label="Derse katıl" className={styles.joinPanel}>
          <span className={styles.badge}><span />Öğrenci girişi</span>
          <div className={styles.intro}>
            <h1>Kodu gir,<br />utanmadan sor.</h1>
            <p>Öğretmeninin tahtaya yazdığı ders kodunu gir. Ad, e-posta ya da hesap istemiyoruz.</p>
          </div>
          <JoinForm />
        </section>
        <aside className={styles.aside}>
          <section aria-label="Derste seni ne bekliyor" className={styles.preview}>
            <h2>Derste seni ne bekliyor?</h2>
            <p>Dersi izlerken aklına takılanı yazarsın. Cevap hep aynıdır; gerisini Apex halleder.</p>
            <div aria-hidden="true" className={styles.messages}>
              <div className={styles.question}>hocam bu x niye eksi oldu anlamadım</div>
              <div className={styles.reply}>
                <span className={styles.check}><Check size={14} strokeWidth={3} /></span>
                Mesajın öğretmene iletilecek.
              </div>
            </div>
          </section>
          <section aria-label="Gizlilik" className={styles.privacy}>
            <ul>
              <li><span />Ad, e-posta ya da hesap yok.</li>
              <li><span />Kim olduğunu kimse görmez, öğretmen de.</li>
              <li><span />Başkalarının mesajlarını göremezsin, onlar da seninkini.</li>
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}
