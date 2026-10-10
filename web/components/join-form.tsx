"use client";

import { useActionState } from "react";
import { joinLesson } from "@/app/actions/join";

export function JoinForm({ defaultCode = "" }: { defaultCode?: string }) {
  const [state, action, pending] = useActionState(joinLesson, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label htmlFor="code" className="text-sm font-bold tracking-[0.02em] text-ink-muted">
        Katılım kodu
      </label>
      <input
        id="code"
        name="code"
        required
        maxLength={6}
        defaultValue={defaultCode}
        autoComplete="off"
        autoCapitalize="characters"
        placeholder="ABC123"
        className="min-h-14 w-full rounded-2xl border-[1.5px] border-ink bg-surface px-4 text-center font-mono text-2xl leading-8 font-semibold tracking-[0.35em] text-ink uppercase outline-none placeholder:text-line-strong/60 focus:shadow-brand-5"
      />
      {state?.error && (
        <p role="alert" className="text-sm font-semibold text-badge">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-[52px] items-center justify-center rounded-full border-[1.5px] border-brand bg-brand px-7 text-base leading-6 font-semibold text-white transition-transform hover:-translate-y-px disabled:opacity-60"
      >
        {pending ? "Katılınıyor…" : "Derse katıl"}
      </button>
    </form>
  );
}
