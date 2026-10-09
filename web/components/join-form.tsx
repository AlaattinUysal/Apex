"use client";

import { useActionState } from "react";
import { joinLesson } from "@/app/actions/join";

export function JoinForm() {
  const [state, action, pending] = useActionState(joinLesson, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="code" className="text-sm font-medium">
        Katılım kodu
      </label>
      <input
        id="code"
        name="code"
        required
        maxLength={6}
        autoComplete="off"
        autoCapitalize="characters"
        placeholder="ABC123"
        className="input text-center font-mono text-lg uppercase tracking-[0.3em]"
      />
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn">
        {pending ? "Katılınıyor…" : "Derse katıl"}
      </button>
    </form>
  );
}
