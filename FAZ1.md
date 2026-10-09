# [PROJE ADI BELİRLENECEK] — FAZ 1 (Taslak, tartışmaya açık)

> Kaynak: `writing-block.md` (tam vizyon) + Ertuğrul'un mevcut `docker/` çalışması (n8n).
> Bu dosya kodlamaya başlamadan önce **iş bölümünü ve sözleşmeyi** netleştirmek içindir.

---

## 1. Tek cümlede proje

Öğrenci ders sırasında anonim soru yazar → AI küfür/hakaret kontrolü yapıp gerekirse kısaltır → öğrenci onaylar → öğretmen paneline düşer → AI her 5 dk'da benzer soruları gruplayıp "ortak sorun" uyarısı verir → ders sonu rapor.

AI öğretmen **değil**, öğrenci ile öğretmen arasındaki **iletişim aracısı**.

---

## 2. Rol / sahiplik ayrımı

Çakışmayı önlemek için ayrım **klasör ve servis sınırıyla** yapılıyor: kimse diğerinin klasörüne commit atmaz.

| | **Alaaddin — Web / Platform** | **Ertuğrul — AI / Video / Altyapı** |
|---|---|---|
| Klasör | `web/` (Next.js), `livekit/` (video altyapısı) | `ai-service/`, `docker/` (n8n) |
| Sahip olduğu servis | Next.js uygulaması, Supabase (DB, Auth, Realtime, RLS), **LiveKit (sunucu + token + React bileşeni — video komple Alaaddin'de)** | AI servisi (Python/FastAPI, **Gemini**), n8n zamanlayıcı workflow'u |
| Ürün özellikleri | Landing, öğretmen girişi, ders oluşturma/katılım kodu, rol bazlı arayüzler, canlı video, öğrenci chat paneli, öğretmen soru paneli, bildirim rozeti, chatbot aç/kapat, rapor ve zaman çizelgesi ekranları, anonim oturum + yetkilendirme, 5 dk analiz orkestrasyonu | Mesaj moderasyonu, mesaj sadeleştirme, konu/kavram sınıflandırma, ortak sorun kümeleme, rapor özeti üretimi, prompt kalitesi / chatbot iyileştirme, n8n akışı |
| Veritabanı | **Tek sahip: Alaaddin** (şema, migration, RLS). AI servisi veritabanına **hiç erişmez** | Yok (AI servisi stateless: girdi alır, JSON döner) |
| Env / sırlar | Supabase + LiveKit anahtarları | Gemini anahtarı (sadece AI servisinde) |

**Altın kural:** Tarayıcı AI servisini asla doğrudan çağırmaz. Her şey `Next.js → AI servisi` yönünde gider. API anahtarı istemciye çıkmaz.

---

## 3. Mimari (sade MVP)

```
 Tarayıcı (öğretmen / öğrenci)
      │                    │
      │ HTTP + Realtime    │ WebRTC
      ▼                    ▼
 ┌───────────────┐    ┌──────────────┐
 │ Next.js (web) │    │ LiveKit      │  ← Ertuğrul
 │ + Supabase    │    │ (docker)     │
 └──────┬────────┘    └──────────────┘
        │ HTTP (sunucudan sunucuya)
        ▼
 ┌─────────────────────────────┐
 │ AI servisi (Python/FastAPI) │  ← Ertuğrul
 │  /moderate  /cluster  ...   │
 │  (n8n: 5 dk zamanlayıcı)    │
 └─────────────────────────────┘
```

### 3.1 Karar: AI Python'da (Seçenek A, onaylandı)

| Parça | Nerede çalışır | Ne yapar |
|---|---|---|
| Gemini çağrıları (moderasyon, sadeleştirme, konu etiketi, kümeleme) | **Python / FastAPI** (`ai-service/`) | İstek alır, Gemini'ye sorar, doğrulanmış JSON döner. Veritabanına erişmez. |
| Mesaj kuyruğu / durum | **Supabase** (`student_messages` tablosu) | Dosya kuyruğu yok; "kuyruk" artık tablodaki onaylı mesajlar. |
| Orkestrasyon (kimi ne zaman analiz et, sonucu kaydet, bildirim üret) | **Next.js** (`/api/...`) | AI servisini çağırır, sonucu Supabase'e yazar. |
| 5 dk zamanlayıcı | **n8n** | Sadece Next.js'teki `tick` endpoint'ini çağırır. |

Neden: iki kişi aynı koda dokunmadan çalışır, prompt kalitesi bağımsız iyileştirilir, mantık tek yerde (Python) olduğu için test edilebilir.

### 3.2 Ertuğrul'un mevcut n8n işi ne olacak

| Mevcut parça | Karar |
|---|---|
| Gemini prompt metinleri (özetleme, uygunsuz mesajı eleme) | **Python'a taşınır** (`/moderate`, `/cluster`, `/summary` prompt'larına temel olur) |
| n8n içindeki Gemini HTTP çağrısı | Kalkar (Python yapar) |
| Dosya kuyruğu (`bekleyen_mesajlar.json`), "Mesajı Kuyruğa Kaydet" | Kalkar (Supabase tablosu) |
| 5 dk (şu an 30 sn) zamanlayıcı + Manuel Tetikle | **Kalır**, sadece `tick` çağrısı yapacak şekilde sadeleşir |
| HTML rapor + `GET /ozet` | Kalkar (rapor Next.js'te) |
| `main.py` test paneli | **Kalır**, Python endpoint'lerini test eden istemciye dönüşür (anonim; öğrenci adı yok) |
| `docker-compose.yml` (n8n) | Kalır, AI servisi eklenir |
| `NODE_FUNCTION_ALLOW_*` ayarları | `fs` kullanımı kalkınca gerekmez |
| Türkçe karakter düzeltme tablosu | UTF-8 ile gönderilince gerekmez; gerekirse kaynağı (`.bat`) düzeltilir |

- Gerçek API anahtarı hiçbir zaman workflow JSON'una yazılıp commit edilmez (`.env` kullanılır).

- Gerçek zamanlılık Supabase Realtime ile (Next.js tarafı, Alaaddin).
- 5 dk'lık analizi tetikleyen zamanlayıcı n8n'de (Ertuğrul); n8n analiz sonucunu Next.js'in "internal" endpoint'ine veya doğrudan Supabase'e yazar (karar bekliyor, §6-3).
- Video token'ı: Ertuğrul'un servisi üretir, Next.js `/live` sayfası ister.

---

## 4. İki taraf arası SÖZLEŞME (Faz 1'in asıl çıktısı)

Bu sözleşme sabitlenince iki taraf birbirini beklemeden çalışır. Ertuğrul gerçek AI hazır olana kadar **sahte (mock) cevap** döner, ben de buna göre ilerlerim.

### 4.1 `POST /moderate` — tek mesaj analizi
İstek:
```json
{ "lesson_id": "uuid", "text": "Hocam bu x neden eksi oldu?", "lesson_topic": "Denklemler" }
```
Cevap:
```json
{
  "moderation_status": "approved | rewrite_required | clarification_required | rejected",
  "suggested_text": "X neden eksi oldu?",
  "rewrite_needed": true,
  "user_feedback": "Öğrenciye gösterilecek kısa Türkçe açıklama (engelleme durumunda)",
  "topic": "Denklemler",
  "concept": "İşaret değişimi",
  "issue_type": "conceptual_question",
  "confidence": 0.91
}
```
Kurallar: `writing-block.md` §8–§10 (minimum müdahale, anlamı değiştirme, eleştiriyi sansürleme, hakareti engelleme).

### 4.2 `POST /cluster` — 5 dk'lık ortak sorun analizi
İstek: `lesson_id`, eşik (sabit 3), dersin onaylı mesajları `[{message_id, session_id, final_text, topic, concept}]`
Cevap: `[{ topic, concept, label, message_ids[], distinct_session_count }]`
Sayım **benzersiz oturum** üzerinden (aynı öğrenci 10 kez sorsa 1).

### 4.3 `POST /summary` — ders sonu özeti
İstek: dersin onaylı mesajları + küme listesi → Cevap: kısa Türkçe özet + "tekrar önerilen konu". (Faz 3+ için, şimdilik sadece şeması.)

### 4.4 Video
Video tamamen Next.js tarafında (token endpoint'i dahil). AI servisinin video ile işi yok; bu bölüm Ertuğrul için sözleşme içermez.

### 4.5 n8n → Next.js tetikleyici
n8n yalnızca 5 dakikada bir `POST {WEB_URL}/api/internal/analysis/tick` çağırır (başlık: `Authorization: Bearer <INTERNAL_API_KEY>`). Gerisini Next.js yapar (bkz. §6-2).

### 4.6 Ortak güvenlik şartı
AI servisi sadece `Authorization: Bearer <INTERNAL_API_KEY>` ile cevap verir. Anahtar `.env`'de, repoya girmez.

---

## 5. FAZ 1 kapsamı — kim ne yapacak

Faz 1 hedefi: **"Öğretmen ders açar, öğrenci kodla girer, iki ayrı arayüz görünür; AI servisi mock da olsa sözleşmeyle konuşulur."** Video ve gerçek AI sonraki fazlarda.

### Alaaddin (web/)
1. Next.js + TypeScript + Tailwind projesi (`web/`), `.gitignore`, `.env.example`
2. Supabase projesi (birlikte kurulacak) + şema (teachers, classrooms, lessons, lesson_participants, student_messages, message_teacher_status …) + RLS taslağı
3. Landing sayfası (`/`)
4. Öğretmen girişi (`/teacher/login`) — Supabase Auth
5. Dashboard + yeni ders oluşturma + katılım kodu üretme (`/teacher/dashboard`, `/teacher/lessons/new`, `/teacher/lessons/[id]`)
6. Öğrenci katılımı (`/join`) — kodla, isim/e-posta zorunlu değil, anonim kısa ömürlü oturum
7. `/live/[lessonId]` iskeleti: rol bazlı sağ panel (öğrenci: "Anonim Sorularım", öğretmen: "Gelen Sorular"), video alanı için placeholder
8. AI servisine çağrı yapan **adapter katmanı** (`lib/ai-client.ts`) — mock sunucuya karşı çalışır

### Ertuğrul (ai-service/, docker/)
1. AI servisi iskeleti (FastAPI, repodaki `main.py` buradan büyüyebilir): §4.1–4.3 endpoint'leri **mock cevapla** ayakta
2. `docker-compose`'a AI servisini ekle (n8n zaten var)
3. Gemini'yi tek bir `provider` arayüzü arkasına alıp ilk `/moderate` denemesi (anahtar `.env`'de, workflow JSON'larında **asla**)
4. `.env.example` ve README: nasıl ayağa kalkar, hangi port
5. n8n workflow'unu §6-2'deki modele sadeleştir (sadece 5 dk zamanlayıcı → `tick` çağrısı)

### Faz 1 bitiş kriteri (ikimiz birlikte)
- [ ] Ben bir ders oluşturup kod alıyorum, ikinci tarayıcıdan öğrenci olarak giriyorum, iki farklı panel görünüyor
- [ ] Next.js, Ertuğrul'un `/moderate` endpoint'ine istek atıp mock cevabı alıyor
- [ ] n8n 5 dk'lık zamanlayıcıyla Next.js `tick` endpoint'ini çağırabiliyor (boş sonuç dönse bile)

---

## 6. Konuşmamız gereken kararlar

1. ✅ **Video komple Alaaddin'de** (LiveKit sunucusu, token, React bileşeni).
2. ✅ **n8n'in rolü** (onaylandı):
   - n8n yalnızca **saat**: 5 dk'da bir Next.js'e `POST /api/internal/analysis/tick` atar.
   - Next.js (`tick`): canlı dersleri bulur → her ders için **tüm onaylı mesajları** Supabase'den çeker (pencere sorunu olmasın diye "yalnızca yeni" değil) → AI servisine `/cluster` ister → sonucu (küme, benzersiz oturum sayısı, bildirim) kaydeder → Realtime ile öğretmen paneline düşer. Aynı konu için tekrar sesli uyarı, küme kaydındaki "uyarıldı" bilgisiyle engellenir.
   - **Eşik sabit 3** (kodda sabit, arayüzden ayarlanmaz).
   - AI servisi **stateless**: mesaj listesi alır, kümeleri döner, veritabanını görmez.
   - "Demo: Analizi şimdi çalıştır" butonu aynı `tick` kodunu çağırır; demoda n8n'e bağımlı kalmayız.
   - Mevcut workflow'daki dosya kuyruğu (`bekleyen_mesajlar.json`) kalkar; mesajlar zaten Supabase'de.
3. ✅ **Sonuç platforma nasıl döner:** AI servisi hiçbir şey yazmaz, Next.js yazar (yukarıdaki akış).
4. ✅ **AI sağlayıcısı: Gemini.** Model adı Ertuğrul'dan teyit edilecek (workflow'daki `gemini-3.8-flash` geçerli mi?). Anahtar sadece AI servisinin `.env`'inde.
5. ✅ **AI Python/FastAPI'de** (Seçenek A). Seçenekler: A (Python, seçildi), B (kümeleme n8n'de), C (Next.js içinde). Detay §3.1–3.2.
6. ✅ **Zaman bütçesi: 12 saat.** Kesilenler §7'de, saat planı §8'de.
6b. ⏳ **Rate limit (önemli, konuşulacak).** Taslak öneri, hepsi Next.js'te (AI'a gitmeden önce) uygulanır:
   - Oturum başına dakikada en fazla **6 mesaj**, ders başına en fazla **30 mesaj**
   - Mesaj uzunluğu en fazla **500 karakter**
   - Aynı oturumdan **60 sn içinde aynı metin** tekrar kabul edilmez
   - Limiti aşınca öğrenciye anlaşılır Türkçe uyarı ("Biraz bekleyip tekrar dene")
   - Gemini'yi kota/maliyete karşı korur; `/moderate` çağrılarının hepsi bu sınırdan geçer
   - MVP'de bellek içi sayaç yeterli (tek sunucu); sayılar `config` dosyasında sabit
7. ✅ **Supabase:** hosted proje, birlikte kuracağız. Faz 1'in ilk adımı.
8. ✅ **Git akışı:**
   - `main` ve `Development` doğrudan commit almaz.
   - Herkes `Development`'tan kendi dalını açar ve onu push eder: `web/<konu>` (Alaaddin), `ai/<konu>` (Ertuğrul). Örn. `web/faz1-temel`, `ai/moderate-mock`.
   - Dalları `Development`'a **Alaaddin** birleştirir, `main`'e de o alır.
   - Klasörler ayrı olduğu için çakışma çıkmaz; ortak dokunulan tek dosya kök `README.md` / `.env.example`, bunlara yalnızca kendi bölümünüzü ekleyin.
   - `.env` dosyaları ve API anahtarları asla commit edilmez (`.gitignore` ilk işlerden).

---

## 7. Şimdilik kapsam dışı (12 saatlik MVP — sonradan geliştirilecek backlog)

Anonim oturum, rol bazlı erişim ve RLS **kesilmiyor** (çekirdek).

- Koyu tema
- Ayarlanabilir eşik (kodda sabit 3)
- Ham mesaj için otomatik silme / ayrı güvenli depo (MVP: `original_text` ayrı alanda, RLS ile öğretmenden gizli)
- Gelişmiş erişilebilirlik (ekran okuyucu, tam klavye, reduced motion); temel okunaklılık yeterli
- Seed verisi dışındaki süslemeler (animasyon, ince görsel detay)
- Tehdit/güvenlik riski için ayrı yetkili inceleme süreci (sadece dokümante)
- shadcn/ui, Recharts yalnızca gerçekten gerekince
- Mobil için ince ayar (temel responsive yeterli)
- KVKK/okul izni notu: README'ye tek paragraf

## 8. 12 saatlik plan (taslak, saatler yaklaşık)

| Saat | Alaaddin (web) | Ertuğrul (AI) | Birlikte |
|---|---|---|---|
| 0–1 | Next.js kurulumu, Supabase hesabı | AI servis iskeleti (mock `/moderate`, `/cluster`) | Supabase'i birlikte kur, `.env.example`, sözleşme onayı |
| 1–3 | Landing, öğretmen girişi, ders oluşturma, katılım kodu, `/join`, anonim oturum | Gemini bağlantısı, gerçek `/moderate` | |
| 3–5 | LiveKit: token + `/live` video | Moderasyon/sadeleştirme prompt kalitesi, test mesajları | |
| 5–8 | Öğrenci paneli, mesaj akışı + önizleme/onay, rate limit, öğretmen soru paneli, Realtime, rozet | `/cluster` kümeleme, n8n 5 dk zamanlayıcı | İlk uçtan uca deneme (saat ~8) |
| 8–10 | `tick` endpoint, sesli uyarı, chatbot aç/kapat, "Analizi şimdi çalıştır" butonu | Kümeleme iyileştirme, hata/fallback | |
| 10–11 | (zaman kalırsa) zaman çizelgesi + rapor | `/summary` | |
| 11–12 | Demo verisi, hata düzeltme | Hata düzeltme | Demo provası |
