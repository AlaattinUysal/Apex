"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  isTrackReference,
  useTracks,
  useTrackToggle,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { Mic, MicOff, Monitor, Video, VideoOff, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const SECTION =
  "relative flex min-h-[560px] min-w-0 flex-[999_1_600px] flex-col justify-between overflow-hidden rounded-[28px] border-[1.5px] border-ink bg-charcoal bg-[radial-gradient(#363b39_2px,transparent_2.5px)] bg-[length:22px_22px] p-5 shadow-hard-8";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Dersin başlangıcından bu yana geçen süre (SS:DD:ss). Sunucu/istemci saati farkı olmasın diye yalnızca istemcide çizilir.
function Elapsed({ since }: { since: string }) {
  const [text, setText] = useState("00:00:00");
  useEffect(() => {
    const start = new Date(since).getTime();
    const tick = () => {
      const s = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setText(`${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);
  return <>{text}</>;
}

function TopBar({ startedAt }: { startedAt: string | null }) {
  return (
    <div className="relative z-10 flex flex-wrap items-center gap-2.5">
      <span className="inline-flex items-center gap-2 rounded-full bg-brand px-3.5 py-1.5 text-[13px] leading-[18px] font-bold text-white">
        <span className="size-2 rounded-full bg-brand-tint" />
        Canlı
      </span>
      {startedAt && (
        <span
          className="rounded-full bg-paper/12 backdrop-blur-md px-3 py-1.5 font-mono text-sm leading-[18px] font-semibold text-paper"
          suppressHydrationWarning
        >
          <Elapsed since={startedAt} />
        </span>
      )}
    </div>
  );
}

function Placeholder({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-1.5 self-center text-center">
      <span className="font-display text-[22px] leading-7 font-semibold text-paper">{title}</span>
      <span className="text-sm leading-5 font-medium text-brand-tint">{hint}</span>
    </div>
  );
}

function ToggleButton({
  source,
  label,
  on: OnIcon,
  off: OffIcon,
}: {
  source: Track.Source.Microphone | Track.Source.Camera | Track.Source.ScreenShare;
  label: string;
  on: LucideIcon;
  off: LucideIcon;
}) {
  const { toggle, enabled, pending } = useTrackToggle({ source });
  const Icon = enabled ? OnIcon : OffIcon;
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={enabled}
      disabled={pending}
      onClick={() => void toggle()}
      className={`inline-flex size-11 items-center justify-center rounded-full text-ink disabled:opacity-60 ${enabled ? "bg-brand-tint" : "bg-sunken"}`}
    >
      <Icon size={20} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

function Controls() {
  return (
    <div className="relative z-10 flex gap-2.5 self-center rounded-full border-[1.5px] border-ink bg-surface p-2">
      <ToggleButton source={Track.Source.Microphone} label="Mikrofon" on={Mic} off={MicOff} />
      <ToggleButton source={Track.Source.Camera} label="Kamera" on={Video} off={VideoOff} />
      <ToggleButton source={Track.Source.ScreenShare} label="Ekranı paylaş" on={Monitor} off={Monitor} />
    </div>
  );
}

// Ekran paylaşımı varken ekran sahneyi kaplar, öğretmenin kamerası köşede küçük kutuda durur.
// Paylaşım yoksa kamera sahneyi kaplar. Görüntü yoksa tasarımdaki "Canlı video" yer tutucusu görünür.
function Feed({ error }: { error: string | null }) {
  const tracks = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: false },
    { source: Track.Source.Camera, withPlaceholder: false },
  ]).filter(isTrackReference);
  const screen = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  // Kamera kapalıyken yayın kaydı "muted" olarak kalır; siyah kutu yerine yok sayılır.
  const camera = cameraTrack && !cameraTrack.publication.isMuted ? cameraTrack : undefined;
  const main = screen ?? camera;

  if (!main) {
    return (
      <Placeholder
        title="Canlı video"
        hint={error ?? "Kamerayı ya da ekran paylaşımını açınca görüntü burada görünür"}
      />
    );
  }
  return (
    <>
      <VideoTrack
        trackRef={main}
        className={`absolute inset-0 size-full ${main === screen ? "object-contain" : "object-cover"}`}
      />
      {screen && camera && (
        <div className="absolute top-[68px] left-5 z-10 w-40 overflow-hidden rounded-xl border-[1.5px] border-ink">
          <VideoTrack trackRef={camera} className="aspect-video w-full object-cover" />
        </div>
      )}
    </>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <section aria-label="Canlı video" className={SECTION}>
      {children}
    </section>
  );
}

// Ders canlı değilken (taslak / bitti) bağlantı kurulmaz; yalnızca yer tutucu görünür.
export function StageIdle({ message }: { message: string }) {
  return (
    <Frame>
      <span />
      <Placeholder title="Canlı video" hint={message} />
      <span />
    </Frame>
  );
}

export function TeacherStage({
  token,
  serverUrl,
  startedAt,
}: {
  token: string;
  serverUrl: string;
  startedAt: string | null;
}) {
  // Sayfa yenilenince sunucu yeni token üretir; LiveKitRoom token değişince bağlantıyı yeniden kurar.
  // İlk token'ı sabit tutarak bunu önlüyoruz.
  const [stableToken] = useState(token);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <LiveKitRoom
      token={stableToken}
      serverUrl={serverUrl}
      connect
      video
      audio
      data-lk-theme="default"
      className="contents"
      onError={(e) => setError(e.message)}
      // Oda kapanınca düşer; sunucudan güncel durumu (ders bitti) al.
      onDisconnected={() => router.refresh()}
      onMediaDeviceFailure={() => setError("Kamera/mikrofon açılamadı (izin veya cihaz).")}
    >
      <Frame>
        <TopBar startedAt={startedAt} />
        <Feed error={error} />
        <Controls />
        <RoomAudioRenderer />
      </Frame>
    </LiveKitRoom>
  );
}
