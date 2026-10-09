"use client";

import {
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
  isTrackReference,
  VideoTrack,
  useConnectionState,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Tasarım sonradan değişecek. Burada yalnızca ROL AYRIMI önemli:
// - Öğretmen: kamera/mikrofon/ekran paylaşımı düğmeleri var, yayın yapar.
// - Öğrenci: hiç kontrol yok, yalnızca izler. (Asıl engel token'da: canPublish=false.)
// LiveKit'in kendi sohbeti kullanılmaz; sorular bizim chatbot'umuzdan gider.
export function LiveRoom({
  token,
  serverUrl,
  canPublish,
}: {
  token: string;
  serverUrl: string;
  canPublish: boolean;
}) {
  // Sayfa yenilenince (AutoRefresh, sunucu eylemleri) sunucu yeni token üretir; LiveKitRoom token
  // değişince bağlantıyı koparıp yeniden kurar. İlk token'ı sabit tutarak bunu önlüyoruz.
  const [stableToken] = useState(token);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div
      className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black"
      data-lk-theme="default"
    >
      <LiveKitRoom
        token={stableToken}
        serverUrl={serverUrl}
        connect
        video={canPublish}
        audio={canPublish}
        className="flex h-full flex-col"
        onError={(e) => setError(e.message)}
        // Öğretmen dersi bitirip odayı kapatınca düşer; sunucudan güncel durumu (ders bitti) al.
        onDisconnected={() => router.refresh()}
        onMediaDeviceFailure={() => setError("Kamera/mikrofon açılamadı (izin veya cihaz).")}
      >
        <Stage error={error} />
        <RoomAudioRenderer />
        {canPublish && (
          <ControlBar
            variation="minimal"
            controls={{ microphone: true, camera: true, screenShare: true, chat: false, settings: false, leave: false }}
          />
        )}
      </LiveKitRoom>
    </div>
  );
}

// Ekran paylaşımı varken ekran sahneyi kaplar, öğretmenin kamerası sol üstte küçük kutuda durur.
// Paylaşım yoksa kamera sahneyi kaplar. Alttaki durum satırı geçici (bağlantı teşhisi için).
function Stage({ error }: { error: string | null }) {
  const tracks = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: false },
    { source: Track.Source.Camera, withPlaceholder: false },
  ]);
  const connection = useConnectionState();
  // Yalnızca gerçek (yayını olan) kayıtlar; yer tutucular elenir.
  const published = tracks.filter(isTrackReference);
  const screen = published.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = published.find((t) => t.source === Track.Source.Camera);
  // Kamera kapalıyken yayın kaydı durur ama "muted" olarak kalır; siyah kutu yerine yok sayılır.
  const camera = cameraTrack && !cameraTrack.publication.isMuted ? cameraTrack : undefined;
  const main = screen ?? camera;

  return (
    <>
      <div className="relative min-h-0 flex-1">
        {main ? (
          // Etiketsiz ham video: kimlik yazısı ve bağlantı simgesi çizilmez.
          <VideoTrack
            trackRef={main}
            className={`h-full w-full ${main === screen ? "object-contain" : "object-cover"}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/70">
            {cameraTrack ? "Öğretmenin kamerası kapalı." : "Öğretmenin görüntüsü bekleniyor…"}
          </div>
        )}
        {screen && camera && (
          <div className="absolute left-3 top-3 w-40 overflow-hidden rounded-lg shadow-lg ring-1 ring-white/20">
            <VideoTrack trackRef={camera} className="aspect-video w-full object-cover" />
          </div>
        )}
      </div>
      <p className="px-3 py-1 font-mono text-[11px] text-white/50">
        bağlantı: {connection} · yayın: {tracks.length}
        {error ? ` · hata: ${error}` : ""}
      </p>
    </>
  );
}
