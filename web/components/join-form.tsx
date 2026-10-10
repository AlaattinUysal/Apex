"use client";

import { ArrowRight } from "lucide-react";
import { useActionState, useRef, useState, type KeyboardEvent } from "react";
import { joinLesson } from "@/app/actions/join";
import styles from "./join-page.module.css";

const normalize = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

export function JoinForm({ defaultCode = "" }: { defaultCode?: string }) {
  const [state, action, pending] = useActionState(joinLesson, undefined);
  const [characters, setCharacters] = useState(() => Array.from({ length: 6 }, (_, i) => normalize(defaultCode)[i] ?? ""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function focus(index: number) {
    inputs.current[Math.max(0, Math.min(5, index))]?.focus();
  }

  function write(index: number, raw: string) {
    if (pending) return;
    const value = normalize(raw);
    if (raw && !value) return;
    // Tam kod herhangi bir kutuya yapıştırılabilir veya otomatik doldurulabilir.
    const start = value.length === 6 ? 0 : index;
    setCharacters((previous) => {
      const next = [...previous];
      if (!value) next[index] = "";
      else [...value].forEach((character, offset) => { if (start + offset < 6) next[start + offset] = character; });
      return next;
    });
    if (value) focus(start + value.length);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (pending) return;
    if (event.key === "Backspace" && !characters[index] && index > 0) {
      event.preventDefault();
      setCharacters((previous) => previous.map((character, i) => i === index - 1 ? "" : character));
      focus(index - 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      focus(index + (event.key === "ArrowLeft" ? -1 : 1));
    }
  }

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="code" value={characters.join("")} />
      <div className={styles.codeField}>
        <span id="code-label" className={styles.codeLabel}>Ders kodu</span>
        <div role="group" aria-labelledby="code-label" aria-describedby="code-hint" className={styles.codeInputs}>
          {characters.map((character, index) => (
            <input
              key={index}
              ref={(element) => { inputs.current[index] = element; }}
              aria-label={`${index + 1}. karakter`}
              aria-describedby={state?.error ? "code-hint code-error" : "code-hint"}
              aria-invalid={state?.error ? true : undefined}
              type="text"
              inputMode="text"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={6}
              pattern="[A-Z0-9]"
              required
              readOnly={pending}
              value={character}
              data-filled={Boolean(character)}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => write(index, event.currentTarget.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              onPaste={(event) => { event.preventDefault(); write(index, event.clipboardData.getData("text")); }}
            />
          ))}
        </div>
        <span id="code-hint" className={styles.hint}>Harf ve rakam; büyük-küçük fark etmez.</span>
      </div>
      {state?.error && <p id="code-error" role="alert" className={styles.error}>{state.error}</p>}
      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Katılınıyor…" : "Derse katıl"}<ArrowRight size={22} aria-hidden="true" />
      </button>
    </form>
  );
}
