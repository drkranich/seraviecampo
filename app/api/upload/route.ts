import { NextResponse } from "next/server";
import { createClient as createSb } from "@supabase/supabase-js";
import { createClient, createAuthedClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";

export const runtime = "nodejs";

const MAX = 8 * 1024 * 1024;
const BUCKETS = ["media", "documents", "proofs", "support"];

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
  const orderId = String(form.get("order_id") || "").trim();
  const threadId = String(form.get("thread_id") || "").trim();

  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Arquivo muito grande (máx. 8MB)." }, { status: 400 });
  if (!BUCKETS.includes(bucket)) return NextResponse.json({ error: "Bucket inválido." }, { status: 400 });
  if (bucket === "proofs" && !orderId) return NextResponse.json({ error: "Pedido não informado." }, { status: 400 });
  if (bucket === "support" && !threadId) return NextResponse.json({ error: "Conversa não informada." }, { status: 400 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey && !token) return NextResponse.json({ error: "Sessão sem token. Saia e entre novamente." }, { status: 401 });
  const uploader = serviceKey
    ? createSb(SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : createAuthedClient(token as string);

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const prefix = bucket === "proofs" ? orderId : bucket === "support" ? threadId : user.id;
  const path = `${prefix}/${folder}-${Date.now()}.${ext}`;

  const { error } = await uploader.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (error) return NextResponse.json({ error: `${error.message} (bucket: ${bucket})` }, { status: 400 });

  if (bucket === "media") {
    const { data } = uploader.storage.from("media").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  }
  if (bucket === "proofs" || bucket === "support") {
    const { data } = await uploader.storage.from(bucket).createSignedUrl(path, 3600);
    return NextResponse.json({ path, url: data?.signedUrl ?? null });
  }
  return NextResponse.json({ path });
}
