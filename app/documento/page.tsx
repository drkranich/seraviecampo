import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type UserRole } from "@/lib/roles";
import { Logo } from "@/components/Logo";
import { DocumentUpload } from "@/components/DocumentUpload";
import { saveDocument } from "./actions";

const DOC: Record<string, { type: "rg" | "cnh"; label: string }> = {
  entregador: { type: "cnh", label: "Carteira de Motorista (CNH)" },
  produtor: { type: "rg", label: "Carteira de identidade (RG) com foto" },
  cliente: { type: "rg", label: "Carteira de identidade (RG)" },
};

export default async function DocumentoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, document_url, kyc_exempt, face_verified")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "cliente") as UserRole;
  if (role === "super_admin" || profile?.kyc_exempt || profile?.document_url) {
    redirect(ROLE_HOME[role]);
  }
  if (!profile?.face_verified) redirect("/verificacao");

  const cfg = DOC[role] ?? DOC.cliente;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="glass rounded-2xl border border-campo-border p-8">
          <h1 className="font-serif text-2xl text-forest-100">Documento de identidade</h1>
          <p className="mt-1 text-sm text-stone-400">
            Para a segurança do ecossistema, envie seu documento. Ele é confidencial
            e visível apenas para você e para a verificação da plataforma.
          </p>
          {error && (
            <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</div>
          )}
          <form action={saveDocument} className="mt-6 space-y-4">
            <DocumentUpload userId={user.id} label={cfg.label} docType={cfg.type} />
            <button className="w-full rounded-lg bg-gold py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">
              Concluir cadastro
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-stone-600">Verificação de identidade · Política de privacidade</p>
      </div>
    </div>
  );
}
