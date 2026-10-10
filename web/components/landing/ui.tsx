import { Check } from "lucide-react";
import type { ReactNode } from "react";

// Landing'in ortak parçaları: düğme sınıfları, ön etiket (eyebrow), kod etiketi, madde satırları.

const pillBase =
  "inline-flex items-center justify-center rounded-full border-[1.5px] font-semibold no-underline transition-transform hover:-translate-y-px";

/** Birincil hap düğme: yeşil zemin, beyaz yazı. */
export const btnPrimary = `${pillBase} border-brand bg-brand text-white`;
/** İkincil hap düğme: yüzey zemini, ink kenar. */
export const btnSecondary = `${pillBase} border-ink bg-surface text-ink`;
/** Açık yeşil hap düğme (kapanış bölümündeki "Derse katıl"). */
export const btnTint = `${pillBase} border-ink bg-brand-tint text-ink`;

/** Küçük hap: kenar ink, zemin surface, 13px yarı kalın. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-surface px-3.5 py-1.5 text-[13px] leading-[18px] font-semibold text-ink ${className}`}
    >
      {children}
    </span>
  );
}

/** Kod ifadesi: JetBrains Mono 13px, sunken zemin, 6px köşe. */
export function Code({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-sunken px-1.5 py-px font-mono text-[13px] leading-5 font-medium">{children}</code>;
}

/** Yeşil daire içinde tik ikonlu madde. */
export function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex size-[26px] flex-none items-center justify-center rounded-full bg-brand text-white">
        <Check size={15} strokeWidth={3} aria-hidden="true" />
      </span>
      <span className="text-base leading-6 font-medium">{children}</span>
    </li>
  );
}

/** Küçük siyah noktalı madde satırı. */
export function Bullet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <li className={`flex gap-2.5 font-medium ${className}`}>
      <span className="mt-[9px] size-1.5 flex-none rounded-full bg-ink" />
      <span>{children}</span>
    </li>
  );
}
