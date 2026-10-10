import { Check } from "lucide-react";
import Link from "next/link";
import styles from "./lesson-ready.module.css";

export function LessonSetupHeader({ step }: { step: 1 | 2 }) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>Apex</Link>
      <ol aria-label="Adımlar" className={styles.steps}>
        <li aria-current={step === 1 ? "step" : undefined}>
          <span className={step === 1 ? styles.current : styles.done}>
            {step === 1 ? "1" : <Check size={14} strokeWidth={3} aria-hidden="true" />}
          </span>Ders bilgisi
        </li>
        <li aria-hidden="true" className={styles.connector} />
        <li aria-current={step === 2 ? "step" : undefined}><span className={step === 2 ? styles.current : styles.next}>2</span>Kodu paylaş</li>
        <li aria-hidden="true" className={styles.connector} />
        <li><span className={styles.next}>3</span>Derse başla</li>
      </ol>
      <Link href="/" className={styles.textButton}>Vazgeç</Link>
    </header>
  );
}
