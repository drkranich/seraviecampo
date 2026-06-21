export function aiEnabled(): boolean {
  return !!process.env.AI_API_KEY?.trim();
}

export async function generateAI(system: string, user: string): Promise<string> {
  const key = process.env.AI_API_KEY?.trim();
  if (!key) throw new Error("IA não configurada");
  const base = process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1";
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
  if (!res.ok) throw new Error("AI error " + res.status);
  const j = await res.json();
  return (j.choices?.[0]?.message?.content ?? "").trim();
}
