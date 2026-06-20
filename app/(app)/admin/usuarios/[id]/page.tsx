import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { ROLE_LABEL, type UserRole } from "@/lib/roles";
import { VERIFICATION_LABEL, VERIFICATION_STYLE } from "@/lib/profile";
import { ViewDocumentButton } from "@/components/ViewDocumentButton";

export default async function UsuarioDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("super_admin");
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!data) notFound();
  const p = data as Record<string, unknown>;

  const { data: emails } = await supabase.rpc("admin_emails");
  const email = ((emails ?? []) as { id: string; email: string }[]).find((e) => e.id === id)?.email ?? "—";

  const { data: acc } = await supabase.from("term_acceptances").select("*").eq("user_id", id).order("accepted_at", { ascending: false });
  const acceptances = (acc ?? []) as { id: string; terms_slug: string; terms_version: number; accepted_at: string; ip: string | null; country: string | null; device: string | null }[];

  const str = (k: string) => (p[k] == null ? "—" : String(p[k]));
  const docUrl = p.document_url as string | null;
  const docType = (p.document_type as string | null) || "documento";
  const selfie = p.selfie_url as string | null;

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} title={str("full_name")} subtitle={`${ROLE_LABEL[(p.role as UserRole)] ?? "—"} · ${email}`}>
      <Link href="/admin/usuarios" className="mb-6 inline-block text-sm text-stone-400 hover:text-gold">← Voltar para usuários</Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-3 font-serif text-lg text-forest-100">Dados</h2>
          <Dl label="Nome" value={str("full_name")} />
          <Dl label="E-mail" value={email} />
          <Dl label="Telefone" value={str("phone")} />
          <Dl label="Papel" value={ROLE_LABEL[(p.role as UserRole)] ?? "—"} />
          <Dl label="Cidade/UF" value={[p.city, p.state].filter(Boolean).join(", ") || "—"} />
          <Dl label="Cadastro" value={new Date(str("created_at")).toLocaleString("pt-BR")} />
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-3 font-serif text-lg text-forest-100">Origem / segurança</h2>
          <Dl label="IP (último)" value={str("last_ip")} />
          <Dl label="País" value={str("last_country")} />
          <Dl label="Dispositivo" value={str("last_device")} />
          <div className="mt-3">
            <span className="text-xs uppercase tracking-wider text-stone-500">Verificação</span>
            <div className="mt-1">
              <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] ${VERIFICATION_STYLE[str("verification_status")]}`}>
                {VERIFICATION_LABEL[str("verification_status")] ?? str("verification_status")}
              </span>
            </div>
          </div>
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-3 font-serif text-lg text-forest-100">Documentos sensíveis</h2>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-stone-500">Identidade ({docType.toUpperCase()})</p>
              {docUrl ? <ViewDocumentButton path={docUrl} bucket="documents" label="🪪 Ver documento" /> : <p className="text-sm text-stone-500">Não enviado</p>}
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-stone-500">Verificação orofacial (selfie)</p>
              {selfie ? <ViewDocumentButton path={selfie} bucket="selfies" label="🙂 Ver orofacial" /> : <p className="text-sm text-stone-500">Não enviada</p>}
            </div>
          </div>
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-3 font-serif text-lg text-forest-100">Termos aceitos</h2>
          {acceptances.length === 0 ? (
            <p className="text-sm text-stone-500">Nenhum aceite registrado.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {acceptances.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <span className="text-stone-300">{a.terms_slug} v{a.terms_version} · {new Date(a.accepted_at).toLocaleString("pt-BR")}</span>
                  <Link href={`/admin/termos/${a.id}`} className="text-xs text-gold hover:underline">Ver assinado</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Dl({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-campo-border py-1.5">
      <span className="text-xs uppercase tracking-wider text-stone-500">{label}</span>
      <p className="text-sm text-forest-100">{value}</p>
    </div>
  );
}
