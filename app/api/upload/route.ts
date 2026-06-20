import { NextResponse } from "next/server";
import { createClient as createSb } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";

export const runtime = "nodejs";

const MAX = 8 * 1024 * 1024;

export async function POST(req: Request) {
  // 1) Autenticação via cookie (sessão do usuário logado)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const bucket = String(form.get("bucket") || "media");
  const folder = String(form.get("folder") || "geral").replace(/[^a-z0-9_-]/gi, "");

  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Arquivo muito grande (máx. 8MB)." }, { status: 400 });
  if (bucket !== "media" && bucket !== "documents") return NextResponse.json({ error: "Bucket inválido." }, { status: 400 });

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${user.id}/${folder || "geral"}-${Date.now()}.${ext}`;

  // 2) Upload: usa service-role se disponível (bypassa RLS com segurança no servidor),
  //    senão usa o cliente cookie autenticado (que satisfaz a policy <uid>/...).
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const uploader = serviceKey
    ? createSb(SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : supabase;

  const { error } = await uploader.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (bucket === "media") {
    const { data } = uploader.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  }
  return NextResponse.json({ path });
}
