"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PARTICIPANT_COOKIE,
  PARTICIPANT_TTL_SECONDS,
  hashToken,
  newParticipantToken,
} from "@/lib/participant";
import type { FormState } from "./auth";

// Öğrenci kodla girer: isim/e-posta yok, rastgele token'lı anonim oturum açılır.
// Token httpOnly çerezde, DB'de yalnızca SHA-256 özeti tutulur.
export async function joinLesson(_: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "").replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return { error: "Katılım kodu 6 karakter olmalı." };

  const admin = createAdminClient();
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, status")
    .eq("join_code", code)
    .maybeSingle();

  if (!lesson) return { error: "Bu kodla bir ders bulunamadı." };
  if (lesson.status === "ended") return { error: "Bu ders sona erdi." };

  const token = newParticipantToken();
  const { error } = await admin
    .from("lesson_participants")
    .insert({ lesson_id: lesson.id, token_hash: hashToken(token) });
  if (error) return { error: "Derse katılınamadı, tekrar dene." };

  (await cookies()).set(PARTICIPANT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PARTICIPANT_TTL_SECONDS,
  });

  redirect(`/live/${lesson.id}`);
}
