# Apex AI Service 🧠

Öğrenci sorularını 5 dakikalık periyotlarla analiz eden, uygunsuz mesajları eleyen ve benzer soruları kartlar altında birleştiren FastAPI mikroservisi.

## 🚀 Yerel Olarak Çalıştırma (Python)

1. Sanal ortam oluşturun ve aktif edin:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
```

3. Ortam değişkenlerini hazırlayın:
`.env.example` dosyasını `.env` olarak kopyalayın ve `GEMINI_API_KEY` değerinizi girin.

4. Servisi başlatın:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 🐳 Docker ile Çalıştırma

```bash
docker compose up -d ai-service
```

## 📡 Endpoint Sözleşmesi (`POST /analyze-batch`)

- **URL:** `http://localhost:8000/analyze-batch`
- **Header:** `Authorization: Bearer apex-internal-secret-key-2026`
- **Body:**
```json
{
  "lesson": { "subject": "Matematik", "topic": "Denklemler" },
  "open_cards": [
    { "card_id": "c-12", "topic_label": "İşaret değişimi", "summary_text": "Karşıya geçince işaret neden değişiyor?" }
  ],
  "messages": [
    { "message_id": "m-101", "text": "Hocam bu x niye eksi oldu anlamadım" },
    { "message_id": "m-102", "text": "Hoca çok kötü anlatıyor boş ders" },
    { "message_id": "m-103", "text": "Çok hızlı anlatılıyor" }
  ]
}
```
