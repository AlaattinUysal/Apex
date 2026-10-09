import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
# Model sırası: ilki dolarsa (429) sıradaki denenir. Virgülle ayrılmış liste.
GEMINI_MODELS = [
    m.strip()
    for m in os.getenv("GEMINI_MODELS", "gemini-3.5-flash-lite,gemini-3.1-flash-lite").split(",")
    if m.strip()
]
GEMINI_MODEL = GEMINI_MODELS[0]  # eski ad, uyumluluk için
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "").strip()
if not INTERNAL_API_KEY:
    raise RuntimeError("HATA: INTERNAL_API_KEY ortam değişkeni tanımlanmamış. Güvenlik için servis başlatılamıyor.")

PORT = int(os.getenv("PORT", "8000"))

