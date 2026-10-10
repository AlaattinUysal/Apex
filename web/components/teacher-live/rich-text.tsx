import type { ReactNode } from "react";

// Özet metnindeki kod ifadelerini mono etiket (sunken zemin, 6px köşe) olarak çizer.
// Önce `ters tırnak` içindekiler; yoksa append(), range(len(liste)) gibi çağrı biçimleri kod sayılır.
const CODE = /(`[^`]+`|[A-Za-z_][\w.]*\((?:[^()]|\([^()]*\))*\))/g;

const chip = "rounded-md bg-sunken px-1.5 py-px font-mono text-[13px] leading-5 font-medium";

export function RichText({ text }: { text: string }): ReactNode {
  return text.split(CODE).map((part, i) => {
    if (i % 2 === 0) return part;
    const code = part.startsWith("`") ? part.slice(1, -1) : part;
    return (
      <code key={i} className={chip}>
        {code}
      </code>
    );
  });
}
