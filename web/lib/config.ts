// Tek yerde duran sabitler (FAZ1.md §7). Değiştirmek için sadece burayı düzenle.

export const RATE_LIMITS = {
  perLesson: 30, // oturum başına ders boyunca en fazla mesaj
  maxChars: 500, // mesaj uzunluğu
  duplicateWindowMs: 60_000, // aynı metin bu süre içinde tekrar kabul edilmez
} as const;

export const ANALYSIS = {
  maxBatch: 100, // bir turda AI'a gönderilecek en fazla yeni mesaj
  maxApproved: 300, // özet bağlamına giren en fazla onaylı mesaj (son "Cevaplandı"dan beri)
  staleRunMs: 2 * 60_000, // bu süreden eski "running" kaydı takılmış sayılır
  // Öğretmen paneli açıkken kendiliğinden analiz aralığı (n8n'den bağımsız). Varsayılan 5 dk.
  // NEXT_PUBLIC_AUTO_ANALYSIS_SECONDS: 30 gibi bir değer (en az 10 sn) aralığı değiştirir;
  // "0" otomatik analizi tamamen kapatır (yalnızca "Analizi şimdi çalıştır" düğmesi). Test için kullanışlı.
  autoIntervalMs:
    process.env.NEXT_PUBLIC_AUTO_ANALYSIS_SECONDS === "0"
      ? 0
      : Math.max(10, Number(process.env.NEXT_PUBLIC_AUTO_ANALYSIS_SECONDS) || 300) * 1000,
} as const;

export const STUDENT_REPLY = "Mesajın öğretmene iletilecek.";
