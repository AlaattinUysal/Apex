"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/actions/auth";

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, action, pending] = useActionState(mode === "signin" ? signIn : signUp, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="E-posta"
        className="input"
      />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete={mode === "signin" ? "current-password" : "new-password"}
        placeholder="Şifre (en az 8 karakter)"
        className="input"
      />
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn">
        {pending ? "Bekleyin…" : mode === "signin" ? "Giriş yap" : "Kayıt ol"}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="text-sm text-muted hover:text-foreground"
      >
        {mode === "signin" ? "Hesabın yok mu? Kayıt ol" : "Hesabın var mı? Giriş yap"}
      </button>
    </form>
  );
}
