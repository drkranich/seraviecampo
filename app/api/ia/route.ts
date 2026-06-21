import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiEnabled, generateAI } from "@/lib/ai";

export const runtime = "nodejs";

const SYSTEM = "Você é a IA Rural da Seravie Campo, uma assistente para produtores rurais. Responda em português do Brasil, de forma prática, objetiva e acionável. Evite floreios.";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!aiEnabled()) return NextResponse.json({ error: "A IA Rural ainda não foi ativada pela plataforma (falta a chave AI_API_KEY)." }, { status: 503 });

  let body: { kind?: string; prompt?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida." }, { status: 400 }); }
  const prompt = (body.prompt || "").trim();
  const kind = body.kind || "livre";

  let userMsg = prompt;
  if (kind === "producao") userMsg = `Sugira o que e quanto produzir para vender melhor nas próximas semanas, considerando sazonalidade e demanda local. Contexto do produtor: ${prompt || "(sem contexto adicional)"}.`;
  else if (kind === "descricao") userMsg = `Escreva uma descrição atraente e honesta (máx. 60 palavras) para a vitrine deste produto: ${prompt}.`;
  else if (kind === "preco") userMsg = `Dê uma faixa de preço sugerida e justificativa curta para: ${prompt}. Considere qualidade artesanal e mercado local.`;
  if (!userMsg) return NextResponse.json({ error: "Escreva sua pergunta." }, { status: 400 });

  try {
    const text = await generateAI(SYSTEM, userMsg);
    return NextResponse.json({ text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao consultar a IA.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
