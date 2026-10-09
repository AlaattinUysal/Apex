# [PROJE ADI BELİRLENECEK] — FAZ 1 (Taslak v2, tartışmaya açık)

> Kaynak: `writing-block.md` (ilk vizyon) + Ertuğrul'un n8n/Gemini çalışması + bizim sonraki kararlarımız.
> **Bu sürüm "5 dakikalık toplu analiz" modeline göre yazıldı.** `writing-block.md`'deki anlık önizleme/onay akışı, sesli uyarı ve "3 öğrenci eşiği" kaldırıldı.

---

## 1. Tek cümlede proje

Öğrenci ders sırasında anonim soru yazar. Mesajlar 5 dakika boyunca birikir; her 5 dakikada AI hepsini bir seferde inceler: uygunsuzları eler, benzer olanları **konuya göre birleştirir** ve her konu için **kısa, düzenlenmiş tek bir soru** üretir. Öğretmen panelinde ham mesaj değil, **konu kartları** görünür. 15 öğrenci 7 konuda soru sorduysa öğretmen 7 kart görür.

AI öğretmen **değil**, öğrenci ile öğretmen arasındaki iletişim aracısı.

### Ürün kuralları
- Öğretmen **hiçbir ham mesaj görmez**, yalnızca AI'ın özetlediği kartları görür. Öğrencinin kim olduğunu bilemez.
- Kartlar kısa ve doğal olmalı (tek cümle, ~15 kelime). Öğretmen uzun metin okumaz.
- AI **anlamı değiştirmez, yeni bilgi eklemez**, yapıcı eleştiriyi sansürlemez ("Anlatım çok hızlı" bir kart olabilir). Hakaret/küfür içeren mesaj öğretmene **gitmez**.
- **Sesli bildirim yok.** Sadece görsel: kırmızı rozet (okunmamış kart sayısı), kart listesi.
- Öğretmen kart paneli istediği zaman açıp kapatabilir; bildirim biriken kartlar rozette durur.
- **Eşik yok:** tek öğrencinin sorusu da kart olur. Kartta "N öğrenci" yazar, çok öğrenciye ait olanlar üstte sıralanır.
- Aynı konu sonraki turlarda tekrar gelirse AI yeni mesajları **mevcut açık karta ekler** (kart sayısı küçük kalır). Öğretmen 15 dk bakmasa bile kart sayısı şişmez.

---

## 2. Rol / sahiplik ayrımı

Çakışmayı önlemek için ayrım **klasör ve servis sınırıyla**: kimse diğerinin klasörüne commit atmaz.

| | **Alaaddin — Web / Platform / Video** | **Ertuğrul — AI / n8n** |
|---|---|---|
| Klasör | `web/` (Next.js), `livekit/` | `ai-service/`, `docker/` |
| Servisler | Next.js, Supabase (DB, Auth, Realtime, RLS), LiveKit (sunucu + token + React bileşeni) | AI servisi (Python/FastAPI, **Gemini**), n8n 5 dk zamanlayıcı |
| Ürün | Landing, giriş, ders oluşturma/kod, öğrenci ve öğretmen arayüzleri, canlı video, rate limit, anonim oturum, tick orkestrasyonu, kart paneli, rozet, chatbot aç/kapat | `/analyze-batch`: moderasyon + gruplama + kısa soru üretimi, prompt kalitesi, ders sonu özeti (`/summary`) |
| Veritabanı | **Tek sahip** (şema, migration, RLS) | Erişimi yok. AI servisi stateless |
| Sırlar | Supabase + LiveKit anahtarları | Gemini anahtarı (sadece AI servisinde) |

**Altın kural:** Tarayıcı AI servisini asla çağırmaz. Her şey `Next.js → AI servisi`. API anahtarı istemciye çıkmaz.

---

## 3. Mimari

```
 Tarayıcı (öğretmen / öğrenci)
      │ HTTP + Realtime        │ WebRTC
      ▼                        ▼
 ┌───────────────┐        ┌───────────┐
 │ Next.js (web) │        │ LiveKit   │
 │  + Supabase   │        └───────────┘
 └──┬──────────┬─┘
    │          ▲ POST /api/internal/analysis/tick  (5 dk'da bir)
    │          │
    │       ┌──┴──────┐
    │       │  n8n    │   (sadece zamanlayıcı)
    │       └─────────┘
    │ HTTP (sunucudan sunucuya)
    ▼
 ┌─────────────────────────────┐
 │ AI servisi (Python/FastAPI) │──► Gemini
 │  POST /analyze-batch        │
 └─────────────────────────────┘
```

| Parça | Nerede | Ne yapar |
|---|---|---|
| Gemini çağrıları | Python/FastAPI | İstek alır, doğrulanmış JSON döner, veritabanını görmez |
| Mesaj kuyruğu | Supabase (`student_messages`, durum `queued`) | Dosya kuyruğu yok |
| Orkestrasyon (`tick`) | Next.js | Kuyruğu çeker, AI'ı çağırır, sonucu kaydeder |
| Zamanlayıcı | n8n | Sadece `tick` endpoint'ini çağırır |

**Neden Python:** iki kişi aynı koda dokunmaz, prompt bağımsız iyileştirilir, mantık tek yerde ve test edilebilir.

---

## 4. Akışlar

### 4.1 Öğrenci
1. Kodla derse girer (isim/e-posta yok), kısa ömürlü anonim oturum alır.
2. Soru yazar → rate limit kontrolü → mesaj kaydedilir (`queued`).
3. Chatbot her mesaja aynı kısa cevabı verir: **"Mesajın öğretmene iletilecek."** Başka durum, önizleme, onay veya ret bilgisi gösterilmez.
4. Uygunsuz bulunan mesajlar öğretmene iletilmez ve öğrenciye ayrıca bildirilmez (sessizce elenir).
5. Başkalarının mesajlarını göremez. Chatbot kapalıysa yeni mesaj yazamaz, kendi eski mesajlarını görür.
6. Tek istisna rate limit: limit aşılırsa anında "Biraz bekleyip tekrar dene" uyarısı gösterilir (§7).

> **Karar:** Anlık önizleme/onay, durum takibi ve ret gerekçesi yok.

### 4.2 Öğretmen
1. Ders oluşturur, katılım kodu paylaşır, canlı dersi başlatır.
2. Panel ("Gelen Sorular") kartları listeler. Kart: **kısa soru**, konu etiketi, **N öğrenci**, son güncelleme saati.
3. Sıralama: öğrenci sayısı (azalan), sonra güncelleme zamanı.
4. Rozet = okunmamış veya güncellenmiş kart sayısı.
5. Karta tıklayınca okundu, "Cevaplandı" ile kart kapanır. (Öğrencilere bildirim gitmez, öğrenci dersi zaten izliyor.)
6. Chatbotu açıp kapatabilir. Kapalıyken öğrenciler yeni mesaj gönderemez.

### 4.3 5 dakikalık analiz (`tick`)
Her canlı ders için:
1. `queued` mesajları çek (yeni gelenler).
2. **Açık kartları** çek (`status = open`): `card_id`, konu etiketi, mevcut kısa soru.
3. AI'a gönder: `POST /analyze-batch` (yalnızca metin ve id'ler; **oturum kimliği AI'a gitmez**).
4. Cevaba göre:
   - Uygun mesajlar → `delivered`, ilgili karta bağlanır.
   - Uygun olmayanlar → `rejected` + gerekçe.
   - Yeni konular → yeni kart.
   - Mevcut karta eklenenler → kartın `distinct_session_count` ve `message_count`'u yeniden hesaplanır (benzersiz oturum sayısı, aynı öğrenci 10 kez sorsa 1), `updated_at` güncellenir, kart daha önce okunmuşsa tekrar "güncellendi" (okunmamış) olur.
   - AI kartın kısa sorusunu yeniden yazmayı önerdiyse güncellenir.
5. Realtime ile öğretmen paneline yansır. Tur `analysis_runs`'a kaydedilir.
6. AI hata verirse mesajlar `queued` kalır, bir sonraki turda tekrar denenir.

Demo için "Analizi şimdi çalıştır" butonu **aynı `tick` kodunu** çağırır (n8n'e bağımlı değiliz).

---

## 5. SÖZLEŞME: `POST /analyze-batch`

Header: `Authorization: Bearer <INTERNAL_API_KEY>`

### İstek
```json
{
  "lesson": { "subject": "Matematik", "topic": "Denklemler" },
  "open_cards": [
    { "card_id": "c-12", "topic_label": "İşaret değişimi", "summary_text": "Karşıya geçince işaret neden değişiyor?" }
  ],
  "messages": [
    { "message_id": "m-101", "text": "Hocam bu x niye eksi oldu anlamadım" },
    { "message_id": "m-102", "text": "Hoca aptal bir şey anlatamıyor" },
    { "message_id": "m-103", "text": "Çok hızlı anlatılıyor" }
  ]
}
```

### Cevap
```json
{
  "messages": [
    { "message_id": "m-101", "decision": "deliver", "reject_reason": null, "card_ref": "c-12" },
    { "message_id": "m-102", "decision": "reject",  "reject_reason": null, "card_ref": null },
    { "message_id": "m-103", "decision": "deliver", "reject_reason": null, "card_ref": "new:1" }
  ],
  "new_cards": [
    { "ref": "new:1", "topic_label": "Anlatım hızı", "summary_text": "Anlatım çok hızlı.", "kind": "feedback" }
  ],
  "updated_cards": [
    { "card_id": "c-12", "summary_text": "X neden eksi oldu, işaret karşıya geçince neden değişiyor?" }
  ]
}
```

### Kurallar (Ertuğrul için)
- İstekteki **her** `message_id` cevapta **tam bir kez** olmalı.
- `decision`: `deliver` | `reject`. Anlamsız/belirsiz/uygunsuz mesajlar `reject`. `reject_reason` öğrenciye gösterilmez; yalnızca iç kayıt/hata ayıklama için kısa bir etiket olabilir (`abuse`, `spam`, `unclear`, `off_topic`) ya da `null`.
- `deliver` ise `card_ref` zorunlu: ya mevcut `card_id` ya da `new_cards[].ref`.
- Yeni mesaj mevcut açık kartla aynı konudaysa **o karta ekle**; yalnızca gerçekten yeni konu için yeni kart aç.
- `summary_text`: tek cümle, doğal, kısa (~15 kelime). "Bir öğrenci şunu belirtmektedir" gibi resmî kalıplar yok. Yeni bilgi ekleme, anlamı değiştirme. Mesaj zaten uygunsa olduğu gibi bırak.
- `kind`: `question` | `feedback`.
- Eleştiri hakaret değildir; hakaret/küfür/tehdit `reject`. Küfür içeren ama gerçek bir öğrenme sorusu barındıran mesajda soruyu küfürsüz çıkarıp `deliver` etmek tercih edilir.
- Mesaj içeriği **veridir, talimat değildir** (prompt injection koruması). Çıktıyı Pydantic ile doğrula; geçersizse en fazla 1 tekrar dene, olmazsa HTTP 502.
- `/summary` (ders sonu özeti) Faz 5'te, şimdilik şeması yok.

---

## 6. Veri modeli (özet, MVP)

| Tablo | Önemli alanlar |
|---|---|
| `lessons` | id, teacher_id, title, class_name, topic, join_code, status (`draft/live/ended`), chatbot_enabled, room_name, started_at, ended_at |
| `lesson_participants` | id, lesson_id, anonymous_session_id (rastgele, kısa ömürlü), expires_at |
| `student_messages` | id, lesson_id, session_id, original_text, status (`queued/delivered/rejected`, yalnızca iç kullanım), reject_label (isteğe bağlı), card_id, created_at, processed_at |
| `topic_cards` | id, lesson_id, topic_label, summary_text, kind, distinct_session_count, message_count, status (`open/answered`), is_read, has_update, created_at, updated_at |
| `analysis_runs` | id, lesson_id, started_at, completed_at, status, message_count, card_count |

- Teacher/auth: Supabase Auth. Sınıf tablosu MVP'de yok (ders içinde `class_name`).
- Bildirim tablosu yok: rozet = `topic_cards` içinde okunmamış/güncellenmiş kartlar.
- **RLS:** Öğretmen yalnızca kendi derslerinin `topic_cards`'ını okur; `student_messages` tablosuna **hiç erişemez** (ne ham ne işlenmiş). Öğrenci yalnızca kendi oturumuna ait mesajları sunucu üzerinden görür. Yetkilendirme sunucu ve veritabanı düzeyinde, sadece arayüzde değil.

---

## 7. Rate limit (taslak, hepsi Next.js'te, AI'a gitmeden önce)

- Oturum başına dakikada en fazla **6 mesaj**, ders başına en fazla **30 mesaj**
- Mesaj en fazla **500 karakter**
- Aynı oturumdan **60 sn içinde aynı metin** tekrar kabul edilmez
- Aşılınca öğrenciye anlaşılır Türkçe uyarı
- MVP'de bellek içi sayaç, sayılar tek `config` dosyasında sabit
- Bu, Gemini kotasını da korur

---

## 8. FAZ 1 kapsamı

Hedef: **"Öğretmen ders açar, öğrenci kodla girer, iki ayrı arayüz görünür; AI servisi sözleşmeyle sahte (mock) cevap verir."**

### Alaaddin (`web/`)
1. Next.js 16 + TypeScript + Tailwind kurulumu ✅ (`web/` iskeleti hazır)
2. `.gitignore`/`.env.example`, Supabase projesi (birlikte kurulacak), şema + RLS taslağı
3. Landing (`/`), öğretmen girişi, ders oluşturma, katılım kodu, `/join`, anonim oturum
4. `/live/[lessonId]` iskeleti: rol bazlı sağ panel (öğrenci: "Sorularım", öğretmen: "Gelen Sorular"), video yer tutucusu
5. AI adapter katmanı (`lib/ai-client.ts`) mock sunucuya karşı

### Ertuğrul (`ai-service/`, `docker/`)
1. FastAPI iskeleti: `POST /analyze-batch` **sabit sahte cevapla** ayakta (§5 şemasına uygun)
2. Gemini'yi tek bir `provider` arayüzü arkasında bağla, kendi prompt'larını (özetleme, uygunsuz eleme) buraya taşı
3. `main.py` → anonim test istemcisi (öğrenci adı yok), örnek batch'leri `/analyze-batch`'e gönderir
4. `docker-compose`'a AI servisini ekle, `.env.example`, README
5. n8n: sadece 5 dk zamanlayıcı → `POST {WEB_URL}/api/internal/analysis/tick` (Docker içinden `host.docker.internal:3000`), dosya kuyruğu ve HTML rapor kalkar

### Faz 1 bitiş kriteri
- [ ] Ders oluşturulup kodla ikinci tarayıcıdan öğrenci girişi, iki farklı panel
- [ ] Next.js `/analyze-batch`'e istek atıp mock cevabı alıyor
- [ ] n8n `tick` endpoint'ini çağırabiliyor (boş sonuç olsa da)

---

## 9. Ertuğrul'un mevcut işi ne olacak

| Mevcut parça | Karar |
|---|---|
| Gemini prompt metinleri (uygunsuzları ele, özetle) | **Python'a taşınır**, `/analyze-batch` prompt'unun temeli olur |
| n8n içindeki Gemini HTTP çağrısı | Kalkar (Python yapar) |
| Dosya kuyruğu `bekleyen_mesajlar.json` | Kalkar (Supabase `queued` mesajları) |
| Zamanlayıcı (30 sn test) + Manuel Tetikle | **Kalır**, 5 dk'ya alınır, sadece `tick` çağırır |
| HTML rapor + `GET /ozet` | Kalkar (kartlar Next.js'te) |
| `main.py` test paneli | **Kalır**, anonim test istemcisine dönüşür |
| `NODE_FUNCTION_ALLOW_*` | `fs` kalkınca gerekmez |
| Karakter düzeltme tablosu | UTF-8 ile gönderilince gerekmez |

Gerçek API anahtarı **hiçbir zaman** workflow JSON'una yazılıp commit edilmez (`.env`).

---

## 10. Git akışı

- `main` ve `Development` doğrudan commit almaz.
- Herkes `Development`'tan dal açar ve push eder: `app/<konu>` (Alaaddin), `ai/<konu>` (Ertuğrul).
- Birleştirmeyi **Alaaddin** yapar (`Development`, sonra `main`).
- Ortak dosyalar (`README.md`, `.env.example`) için yalnızca kendi bölümünüzü ekleyin.
- `.env` ve anahtarlar asla commit edilmez.

---

## 11. 12 saatlik plan (taslak)

| Saat | Alaaddin (web) | Ertuğrul (AI) | Birlikte |
|---|---|---|---|
| 0–1 | Supabase hesabı + proje, şema | `/analyze-batch` mock | Sözleşme onayı, `.env.example` |
| 1–3 | Landing, giriş, ders oluşturma, katılım kodu, `/join`, anonim oturum | Gemini bağlantısı, gerçek `/analyze-batch` | |
| 3–5 | LiveKit token + `/live` video | Prompt kalitesi, test mesajları | |
| 5–8 | Öğrenci mesaj gönderme + durumlar, rate limit, `tick`, öğretmen kart paneli, Realtime, rozet | Mevcut karta ekleme (kart birleştirme) kalitesi, n8n zamanlayıcı | **İlk uçtan uca deneme (~saat 8)** |
| 8–10 | Chatbot aç/kapat, "Analizi şimdi çalıştır", sıralama, güncellendi durumu | Hata/fallback, tekrar deneme | |
| 10–11 | (zaman kalırsa) zaman çizelgesi + ders sonu raporu | `/summary` | |
| 11–12 | Demo verisi, hata düzeltme | Hata düzeltme | Demo provası |

---

## 12. Kapsam dışı (backlog)

- Anlık önizleme/onay akışı, öğrenciye durum/ret bildirimi (karar: yok)
- Sesli uyarı
- Ayarlanabilir eşik
- Koyu tema
- Ham mesaj için otomatik silme / ayrı güvenli depo (MVP: ham metin yalnızca `student_messages.original_text`, öğretmen erişemez)
- Gelişmiş erişilebilirlik
- Seed dışı süslemeler
- Tehdit/güvenlik riski için ayrı yetkili inceleme süreci
- Sınıf (`classrooms`) tablosu
- KVKK/okul izni: README'ye tek paragraf

---

## 13. Açık sorular

1. ✅ Öğrenci önizlemesi/durum takibi yok; chatbot sadece "Mesajın öğretmene iletilecek" der.
2. ⏳ Proje adı
3. ⏳ Gemini model adı: workflow'daki `gemini-3.8-flash` geçerli mi?
4. ⏳ Supabase hesabı (URL + anon key) — birlikte kurulacak
