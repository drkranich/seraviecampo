import { NextResponse } from "next/server";
import { createClient as createSb } from "@supabase/supabase-js";
import { createClient, createAuthedClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";

export const runtime = "nodejs";

const MAX = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado. Entre novamente." }, { status: 401 });
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const form = await req.formData();
  const file = form.get("file");
  const bucket = String(form.get("bucket") || "media");
  const folder = String(form.get("folder") || "geral").replace(/[^a-z0-9_-]/gi, "") || "geral";

  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Arquivo muito grande (máx. 8MB)." }, { status: 400 });
  if (bucket !== "media" && bucket !== "documents") return NextResponse.json({ error: "Bucket inválido." }, { status: 400 });

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${user.id}/${folder}-${Date.now()}.${ext}`;

  // Upload, em ordem de robustez:
  // 1) service-role (secret no servidor) -> ignora RLS com segurança;
  // 2) token do usuario via accessToken -> anexa o JWT a TODAS as requisicoes (Storage incluso).
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey && !token) {
    return NextResponse.json({ error: "Sessao sem token de acesso. Saia e entre novamente." }, { status: 401 });
  }
  const uploader = serviceKey
    ? createSb(SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : createAuthedClient(token as string);

  const { error } = await uploader.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });
  if (error) return NextResponse.json({ error: `${error.message} (bucket: ${bucket})` }, { status: 400 });

  if (bucket === "media") {
    const { data } = uploader.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  }
  return NextResponse.json({ path });
}
