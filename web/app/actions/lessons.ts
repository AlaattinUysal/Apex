"use server";

import { randomInt } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { closeRoom, isLiveKitConfigured } from "@/lib/livekit";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./auth";

// 0/O ve 1/I gibi karışan karakterler yok.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateJoinCode() {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function createLesson(_: FormState, formData: FormData): Promise<FormState> {
  const title = field(formData, "title");
  const className = field(formData, "class_name");
  const topic = field(formData, "topic");
  if (!title || !className || !topic) return { error: "Ders adı, sınıf ve konu gerekli." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/create");

  // join_code benzersiz; çakışırsa yeni kodla birkaç kez dene.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("lessons")
      .insert({
        teacher_id: auth.user.id,
        title,
        class_name: className,
        topic,
        join_code: generateJoinCode(),
      })
      .select("id")
      .single();

    if (data) redirect(`/live/${data.id}`);
    if (error?.code !== "23505") return { error: "Ders oluşturulamadı: " + error?.message };
  }
  return { error: "Katılım kodu üretilemedi, tekrar dene." };
}

// Ders durumu: draft -> live -> ended. RLS, yalnızca dersin sahibine izin verir.
export async function setLessonStatus(lessonId: string, status: "live" | "ended") {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("lessons")
    .update(status === "live" ? { status, started_at: now } : { status, ended_at: now })
    .eq("id", lessonId)
    .select("room_name")
    .maybeSingle();

  if (status === "ended") {
    // Odayı kapat: öğrencilerin video bağlantısı kopar ve ekranları "Ders sona erdi"ye döner.
    if (data && isLiveKitConfigured()) await closeRoom(data.room_name).catch(() => {});
    redirect("/create");
  }

  refresh();
}

export async function setChatbotEnabled(lessonId: string, enabled: boolean) {
  const supabase = await createClient();
  await supabase.from("lessons").update({ chatbot_enabled: enabled }).eq("id", lessonId);
  refresh();
}

// Hazırlık ekranı yalnızca öğretmenin kendi taslak dersini değiştirebilir.
async function updateDraft(lessonId: string, values: {
  title?: string;
  class_name?: string;
  topic?: string;
  chatbot_enabled?: boolean;
  status?: "live";
  started_at?: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Oturumun sona erdi. Yeniden giriş yap." };

  const { data, error } = await supabase
    .from("lessons")
    .update(values)
    .eq("id", lessonId)
    .eq("teacher_id", auth.user.id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error) return { error: "Değişiklik kaydedilemedi. Lütfen tekrar dene." };
  if (!data) return { error: "Ders bulunamadı veya artık hazırlık aşamasında değil. Sayfayı yenile." };
  refresh();
  return {};
}

export async function updateDraftLesson(lessonId: string, formData: FormData) {
  const title = field(formData, "title");
  const className = field(formData, "class_name");
  const topic = field(formData, "topic");
  if (!title || !className || !topic) return { error: "Ders adı, sınıf ve konu gerekli." };
  if (title.length > 120 || className.length > 60 || topic.length > 120) {
    return { error: "Ders adı ve konu en fazla 120, sınıf en fazla 60 karakter olabilir." };
  }
  return updateDraft(lessonId, { title, class_name: className, topic });
}

export async function setDraftQuestionBox(lessonId: string, enabled: boolean) {
  if (typeof enabled !== "boolean") return { error: "Soru kutusu ayarı geçersiz." };
  return updateDraft(lessonId, { chatbot_enabled: enabled });
}

export async function startDraftLesson(lessonId: string) {
  return updateDraft(lessonId, { status: "live", started_at: new Date().toISOString() });
}
