import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CreateLessonForm } from "@/components/create-lesson-form";
import { LandingZoom } from "@/components/landing/landing-zoom";
import { LessonSetupHeader } from "@/components/lesson-ready/lesson-setup-header";
import styles from "@/components/lesson-ready/lesson-ready.module.css";
import { getTeacher } from "@/lib/auth";

export const metadata: Metadata = { title: "Ders oluştur — Apex" };

export default function CreatePage() {
  return (
    <div className={`lp-zoom min-h-[calc(100vh/var(--lp-zoom,1))] ${styles.page}`}>
      <LandingZoom />
      <LessonSetupHeader step={1} />
      <main className={styles.main}>
        <Suspense fallback={<p className={styles.instructions}>Yükleniyor…</p>}>
          <CreateLesson />
        </Suspense>
      </main>
    </div>
  );
}

async function CreateLesson() {
  if (!(await getTeacher())) redirect("/login?next=/create");
  return <CreateLessonForm />;
}
