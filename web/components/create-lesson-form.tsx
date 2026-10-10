"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { createLesson } from "@/app/actions/lessons";
import styles from "@/components/lesson-ready/lesson-ready.module.css";

export function CreateLessonForm() {
  const [state, action, pending] = useActionState(createLesson, undefined);

  return (
    <>
      <section className={styles.codePanel} aria-labelledby="create-title">
        <span className={styles.formEyebrow}>Yeni ders</span>
        <h1 id="create-title">Bir sonraki dersini aç.</h1>
        <p className={styles.instructions}>Ders bilgilerini yaz. Sonraki adımda sınıfınla paylaşacağın katılım kodun hazır olacak.</p>
        <form action={action} className={styles.createForm}>
          <label htmlFor="lesson-title">Ders<input id="lesson-title" name="title" required maxLength={120} placeholder="Ör. Matematik" autoComplete="off" /></label>
          <div className={styles.formRow}>
            <label htmlFor="lesson-class">Sınıf<input id="lesson-class" name="class_name" required maxLength={60} placeholder="Ör. 9-A" autoComplete="off" /></label>
            <label htmlFor="lesson-topic">Konu<input id="lesson-topic" name="topic" required maxLength={120} placeholder="Ör. Denklemler" autoComplete="off" /></label>
          </div>
          {state?.error && <p role="alert" className={styles.error}>{state.error}</p>}
          <button type="submit" disabled={pending} className={styles.startButton}>
            {pending ? "Oluşturuluyor…" : "Ders oluştur"}<ArrowRight size={22} aria-hidden="true" />
          </button>
        </form>
      </section>
      <aside className={styles.aside}>
        <section className={styles.settings}>
          <div className={styles.settingsHeading}><h2>Önce kodu paylaş.</h2></div>
          <p className={styles.instructions}>Öğrenciler Apex&apos;te &quot;Derse katıl&quot;a girip kodu yazar. Ad ya da e-posta istenmez.</p>
          <div className={styles.questionBox}>
            <p className={styles.instructions}>Sen hazır olduğunda dersi başlatırsın.</p>
            <span>Ders bilgilerini kodu paylaşmadan önce düzenleyebilirsin.</span>
          </div>
        </section>
      </aside>
    </>
  );
}
