const ITEMS = ["Ad yok", "E-posta yok", "Ses yok", "Ham mesaj yok", "5 dakikada bir özet"];

// Kömür renkli güven şeridi (tam genişlik).
export function TrustStrip() {
  return (
    <div className="bg-charcoal">
      <ul className="mx-auto flex max-w-[1200px] list-none flex-wrap items-center justify-center gap-x-7 gap-y-3 px-5 py-5 sm:px-8">
        {ITEMS.map((t) => (
          <li key={t} className="inline-flex items-center gap-2.5 text-base leading-6 font-semibold text-paper">
            <span className="size-2 rounded-full bg-brand-tint" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
