import json
import urllib.request
import urllib.error
import time
import sys

# Windows konsolunda UTF-8 çıktı desteği
try:
    if sys.stdout.encoding != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

AI_SERVICE_URL = "http://localhost:8000/analyze-batch"
AUTH_TOKEN = "apex-internal-secret-key-2026"

SAMPLE_BATCHES = {
    "1": {
        "title": "İlk Tur (Açık kart yok, 5 anonim mesaj: 2 benzer, 1 uygunsuz, 1 feedback, 1 soru)",
        "payload": {
            "lesson": {
                "subject": "Python",
                "topic": "Listeler ve Döngüler"
            },
            "open_cards": [],
            "messages": [
                {
                    "message_id": "m-101",
                    "text": "Hocam for döngüsüyle listeyi gezerken 'IndexError: list index out of range' hatası alıyorum, neden olabilir?"
                },
                {
                    "message_id": "m-102",
                    "text": "Listede son elemana ulaşmaya çalışırken IndexError veriyor, len() fonksiyonu kullanırken bir yeri mi kaçırıyorum?"
                },
                {
                    "message_id": "m-103",
                    "text": "Fonksiyon içinde return kullanmak ile sadece print yazmak arasındaki fark nedir hocam?"
                },
                {
                    "message_id": "m-104",
                    "text": "Boş yapma hoca ders çok sıkıcı böyle ders mi anlatılır kapat git ya"
                },
                {
                    "message_id": "m-105",
                    "text": "Hocam kodları biraz daha yavaş yazabilir misiniz, yetişemiyoruz."
                }
            ]
        }
    },
    "2": {
        "title": "İkinci Tur (Önceki kart açık, yeni mesajın mevcut karta bağlanması testi)",
        "payload": {
            "lesson": {
                "subject": "Python",
                "topic": "Listeler ve Döngüler"
            },
            "open_cards": [
                {
                    "card_id": "card-list-index",
                    "topic_label": "Liste İndeks Sınırları",
                    "summary_text": "for döngüsünde son elemana erişirken IndexError alınıyor."
                }
            ],
            "messages": [
                {
                    "message_id": "m-201",
                    "text": "Hocam negatif indeks kullanınca da IndexError verir mi?"
                },
                {
                    "message_id": "m-202",
                    "text": "Hocam append() ve extend() farkı nedir?"
                }
            ]
        }
    }
}

def send_batch(payload):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        AI_SERVICE_URL,
        data=data,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Bearer {AUTH_TOKEN}"
        },
        method="POST"
    )

    print("\n" + "=" * 70)
    print("📤 İSTEK GÖNDERİLİYOR -> POST /analyze-batch")
    print(f"Mesaj Sayısı: {len(payload.get('messages', []))} | Açık Kart Sayısı: {len(payload.get('open_cards', []))}")
    print("=" * 70)

    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            duration = time.time() - start
            body = resp.read().decode("utf-8")
            result = json.loads(body)

            print(f"✅ YANIT ALINDI ({resp.status} OK - {duration:.2f} sn)\n")
            
            print("📋 MESAJ KARARLARI (MODERASYON & BAĞLANTI):")
            for m in result.get("messages", []):
                decision_badge = "✅ DELIVER" if m["decision"] == "deliver" else f"❌ REJECT ({m.get('reject_reason')})"
                card_badge = f"-> Kart: {m.get('card_ref')}" if m.get("card_ref") else ""
                print(f"  • {m['message_id']:<8} : {decision_badge} {card_badge}")

            print("\n🗂️ YENİ AÇILAN KARTLAR (new_cards):")
            new_cards = result.get("new_cards", [])
            if not new_cards:
                print("  (Yeni kart açılmadı)")
            for c in new_cards:
                print(f"  • [{c['ref']}] [{c.get('kind', 'question').upper()}] {c['topic_label']}:")
                print(f"    \"{c['summary_text']}\"")

            print("\n🔄 GÜNCELLENEN KARTLAR (updated_cards):")
            updated = result.get("updated_cards", [])
            if not updated:
                print("  (Güncellenen kart yok)")
            for u in updated:
                print(f"  • [{u['card_id']}] -> \"{u['summary_text']}\"")

            print("=" * 70)
            return result
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="ignore")
        print(f"❌ HTTP HATASI ({e.code}): {err}")
    except Exception as e:
        print(f"❌ BAĞLANTI HATASI: {e}")
        print("💡 İpucu: ai-service çalışıyor mu? (http://localhost:8000)")

def main():
    while True:
        print("\n" + "=" * 65)
        print("          APEX AI SERVICE - ANONİM TEST İSTEMCİSİ")
        print("=" * 65)
        print(f"Hedef URL: {AI_SERVICE_URL}")
        print("-" * 65)
        print("[1] 1. Test Batch'i (İlk tur: 5 anonim mesaj, küfür eleme, konu kartları)")
        print("[2] 2. Test Batch'i (İkinci tur: Mevcut açık karta ekleme testi)")
        print("[3] Özel Metin Gir ve Tek Mesajlık Batch Test Et")
        print("[0] Çıkış")
        print("=" * 65)

        secim = input("Seçiminiz (0-3): ").strip()
        if secim == "0":
            print("Çıkış yapıldı.")
            break
        elif secim in ["1", "2"]:
            send_batch(SAMPLE_BATCHES[secim]["payload"])
        elif secim == "3":
            text = input("Test mesajını yazın: ").strip()
            if text:
                custom_payload = {
                    "lesson": {"subject": "Python", "topic": "Genel"},
                    "open_cards": [],
                    "messages": [{"message_id": f"m-custom-{int(time.time())}", "text": text}]
                }
                send_batch(custom_payload)
        else:
            print("Geçersiz seçim!")

if __name__ == "__main__":
    main()
