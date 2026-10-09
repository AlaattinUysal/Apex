from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class LessonContext(BaseModel):
    subject: Optional[str] = Field(default=None, description="Ders adı, örn: Matematik")
    topic: Optional[str] = Field(default=None, description="Ders konusu, örn: Denklemler")

class OpenCard(BaseModel):
    card_id: str = Field(..., description="Mevcut kartın benzersiz ID'si, örn: c-12")
    topic_label: str = Field(..., description="Kartın konu etiketi, örn: İşaret değişimi")
    summary_text: str = Field(..., description="Kartta öğretmene görünen kısa soru/özet")

class IncomingMessage(BaseModel):
    message_id: str = Field(..., description="Mesajın benzersiz ID'si, örn: m-101")
    text: str = Field(..., description="Öğrencinin yazdığı ham metin")

class AnalyzeBatchRequest(BaseModel):
    lesson: Optional[LessonContext] = Field(default=None, description="Ders bilgisi")
    open_cards: List[OpenCard] = Field(default_factory=list, description="Şu an öğretmenin panelinde açık olan kartlar")
    messages: List[IncomingMessage] = Field(default_factory=list, description="5 dakikada biriken yeni mesajlar")

class MessageDecision(BaseModel):
    message_id: str
    decision: Literal["deliver", "reject"]
    reject_reason: Optional[Literal["abuse", "spam", "unclear", "off_topic"]] = None
    card_ref: Optional[str] = None

class NewCard(BaseModel):
    ref: str = Field(..., description="Referans adı, örn: new:1, new:2")
    topic_label: str = Field(..., description="Konu etiketi, örn: Anlatım hızı")
    summary_text: str = Field(..., description="Öğretmene gösterilecek kısa, doğal soru/özet (~15 kelime)")
    kind: Literal["question", "feedback"] = "question"

class UpdatedCard(BaseModel):
    card_id: str = Field(..., description="Güncellenen açık kartın ID'si")
    summary_text: str = Field(..., description="Yeni mesajlarla güncellenmiş özet soru")

class AnalyzeBatchResponse(BaseModel):
    messages: List[MessageDecision]
    new_cards: List[NewCard] = Field(default_factory=list)
    updated_cards: List[UpdatedCard] = Field(default_factory=list)
