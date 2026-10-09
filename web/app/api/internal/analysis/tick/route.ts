import { timingSafeEqual } from "node:crypto";
import { runAnalysis } from "@/lib/analysis";
import { createAdminClient } from "@/lib/supabase/admin";

// n8n her 5 dakikada bir burayı çağırır. Yalnızca INTERNAL_API_KEY ile erişilir.
// Canlı olan tüm derslerin kuyruğunu işler (kuyruk boşsa hiçbir şey yapmaz).
export async function POST(request: Request) {
  const expected = process.env.INTERNAL_API_KEY;
  const given = request.headers.get("authorization") ?? "";
  if (!expected || !safeEqual(given, `Bearer ${expected}`)) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { data: lessons } = await createAdminClient().from("lessons").select("id").eq("status", "live");

  const results = [];
  for (const lesson of lessons ?? []) {
    results.push({ lesson_id: lesson.id, ...(await runAnalysis(lesson.id)) });
  }
  return Response.json({ lessons: results.length, results });
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
