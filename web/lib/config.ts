// Tek yerde duran sabitler (FAZ1.md §7). Değiştirmek için sadece burayı düzenle.

export const RATE_LIMITS = {
  perMinute: 6, // oturum başına dakikada en fazla mesaj
  perLesson: 30, // oturum başına ders boyunca en fazla mesaj
  maxChars: 500, // mesaj uzunluğu
  duplicateWindowMs: 60_000, // aynı metin bu süre içinde tekrar kabul edilmez
} as const;

export const ANALYSIS = {
  maxBatch: 100, // bir turda AI'a gönderilecek en fazla mesaj
  staleRunMs: 2 * 60_000, // bu süreden eski "running" kaydı takılmış sayılır
  autoIntervalMs: 5 * 60_000, // öğretmen paneli açıkken kendiliğinden analiz (n8n'den bağımsız yedek)
} as const;

export const STUDENT_REPLY = "Mesajın öğretmene iletilecek.";
