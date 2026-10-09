import "server-only";
import { connection } from "next/server";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

// Rol -> yetki. Öğretmen yayın yapar; öğrenci yalnızca izler (kamera/mikrofon açamaz).
// Yetki token'ın içinde olduğu için istemci tarafında değiştirilemez.
export type LiveRole = "teacher" | "student";

export function isLiveKitConfigured() {
  return Boolean(
    process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET,
  );
}

export async function createRoomToken(opts: { room: string; identity: string; role: LiveRole }) {
  await connection(); // token'a geçerli zaman yazılır: istek zamanında üretilmeli
  const token = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
    identity: opts.identity,
    ttl: "6h", // anonim öğrenci oturumuyla aynı ömür
  });

  token.addGrant({
    roomJoin: true,
    room: opts.room,
    canSubscribe: true,
    canPublish: opts.role === "teacher",
    canPublishData: opts.role === "teacher",
  });

  return { token: await token.toJwt(), serverUrl: process.env.LIVEKIT_URL! };
}

// Ders bitince odayı kapatır: bağlı herkesin bağlantısı kopar, öğrenci istemcisi bunu algılayıp yenilenir.
export async function closeRoom(room: string) {
  const client = new RoomServiceClient(
    process.env.LIVEKIT_URL!.replace(/^wss:/, "https:"),
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
  );
  await client.deleteRoom(room);
}
