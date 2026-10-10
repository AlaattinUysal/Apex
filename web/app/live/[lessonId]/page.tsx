import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { setDraftQuestionBox, startDraftLesson, updateDraftLesson } from "@/app/actions/lessons";
import { AutoRefresh } from "@/components/auto-refresh";
import { LessonReady } from "@/components/lesson-ready/lesson-ready";
import type { Summary } from "@/lib/ai-client";
import { StudentHeader } from "@/components/student-live/header";
import { StudentChat } from "@/components/student-live/chat";
import { StudentStage } from "@/components/student-live/stage";
import { TeacherHeader } from "@/components/teacher-live/header";
import { TeacherPanel } from "@/components/teacher-live/panel";
import { StageIdle, TeacherStage } from "@/components/teacher-live/stage";
import { TIMEOUT_RULES } from "@/lib/config";
import { getTeacher } from "@/lib/auth";
import { createRoomToken, isLiveKitConfigured } from "@/lib/livekit";
import { getParticipantId } from "@/lib/participant";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LESSON_COLUMNS = "id, title, class_name, topic, join_code, status, chatbot_enabled, room_name, started_at";
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
  started_at?: string | null;
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

// Saf olmayan saat okuması bileşen gövdesinin dışında kalsın (React purity kuralı).
const banCutoffIso = () => new Date(Date.now() - TIMEOUT_RULES.abuseSpamBanMs).toISOString();

async function TeacherView({ lesson, identity }: { lesson: Lesson; identity: string }) {
  if (lesson.status === "draft") {
    return (
      <LessonReady
        lesson={{ title: lesson.title, class_name: lesson.class_name, topic: lesson.topic, join_code: lesson.join_code, chatbot_enabled: lesson.chatbot_enabled }}
        startAction={startDraftLesson.bind(null, lesson.id)}
        toggleAction={setDraftQuestionBox.bind(null, lesson.id)}
        updateAction={updateDraftLesson.bind(null, lesson.id)}
      />
    );
  }

  const live = lesson.status === "live";
  const room = live && isLiveKitConfigured() ? await createRoomToken({ room: lesson.room_name, identity, role: "teacher" }) : null;
  const idleMessage =
    lesson.status === "ended"
      ? "Ders sona erdi."
      : live
        ? "Video yapılandırılmamış (LIVEKIT_* değişkenleri eksik)."
        : "Yayını açmak için dersi başlat.";

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink min-[1100px]:h-screen">
      <TeacherHeader lesson={lesson} />
      <div className="flex min-h-0 flex-1 flex-wrap gap-5 p-5 min-[1100px]:flex-nowrap">
        {room ? (
          <TeacherStage token={room.token} serverUrl={room.serverUrl} startedAt={lesson.started_at ?? null} />
        ) : (
          <StageIdle message={idleMessage} />
        )}
        <TeacherPanel
          lessonId={lesson.id}
          summary={lesson.summary ?? null}
          summaryUpdatedAt={lesson.summary_updated_at ?? null}
          startedAt={lesson.started_at ?? null}
          isLive={live}
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
  const banCutoff = banCutoffIso();
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

  const live = lesson.status === "live";
  const room =
    live && isLiveKitConfigured()
      ? await createRoomToken({ room: lesson.room_name, identity: `student:${participantId}`, role: "student" })
      : null;
  const idleMessage =
    lesson.status === "ended"
      ? "Ders sona erdi."
      : live
        ? "Video yapılandırılmamış (LIVEKIT_* değişkenleri eksik)."
        : "Ders henüz başlamadı. Başlayınca otomatik bağlanacaksın.";

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink min-[1100px]:h-screen">
      {/* Yalnızca ders başlamayı beklerken yenile; canlıyken video bileşenini sıfırlamasın. */}
      {lesson.status === "draft" && <AutoRefresh />}
      <StudentHeader label={`${lesson.title} · ${lesson.class_name} · ${lesson.topic}`} />
      <div className="flex min-h-0 flex-1 flex-wrap gap-5 p-5 min-[1100px]:flex-nowrap">
        {room ? (
          <StudentStage token={room.token} serverUrl={room.serverUrl} startedAt={lesson.started_at ?? null} />
        ) : (
          <StageIdle title="Canlı ders" message={idleMessage} />
        )}
        <StudentChat
          lessonId={lesson.id}
          messages={(messages ?? []).map((m) => ({ id: m.id, text: m.original_text }))}
          blockedReason={blockedReason}
          banUntil={banUntil}
          startedAt={lesson.started_at ?? null}
          isLive={live}
        />
      </div>
    </div>
  );
}
