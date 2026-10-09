import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { setLessonStatus } from "@/app/actions/lessons";
import { AutoRefresh } from "@/components/auto-refresh";
import { LiveRoom } from "@/components/live-room";
import type { Summary } from "@/lib/ai-client";
import { StudentChat } from "@/components/student-chat";
import { TeacherPanel } from "@/components/teacher-panel";
import { TIMEOUT_RULES } from "@/lib/config";
import { getTeacher } from "@/lib/auth";
import { createRoomToken, isLiveKitConfigured, type LiveRole } from "@/lib/livekit";
import { getParticipantId } from "@/lib/participant";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LESSON_COLUMNS = "id, title, class_name, topic, join_code, status, chatbot_enabled, room_name";
// Özet yalnızca öğretmen sorgusuna girer; öğrenci tarafına hiç çekilmez.
const TEACHER_COLUMNS = `${LESSON_COLUMNS}, summary, summary_updated_at`;

type Lesson = {
  id: string;
  title: string;
  class_name: string;
  topic: string;
  join_code: string;
  status: string;
  chatbot_enabled: boolean;
  room_name: string;
  summary?: Summary | null;
  summary_updated_at?: string | null;
};

export default function LivePage({ params }: PageProps<"/live/[lessonId]">) {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Yükleniyor…</p>}>
      <Live params={params} />
    </Suspense>
  );
}

async function Live({ params }: { params: PageProps<"/live/[lessonId]">["params"] }) {
  const { lessonId } = await params;
  if (!UUID.test(lessonId)) notFound();

  // Rol tespiti: önce öğretmen (RLS yalnızca kendi dersini döner), sonra öğrenci (çerezdeki token).
  const teacher = await getTeacher();
  if (teacher) {
    const supabase = await createClient();
    const { data } = await supabase.from("lessons").select(TEACHER_COLUMNS).eq("id", lessonId).maybeSingle();
    if (data) return <TeacherView lesson={data} identity={`teacher:${teacher.id}`} />;
  }

  const participantId = await getParticipantId(lessonId);
  if (participantId) {
    const { data } = await createAdminClient()
      .from("lessons")
      .select(LESSON_COLUMNS)
      .eq("id", lessonId)
      .maybeSingle();
    if (data) return <StudentView lesson={data} participantId={participantId} />;
  }

  redirect("/");
}

function VideoPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-border bg-card text-center">
      <p className="px-6 text-sm text-muted">{message}</p>
    </div>
  );
}

// Video yalnızca ders canlıyken bağlanır. Yetki (yayın/izleme) token'da, sunucuda belirlenir.
async function VideoArea({ lesson, role, identity }: { lesson: Lesson; role: LiveRole; identity: string }) {
  if (lesson.status === "ended") return <VideoPlaceholder message="Ders sona erdi." />;
  if (lesson.status !== "live") {
    return <VideoPlaceholder message={role === "teacher" ? "Yayını açmak için dersi başlat." : "Ders henüz başlamadı. Başlayınca otomatik bağlanacaksın."} />;
  }
  if (!isLiveKitConfigured()) return <VideoPlaceholder message="Video yapılandırılmamış (LIVEKIT_* değişkenleri eksik)." />;

  const { token, serverUrl } = await createRoomToken({ room: lesson.room_name, identity, role });
  return <LiveRoom token={token} serverUrl={serverUrl} canPublish={role === "teacher"} />;
}

function RoleBadge({ label }: { label: string }) {
  return (
    <span className="mb-1 inline-block rounded-md bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
      {label}
    </span>
  );
}

async function TeacherView({ lesson, identity }: { lesson: Lesson; identity: string }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
            ← Derslerim
          </Link>
          <RoleBadge label="Öğretmen görünümü" />
          <h1 className="text-2xl font-semibold">{lesson.title}</h1>
          <p className="text-sm text-muted">
            {lesson.class_name} · {lesson.topic}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-center">
            <p className="text-xs text-muted">Katılım kodu</p>
            <p className="font-mono text-xl font-semibold tracking-[0.25em]">{lesson.join_code}</p>
          </div>
          {lesson.status === "draft" && (
            <form action={setLessonStatus.bind(null, lesson.id, "live")}>
              <button className="btn">Dersi başlat</button>
            </form>
          )}
          {lesson.status === "live" && (
            <form action={setLessonStatus.bind(null, lesson.id, "ended")}>
              <button className="btn-ghost">Dersi bitir</button>
            </form>
          )}
        </div>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <VideoArea lesson={lesson} role="teacher" identity={identity} />

        <TeacherPanel
          lessonId={lesson.id}
          summary={lesson.summary ?? null}
          summaryUpdatedAt={lesson.summary_updated_at ?? null}
          chatbotEnabled={lesson.chatbot_enabled}
          isLive={lesson.status === "live"}
        />
      </div>
    </div>
  );
}

async function StudentView({ lesson, participantId }: { lesson: Lesson; participantId: string }) {
  const admin = createAdminClient();

  // Öğrenci yalnızca KENDİ mesajlarını görür (başkalarınınkini değil); durum/ret bilgisi gösterilmez.
  const { data: messages } = await admin
    .from("student_messages")
    .select("id, original_text")
    .eq("participant_id", participantId)
    .order("created_at");

  // Abuse veya spam nedeniyle 5 dakikalık kısıtlama kontrolü
  const banCutoff = new Date(Date.now() - TIMEOUT_RULES.abuseSpamBanMs).toISOString();
  const { data: recentBan } = await admin
    .from("student_messages")
    .select("processed_at")
    .eq("lesson_id", lesson.id)
    .eq("participant_id", participantId)
    .eq("status", "rejected")
    .in("reject_label", ["abuse", "spam"])
    .gt("processed_at", banCutoff)
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const banUntil = recentBan?.processed_at
    ? new Date(recentBan.processed_at).getTime() + TIMEOUT_RULES.abuseSpamBanMs
    : null;

  // Soru alımı kapalıyken kutu BİLEREK kapatılmaz: reddetme yalnızca sunucuda yapılır
  // (öğretmen kapatınca açık kalmış sayfalar da aynı şekilde reddedilir). Yalnızca ders canlı değilse kapalı.
  const blockedReason =
    lesson.status === "live"
      ? null
      : lesson.status === "ended"
        ? "Ders sona erdi."
        : "Ders başlayınca soru yazabilirsin.";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      {/* Yalnızca ders başlamayı beklerken yenile; canlıyken video bileşenini sıfırlamasın. */}
      {lesson.status === "draft" && <AutoRefresh />}
      <header>
        <RoleBadge label="Öğrenci görünümü" />
        <h1 className="text-2xl font-semibold">{lesson.title}</h1>
        <p className="text-sm text-muted">
          {lesson.class_name} · {lesson.topic}
        </p>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <VideoArea lesson={lesson} role="student" identity={`student:${participantId}`} />

        <aside className="flex h-[34rem] max-h-[85vh] flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Sorularım</h2>
          <StudentChat
            lessonId={lesson.id}
            messages={(messages ?? []).map((m) => ({ id: m.id, text: m.original_text }))}
            blockedReason={blockedReason}
            banUntil={banUntil}
          />
        </aside>
      </div>
    </div>
  );
}
