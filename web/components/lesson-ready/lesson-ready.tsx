"use client";

import { ArrowRight, Check, Copy, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { LandingZoom } from "@/components/landing/landing-zoom";
import styles from "./lesson-ready.module.css";
import { LessonSetupHeader } from "./lesson-setup-header";

export type ReadyLesson = {
  title: string;
  class_name: string;
  topic: string;
  join_code: string;
  chatbot_enabled: boolean;
};

type Result = { error?: string };
type Props = {
  lesson: ReadyLesson;
  startAction: () => Promise<Result>;
  toggleAction: (enabled: boolean) => Promise<Result>;
  updateAction: (formData: FormData) => Promise<Result>;
};

function CodeTiles({ code }: { code: string }) {
  return (
    <div className={styles.code} role="group" aria-label={`Katılım kodu: ${code.split("").join(" ")}`}>
      {code.split("").map((character, index) => <span key={index} aria-hidden="true">{character}</span>)}
    </div>
  );
}

export function LessonReady({ lesson, startAction, toggleAction, updateAction }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const editDialog = useRef<HTMLDialogElement>(null);

  function run(action: () => Promise<Result>, onSuccess?: () => void) {
    setError("");
    startTransition(async () => {
      try {
        const result = await action();
        if (result.error) setError(result.error);
        else onSuccess?.();
      } catch {
        setError("İşlem tamamlanamadı. Lütfen tekrar dene.");
      }
    });
  }

  async function copyCode() {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(lesson.join_code);
      setCopied(true);
    } catch {
      setCopyError("Kod kopyalanamadı. Yukarıdaki kodu elle kopyalayabilirsin.");
    }
  }

  function editLesson() {
    setError("");
    editDialog.current?.querySelector("form")?.reset();
    editDialog.current?.showModal();
  }

  return (
    <div className={`lp-zoom min-h-[calc(100vh/var(--lp-zoom,1))] ${styles.page}`}>
      {/* Landing ile aynı 1280px tasarım tuvali ve geniş ekran ölçeği. */}
      <LandingZoom />
      <LessonSetupHeader step={2} />

      <main className={styles.main}>
        <section aria-label="Katılım kodu" className={styles.codePanel}>
          <div className={styles.lessonHeading}>
            <span className={styles.badge}><span className={styles.badgeDot} /><span>Ders hazır</span></span>
            <span>{lesson.title} · {lesson.class_name} · {lesson.topic}</span>
          </div>
          <h1>Bu kodu sınıfa göster.</h1>
          <CodeTiles code={lesson.join_code} />
          <p className={styles.instructions}>Öğrenciler Apex&apos;te &quot;Derse katıl&quot;a girip bu kodu yazar. Ad ya da e-posta istenmez.</p>
          <div className={styles.codeActions}>
            <button type="button" className={styles.copyButton} onClick={copyCode}>
              {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              <span aria-live="polite">{copied ? "Kod kopyalandı" : "Kodu kopyala"}</span>
            </button>
          </div>
          {copyError && <p role="alert" className={styles.error}>{copyError}</p>}
        </section>

        <aside className={styles.aside}>
          <section aria-label="Ders ayarları" className={styles.settings}>
            <div className={styles.settingsHeading}>
              <h2>Ders</h2>
              <button type="button" className={styles.textButton} disabled={pending} onClick={editLesson}>Düzenle</button>
            </div>
            <dl className={styles.details}>
              <div><dt>Ders</dt><dd>{lesson.title}</dd></div>
              <div><dt>Sınıf</dt><dd>{lesson.class_name}</dd></div>
              <div><dt>Konu</dt><dd>{lesson.topic}</dd></div>
            </dl>
            <div className={styles.questionBox}>
              <button type="button" role="switch" aria-label="Soru kutusu" aria-checked={lesson.chatbot_enabled} disabled={pending} onClick={() => run(() => toggleAction(!lesson.chatbot_enabled))}>
                <span className={styles.switchTrack}><span /></span>
                <span className={styles.switchLabel}>Soru kutusu</span>
                <span className={styles.switchStatus}>{lesson.chatbot_enabled ? "Açık" : "Kapalı"}</span>
              </button>
              <span>Kapalıyken öğrenciler yeni soru yazamaz.</span>
            </div>
          </section>
          <button type="button" className={styles.startButton} disabled={pending} onClick={() => run(startAction)}>
            Dersi başlat<ArrowRight size={22} aria-hidden="true" />
          </button>
          <p className={styles.startNote}>Ders başlayınca sorular 5 dakikada bir konu kartlarına dönüşür ve Gelen Sorular panelinde birikir.</p>
          {error && <p role="alert" className={styles.error}>{error}</p>}
        </aside>
      </main>

      <dialog ref={editDialog} className={styles.editDialog} aria-labelledby="edit-title" onCancel={(event) => { if (pending) event.preventDefault(); }}>
        <form action={(data) => run(() => updateAction(data), () => editDialog.current?.close())}>
          <div className={styles.settingsHeading}>
            <h2 id="edit-title">Ders bilgisini düzenle</h2>
            <button type="button" className={styles.closeButton} aria-label="Düzenlemeyi kapat" disabled={pending} onClick={() => editDialog.current?.close()}><X size={22} /></button>
          </div>
          <label>Ders<input name="title" defaultValue={lesson.title} required maxLength={120} /></label>
          <label>Sınıf<input name="class_name" defaultValue={lesson.class_name} required maxLength={60} /></label>
          <label>Konu<input name="topic" defaultValue={lesson.topic} required maxLength={120} /></label>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <button type="submit" className={styles.startButton} disabled={pending}>{pending ? "Kaydediliyor…" : "Değişiklikleri kaydet"}</button>
        </form>
      </dialog>
    </div>
  );
}
