import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { CreateLessonForm } from "@/components/create-lesson-form";
import { getTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL = { draft: "Taslak", live: "Canlı", ended: "Bitti" } as const;

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <Suspense fallback={<p className="text-muted">Yükleniyor…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const teacher = await getTeacher();
  if (!teacher) redirect("/login");

  // RLS: yalnızca bu öğretmenin dersleri döner.
  const supabase = await createClient();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, class_name, topic, join_code, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <span className="font-mono text-sm font-semibold tracking-widest text-accent">APEX</span>
          <h1 className="text-2xl font-semibold">Derslerim</h1>
        </div>
        <form action={signOut}>
          <button className="btn-ghost">Çıkış yap</button>
        </form>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Yeni ders</h2>
        <CreateLessonForm />
      </section>

      <section className="flex flex-col gap-3">
        {lessons?.length ? (
          lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/live/${lesson.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition hover:border-accent"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{lesson.title}</p>
                <p className="truncate text-sm text-muted">
                  {lesson.class_name} · {lesson.topic}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-md bg-border/60 px-2 py-1 font-mono text-sm tracking-widest">
                  {lesson.join_code}
                </span>
                <span className="text-sm text-muted">
                  {STATUS_LABEL[lesson.status as keyof typeof STATUS_LABEL]}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted">Henüz ders yok. Yukarıdan ilk dersini oluştur.</p>
        )}
      </section>
    </>
  );
}
