"use client";

import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { Maximize, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Feed, Frame, TopBar } from "@/components/teacher-live/stage";

// Öğrenci yalnızca izler: token'da yayın yetkisi yok. Alt köşede yalnızca ses ve tam ekran düğmesi var.
export function StudentStage({
  token,
  serverUrl,
  startedAt,
}: {
  token: string;
  serverUrl: string;
  startedAt: string | null;
}) {
  // Sayfa yenilenince sunucu yeni token üretir; bağlantı kopmasın diye ilk token sabit tutulur.
  const [stableToken] = useState(token);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const router = useRouter();

  const btn = "inline-flex size-11 items-center justify-center rounded-full text-ink";

  return (
    <LiveKitRoom
      token={stableToken}
      serverUrl={serverUrl}
      connect
      video={false}
      audio={false}
      data-lk-theme="default"
      className="contents"
      onError={(e) => setError(e.message)}
      // Öğretmen dersi bitirip odayı kapatınca düşer; sunucudan güncel durumu (ders bitti) al.
      onDisconnected={() => router.refresh()}
    >
      <Frame>
        <TopBar startedAt={startedAt} />
        <Feed error={error} title="Canlı ders" hint="Öğretmenin görüntüsü bekleniyor…" />
        <div className="relative z-10 flex gap-2.5 self-end rounded-full border-[1.5px] border-ink bg-surface p-2">
          <button
            type="button"
            aria-label="Sesi aç / kapat"
            aria-pressed={!muted}
            onClick={() => setMuted((m) => !m)}
            className={`${btn} ${muted ? "bg-sunken" : "bg-brand-tint"}`}
          >
            {muted ? <VolumeX size={20} strokeWidth={2} aria-hidden="true" /> : <Volume2 size={20} strokeWidth={2} aria-hidden="true" />}
          </button>
          <button
            type="button"
            aria-label="Tam ekran"
            onClick={(e) => {
              const section = e.currentTarget.closest("section");
              if (document.fullscreenElement) void document.exitFullscreen();
              else void section?.requestFullscreen?.();
            }}
            className={`${btn} bg-sunken`}
          >
            <Maximize size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <RoomAudioRenderer volume={muted ? 0 : 1} />
      </Frame>
    </LiveKitRoom>
  );
}
