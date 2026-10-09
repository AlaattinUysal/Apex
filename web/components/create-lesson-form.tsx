"use client";

import { useActionState } from "react";
import { createLesson } from "@/app/actions/lessons";

export function CreateLessonForm() {
  const [state, action, pending] = useActionState(createLesson, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input name="title" required maxLength={120} placeholder="Ders adı (ör. Denklemler 1)" className="input" />
      <div className="grid grid-cols-2 gap-3">
        <input name="class_name" required maxLength={60} placeholder="Sınıf (ör. 8-A)" className="input" />
        <input name="topic" required maxLength={120} placeholder="Konu (ör. Denklemler)" className="input" />
      </div>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn">
        {pending ? "Oluşturuluyor…" : "Ders oluştur"}
      </button>
    </form>
  );
}
