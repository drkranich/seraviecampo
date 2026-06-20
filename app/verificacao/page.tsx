import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type UserRole } from "@/lib/roles";
import { Logo } from "@/components/Logo";
import { FaceCapture } from "@/components/FaceCapture";

export default async function VerificacaoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, face_verified")
    .eq("id", user.id)
    .single();

  if (profile?.face_verified) {
    redirect(ROLE_HOME[(profile.role ?? "cliente") as UserRole]);
  }

  // URL e QR para concluir no celular (sem dependência de chaves)
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const mobileUrl = `${proto}://${host}/verificacao`;
  let qrSvg = "";
  try {
    qrSvg = await QRCode.toString(mobileUrl, {
      type: "svg",
      margin: 1,
      color: { dark: "#E7E9DB", light: "#00000000" },
    });
  } catch {
    qrSvg = "";
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="glass rounded-2xl border border-campo-border p-8">
          <h1 className="font-serif text-2xl text-forest-100">Confirmação facial</h1>
          <p className="mt-1 text-sm text-stone-400">
            Para a segurança do ecossistema, confirme que é você. Centralize o rosto na
            moldura e capture. Sua imagem é privada e usada apenas para verificação.
          </p>
          <div className="mt-6">
            <FaceCapture userId={user.id} mobileUrl={mobileUrl} qrSvg={qrSvg} />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-stone-600">
          Verificação de identidade · Política de privacidade
        </p>
      </div>
    </div>
  );
}
