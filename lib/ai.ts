export function aiEnabled(): boolean {
  return !!process.env.AI_API_KEY?.trim();
}

export async function generateAI(system: string, user: string): Promise<string> {
  const key = process.env.AI_API_KEY?.trim();
  if (!key) throw new Error("IA não configurada");
  const base = (process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.AI_MODEL?.trim() || "gpt-4o-mini";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    // expõe o motivo real (status + trecho da resposta) para diagnóstico
    throw new Error(`Gemini/IA ${res.status}: ${raw.slice(0, 300)}`);
  }
  let j: { choices?: { message?: { content?: string } }[] };
  try { j = JSON.parse(raw); } catch { throw new Error("Resposta da IA não é JSON válido."); }
  return (j.choices?.[0]?.message?.content ?? "").trim();
}
