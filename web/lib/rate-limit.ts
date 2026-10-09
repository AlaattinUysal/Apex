import "server-only";
import { RATE_LIMITS } from "@/lib/config";

// MVP: bellek içi sayaç (tek sunucu süreci). HMR/yeniden yüklemede sıfırlanmasın diye globalThis'te tutulur.
type Entry = { recent: number[]; total: number; lastSeen: Map<string, number> };
const g = globalThis as unknown as { __apexRateLimit?: Map<string, Entry> };
const store = (g.__apexRateLimit ??= new Map<string, Entry>());

// Kural ihlal edilirse Türkçe uyarı metni döner; ihlal yoksa mesajı sayar ve null döner.
export function checkAndRecord(key: string, text: string): string | null {
  const now = Date.now();
  const entry = store.get(key) ?? { recent: [], total: 0, lastSeen: new Map() };

  entry.recent = entry.recent.filter((t) => now - t < 60_000);

  if (entry.total >= RATE_LIMITS.perLesson) return "Bu ders için mesaj sınırına ulaştın.";
  if (entry.recent.length >= RATE_LIMITS.perMinute) return "Biraz bekleyip tekrar dene.";

  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  const last = entry.lastSeen.get(normalized);
  if (last && now - last < RATE_LIMITS.duplicateWindowMs) return "Aynı mesajı az önce gönderdin.";

  entry.recent.push(now);
  entry.total += 1;
  entry.lastSeen.set(normalized, now);
  store.set(key, entry);
  return null;
}
