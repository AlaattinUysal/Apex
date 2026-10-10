import { ArrowRight, X } from "lucide-react";
import { Bullet, Code } from "./ui";

// Hero altındaki "sahne" kartı: solda öğrenci mesajları, ortada 5:00 oku, sağda öğretmenin gördüğü özet.
// Not: özet kartındaki "3 mesaj · 1 mesaj elendi" yalnızca bu tanıtım görselinin parçasıdır.
export function HeroStage() {
  return (
    <div className="flex w-full flex-wrap items-center gap-7 rounded-[28px] border-[1.5px] border-ink bg-surface p-5 shadow-hard-8 sm:p-10">
      {/* a) Öğrencilerden gelen mesajlar */}
      <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-3">
        <span className="text-[13px] leading-[18px] font-bold tracking-[0.02em] text-ink-muted">Öğrencilerden gelen mesajlar</span>
        <div className="box-content max-w-[92%] -rotate-[1.5deg] self-start rounded-[18px_18px_18px_6px] border-[1.5px] border-ink bg-brand-tint px-3.5 py-2.5 text-base leading-[22px] font-medium">
          hocam for ile listeyi gezerken IndexError alıyorum neden
        </div>
        <div className="box-content max-w-[92%] rotate-1 self-end rounded-[18px_18px_6px_18px] border-[1.5px] border-ink bg-sunken px-3.5 py-2.5 text-base leading-[22px] font-medium">
          listeye liste eklerken append mi extend mi
        </div>
        <div className="box-content max-w-[92%] -rotate-[0.5deg] self-start rounded-[18px_18px_18px_6px] border-[1.5px] border-ink bg-brand-tint px-3.5 py-2.5 text-base leading-[22px] font-medium">
          son elemana nasıl ulaşıyoruz, len()-1 mi?
        </div>
        <div className="flex flex-col items-end gap-1 self-end">
          <div className="box-content max-w-full rounded-[18px_18px_6px_18px] border-[1.5px] border-dashed border-line-strong px-3.5 py-2.5 text-base leading-[22px] font-medium text-ink-muted line-through">
            boş yapma hoca ders çok sıkıcı
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs leading-4 font-semibold text-ink-muted">
            <X size={14} strokeWidth={2.5} aria-hidden="true" />
            Öğretmene gitmez
          </span>
        </div>
      </div>

      {/* b) 5:00 oku */}
      <div className="flex min-w-0 flex-[0_1_120px] flex-col items-center gap-2">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-brand text-white">
          <ArrowRight size={30} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <span className="font-mono text-sm leading-5 font-semibold">5:00</span>
        <span className="text-center text-xs leading-4 font-medium text-ink-muted">her turda</span>
      </div>

      {/* c) Öğretmenin gördüğü */}
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3">
        <span className="text-[13px] leading-[18px] font-bold tracking-[0.02em] text-ink-muted">Öğretmenin gördüğü</span>
        <article className="flex flex-col gap-3.5 rounded-[20px] border-[1.5px] border-ink bg-surface p-[22px] shadow-brand-5">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-xl leading-[26px] font-semibold">Sınıfın soruları</span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[13px] leading-[18px] font-semibold">
              <span className="size-[9px] rounded-full bg-badge" />
              Güncellendi <span className="font-mono">02:20</span>
            </span>
          </div>
          <h3 className="flex items-center gap-2.5 text-[17px] leading-[22px] font-bold text-brand">
            <span className="size-2.5 rounded-[3px] bg-brand" />
            Listeler ve indeksleme
          </h3>
          <ul className="flex list-none flex-col gap-2.5 p-0">
            <Bullet className="text-[15px] leading-[23px]">
              Döngüde <Code>range(len(liste))</Code> kullanırken alınan IndexError hatasının sebebi ve son elemana erişim soruldu.
            </Bullet>
            <Bullet className="text-[15px] leading-[23px]">
              <Code>append()</Code> ile <Code>extend()</Code> arasındaki fark merak edildi.
            </Bullet>
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-ink/15 pt-3">
            <span className="text-[13px] leading-[18px] font-medium text-ink-muted">3 mesaj · 1 mesaj elendi</span>
            <span
              className="inline-flex min-h-9 items-center rounded-full border-[1.5px] border-brand bg-brand px-3.5 text-sm leading-5 font-semibold text-white"
              aria-hidden="true"
            >
              Cevaplandı
            </span>
          </div>
        </article>
      </div>
    </div>
  );
}
