import json
import time
import urllib.request
import urllib.error

WEBHOOK_URL = "http://localhost:5678/webhook/yeni-mesaj"
TEST_WEBHOOK_URL = "http://localhost:5678/webhook-test/yeni-mesaj"

current_url = WEBHOOK_URL

MESAJLAR = [
    {
        "id": 1,
        "kullanici": "Ahmet",
        "mesaj": 'Hocam for döngüsüyle listeyi gezerken "IndexError: list index out of range" hatası alıyorum, neden olabilir?',
        "aciklama": "for döngüsünde IndexError hatası"
    },
    {
        "id": 2,
        "kullanici": "Zeynep",
        "mesaj": "Listede son elemana ulaşmaya çalışırken IndexError veriyor, len() fonksiyonu kullanırken bir yeri mi kaçırıyorum?",
        "aciklama": "len() ve liste son eleman IndexError (Benzer Hata)"
    },
    {
        "id": 3,
        "kullanici": "Mehmet",
        "mesaj": "Fonksiyon içinde return kullanmak ile sadece print yazmak arasındaki fark nedir hocam?",
        "aciklama": "return vs print farkı"
    },
    {
        "id": 4,
        "kullanici": "Burak",
        "mesaj": "Boş yapma hoca ders çok sıkıcı böyle ders mi anlatılır kapat git ya",
        "aciklama": "Uygunsuz / kaba mesaj (Filtrelenmesi gereken)"
    },
    {
        "id": 5,
        "kullanici": "Elif",
        "mesaj": "Hocam bir listeye başka bir listeyi eklerken append() mi yoksa extend() mi kullanmalıyız?",
        "aciklama": "append() vs extend() farkı"
    }
]

def mesaj_gonder(kullanici, mesaj):
    payload = json.dumps({"kullanici": kullanici, "mesaj": mesaj}).encode("utf-8")
    req = urllib.request.Request(
        current_url,
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST"
    )
    print(f"\n📤 Gönderiliyor: [{kullanici}] -> {mesaj}")
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            print(f"✅ Yanıt ({response.status}): {res_body}")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="ignore")
        print(f"⚠️ HTTP Hatası ({e.code}): {error_body}")
    except Exception as e:
        print(f"❌ Bağlantı Hatası: {e}")

def main():
    global current_url
    while True:
        mode_str = "PROD (/webhook/)" if current_url == WEBHOOK_URL else "TEST (/webhook-test/)"
        print("\n" + "=" * 65)
        print("          n8n ÖĞRENCİ MESAJ GÖNDERME PANELİ (PYTHON)")
        print("=" * 65)
        print(f"Hedef URL: {current_url} [{mode_str}]")
        print("-" * 65)
        for m in MESAJLAR:
            print(f"[{m['id']}] {m['kullanici']:<7} : {m['aciklama']}")
        print("\n[6] TÜMÜNÜ SIRAYLA GÖNDER (2 sn arayla)")
        print("[7] Kendin özel mesaj yazıp gönder")
        print("[8] URL Modunu Değiştir (Test / Üretim)")
        print("[0] Çıkış")
        print("=" * 65)

        secim = input("Seçiminiz (0-8): ").strip()
        if secim == "0":
            print("Çıkış yapıldı.")
            break
        elif secim in ["1", "2", "3", "4", "5"]:
            idx = int(secim) - 1
            mesaj_gonder(MESAJLAR[idx]["kullanici"], MESAJLAR[idx]["mesaj"])
        elif secim == "6":
            print("\n🚀 Tüm mesajlar sırayla gönderiliyor...")
            for i, m in enumerate(MESAJLAR, 1):
                print(f"\n[{i}/5] Gönderiliyor...")
                mesaj_gonder(m["kullanici"], m["mesaj"])
                if i < len(MESAJLAR):
                    time.sleep(2)
            print("\n✨ Tüm mesajlar gönderildi!")
        elif secim == "7":
            ad = input("\nÖğrenci Adı: ").strip() or "Anonim"
            msg = input("Mesaj: ").strip()
            if msg:
                mesaj_gonder(ad, msg)
            else:
                print("Boş mesaj gönderilmedi.")
        elif secim == "8":
            if current_url == WEBHOOK_URL:
                current_url = TEST_WEBHOOK_URL
            else:
                current_url = WEBHOOK_URL
            print(f"\n🔄 URL Değiştirildi -> {current_url}")
        else:
            print("Geçersiz seçim!")

if __name__ == "__main__":
    main()
