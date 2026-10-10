"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/actions/auth";

const field =
  "min-h-14 w-full rounded-2xl border-[1.5px] border-ink bg-surface px-4 text-base leading-6 font-medium text-ink outline-none placeholder:text-line-strong focus:shadow-brand-5";

export function AuthForm({ next = "/dashboard" }: { next?: "/create" | "/dashboard" }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, action, pending] = useActionState(mode === "signin" ? signIn : signUp, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-bold tracking-[0.02em] text-ink-muted">
          E-posta
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="ornek@okul.edu.tr" className={field} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-bold tracking-[0.02em] text-ink-muted">
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="En az 8 karakter"
          className={field}
        />
      </div>
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
        {pending ? "Bekleyin…" : mode === "signin" ? "Giriş yap" : "Kayıt ol"}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="min-h-11 text-sm font-semibold text-ink-muted underline underline-offset-4"
      >
        {mode === "signin" ? "Hesabın yok mu? Kayıt ol" : "Hesabın var mı? Giriş yap"}
      </button>
    </form>
  );
}
