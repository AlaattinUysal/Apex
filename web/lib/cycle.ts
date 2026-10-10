// Özet turları ders başlangıcına çapalanır: öğretmen ve öğrenci ekranı aynı "sonraki özet" geri sayımını görür.
export function secondsToNextCycle(startedAtMs: number, intervalMs: number, nowMs: number) {
  const into = Math.max(0, nowMs - startedAtMs) % intervalMs;
  return Math.max(1, Math.ceil((intervalMs - into) / 1000));
}

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function intervalLabel(ms: number) {
  const s = Math.round(ms / 1000);
  return s < 120 ? `${s} saniyede` : `${Math.round(s / 60)} dakikada`;
}
