// Test aracı: bir metin dosyasındaki mesajları, canlı bir dersin kuyruğuna (queued) farklı
// anonim öğrenciler adına ekler. Rate limit ve 500 karakter sınırına takılmadan yapay zekâ
// kalitesini denemek içindir. Sonra öğretmen panelinden "Analizi şimdi çalıştır"a basılır.
//
// Kullanım (web/ klasöründen):
//   node --env-file=.env.local scripts/seed-test-messages.mjs <KATILIM_KODU> <dosya.txt> [ogrenci_sayisi=6]
//   node --env-file=.env.local scripts/seed-test-messages.mjs <KATILIM_KODU> --temizle
//
// Dosya biçimi: her mesaj bir paragraf (aralarında boş satır). Boş satır yoksa her satır bir mesajdır.
// --temizle: bu betiğin eklediği test öğrencilerini ve mesajlarını siler (diğer verilere dokunmaz).

import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [code, arg, countArg] = process.argv.slice(2);
if (!code || !arg) {
  console.error("Kullanım: node --env-file=.env.local scripts/seed-test-messages.mjs <KATILIM_KODU> <dosya.txt|--temizle> [ogrenci_sayisi]");
  process.exit(1);
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SECRET_KEY gerekli (--env-file=.env.local ile çalıştır).");
  process.exit(1);
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const SEED_PREFIX = "seed-"; // test öğrencilerinin token_hash ön eki (temizlerken yalnızca bunları siler)

const { data: lesson } = await admin
  .from("lessons")
  .select("id, title, status")
  .eq("join_code", code.toUpperCase())
  .maybeSingle();
if (!lesson) {
  console.error(`"${code}" kodlu ders bulunamadı.`);
  process.exit(1);
}

if (arg === "--temizle") {
  const { data, error } = await admin
    .from("lesson_participants")
    .delete()
    .eq("lesson_id", lesson.id)
    .like("token_hash", `${SEED_PREFIX}%`)
    .select("id");
  if (error) throw error;
  console.log(`Temizlendi: ${data.length} test öğrencisi (ve mesajları) silindi. Ders: "${lesson.title}"`);
  process.exit(0);
}

const raw = readFileSync(arg, "utf-8").replace(/\r\n/g, "\n").trim();
let messages = raw.split(/\n\s*\n/).map((m) => m.trim()).filter(Boolean);
if (messages.length === 1) messages = raw.split("\n").map((m) => m.trim()).filter(Boolean);
messages = messages.map((m) => (m.length > 500 ? (console.warn(`Uyarı: ${m.length} karakterlik mesaj 500'e kısaltıldı.`), m.slice(0, 500)) : m));
if (!messages.length) {
  console.error("Dosyada mesaj bulunamadı.");
  process.exit(1);
}

const studentCount = Math.max(1, Math.min(Number(countArg) || 6, messages.length));
const { data: participants, error: pErr } = await admin
  .from("lesson_participants")
  .insert(
    Array.from({ length: studentCount }, () => ({
      lesson_id: lesson.id,
      token_hash: SEED_PREFIX + createHash("sha256").update(randomBytes(16)).digest("hex"),
    })),
  )
  .select("id");
if (pErr) throw pErr;

// Tek INSERT'te tüm satırlar aynı created_at'i alır; sıra belirsiz kalmasın diye mesajlar
// dosyadaki sırayla, saniye aralıklı zaman damgasıyla eklenir (gerçek sohbet gibi).
const start = Date.now() - messages.length * 1000;
const rows = messages.map((text, i) => ({
  lesson_id: lesson.id,
  participant_id: participants[i % studentCount].id,
  original_text: text,
  created_at: new Date(start + i * 1000).toISOString(),
}));
const { error: mErr } = await admin.from("student_messages").insert(rows);
if (mErr) throw mErr;

console.log(`${messages.length} mesaj ${studentCount} farklı test öğrencisi adına kuyruğa eklendi. Ders: "${lesson.title}"`);
if (lesson.status !== "live") {
  console.warn(`Uyarı: ders "${lesson.status}" durumda; analiz yalnızca canlı derste çalışır. Önce "Dersi başlat"a bas.`);
}
console.log('Şimdi öğretmen panelinde "Analizi şimdi çalıştır"a bas. Temizlemek için: --temizle');
