from fastapi import FastAPI, Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import INTERNAL_API_KEY
from app.models import AnalyzeBatchRequest, AnalyzeBatchResponse
from app.gemini import analyze_batch_with_gemini
from app.summary import router as summary_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("apex-ai-main")

app = FastAPI(
    title="Apex AI Service",
    description="Öğrenci mesajlarını analiz eden ve öğretmen için özet kartları oluşturan AI servisi.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not INTERNAL_API_KEY:
        return True
    if credentials.credentials != INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz yetkilendirme anahtarı."
        )
    return True

app.include_router(summary_router)  # POST /summarize-batch (tek özet kartı modeli)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "apex-ai-service"}

@app.post("/analyze-batch", response_model=AnalyzeBatchResponse)
async def analyze_batch(
    request: AnalyzeBatchRequest,
    authenticated: bool = Depends(verify_token)
):
    """
    Öğrencilerden gelen 5 dakikalık toplu mesajları analiz eder.
    - Uygunsuz mesajları eler (reject).
    - Benzer soruları mevcut açık kartlara bağlar.
    - Yeni konular için yeni kartlar açar ve kısa özet sorular üretir.
    """
    logger.info(f"Toplu analiz isteği alındı: {len(request.messages)} mesaj, {len(request.open_cards)} açık kart.")
    response = await analyze_batch_with_gemini(request)
    return response

if __name__ == "__main__":
    import uvicorn
    from app.config import PORT
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
