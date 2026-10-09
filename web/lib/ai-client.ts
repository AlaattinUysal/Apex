import "server-only";

// AI servisi (Python/FastAPI) ile sözleşme: FAZ1.md §5 — POST /analyze-batch.
// Tarayıcı bu servisi asla çağırmaz; yalnızca Next.js sunucusu çağırır.

export type AnalyzeRequest = {
  lesson: { subject: string; topic: string };
  open_cards: { card_id: string; topic_label: string; summary_text: string }[];
  messages: { message_id: string; text: string }[];
};

export type RejectLabel = "abuse" | "spam" | "unclear" | "off_topic";

export type AnalyzeResponse = {
  messages: {
    message_id: string;
    decision: "deliver" | "reject";
    reject_reason: RejectLabel | null;
    card_ref: string | null; // mevcut card_id ya da new_cards[].ref
  }[];
  new_cards: { ref: string; topic_label: string; summary_text: string; kind: "question" | "feedback" }[];
  updated_cards: { card_id: string; summary_text: string }[];
};

const TIMEOUT_MS = 60_000;

export async function analyzeBatch(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  // AI_MOCK=1: AI servisi hazır değilken sözleşmeye uygun sahte cevap döner.
  const response =
    process.env.AI_MOCK === "1" ? mockAnalyze(request) : await callAiService(request);

  assertValid(request, response);
  return response;
}

async function callAiService(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const res = await fetch(`${process.env.AI_SERVICE_URL}/analyze-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`AI servisi ${res.status} döndü`);
  return (await res.json()) as AnalyzeResponse;
}

// Sözleşme kuralları: her message_id tam bir kez, deliver ise geçerli card_ref.
// Ertuğrul'un tarafı da doğruluyor; burada ikinci savunma hattı (bozuk cevap DB'ye yazılmasın).
function assertValid(request: AnalyzeRequest, response: AnalyzeResponse) {
  const sent = new Set(request.messages.map((m) => m.message_id));
  const seen = new Set<string>();
  const knownRefs = new Set([
    ...request.open_cards.map((c) => c.card_id),
    ...response.new_cards.map((c) => c.ref),
  ]);

  for (const m of response.messages) {
    if (!sent.has(m.message_id) || seen.has(m.message_id)) {
      throw new Error(`AI cevabı geçersiz: message_id ${m.message_id}`);
    }
    seen.add(m.message_id);
    if (m.decision === "deliver" && (!m.card_ref || !knownRefs.has(m.card_ref))) {
      throw new Error(`AI cevabı geçersiz: ${m.message_id} için card_ref yok`);
    }
  }
  if (seen.size !== sent.size) throw new Error("AI cevabı eksik: bazı mesajlar yanıtlanmamış");
}

function mockAnalyze(request: AnalyzeRequest): AnalyzeResponse {
  const first = request.open_cards[0];
  return {
    messages: request.messages.map((m, i) =>
      i === 0 && !first
        ? { message_id: m.message_id, decision: "deliver", reject_reason: null, card_ref: "new:1" }
        : { message_id: m.message_id, decision: "deliver", reject_reason: null, card_ref: first?.card_id ?? "new:1" },
    ),
    new_cards: first
      ? []
      : [{ ref: "new:1", topic_label: "Mock konu", summary_text: "Bu bir sahte kart.", kind: "question" }],
    updated_cards: [],
  };
}
