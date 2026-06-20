import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { ROLE_LABEL, type UserRole } from "@/lib/roles";
import { VERIFICATION_LABEL, VERIFICATION_STYLE } from "@/lib/profile";

type Prof = { id: string; role: UserRole; full_name: string | null; verification_status: string; created_at: string };

export default async function ModeracaoPage() {
  const { profile } = await requireRole("super_admin");
  const supabase = await createClient();

  const [{ data: pend }, { count: disputasAbertas }, { data: recent }] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, verification_status, created_at").in("verification_status", ["pendente", "em_analise"]).order("created_at", { ascending: false }),
    supabase.from("disputes").select("id", { count: "exact", head: true }).in("status", ["aberta", "em_analise"]),
    supabase.from("profiles").select("id, role, full_name, verification_status, created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const pendentes = (pend ?? []) as Prof[];
  const recentes = (recent ?? []) as Prof[];

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} userName={profile?.full_name ?? "Administrador"} title="Moderação" subtitle="Verificações, disputas e novos cadastros.">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card label="Verificações pendentes" value={String(pendentes.length)} accent={pendentes.length > 0} />
        <Link href="/admin/disputas" className="glass rounded-2xl border border-campo-border p-5 transition hover:border-gold/50">
          <p className="text-xs uppercase tracking-wider text-stone-500">Disputas em aberto</p>
          <p className={`mt-2 font-serif text-2xl ${(disputasAbertas ?? 0) > 0 ? "text-gold" : "text-forest-100"}`}>{disputasAbertas ?? 0}</p>
          <p className="mt-1 text-xs text-gold">Resolver →</p>
        </Link>
        <Card label="Novos (recentes)" value={String(recentes.length)} />
      </div>

      <h2 className="mb-3 font-serif text-lg text-forest-100">Aguardando verificação</h2>
      {pendentes.length === 0 ? (
        <div className="mb-8 rounded-2xl border border-dashed border-campo-border glass p-8 text-center text-sm text-stone-400">Nenhuma verificação pendente.</div>
      ) : (
        <div className="mb-8 overflow-hidden rounded-2xl border border-campo-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-campo-surface2 text-xs uppercase tracking-wider text-stone-500">
              <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Papel</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-campo-border glass">
              {pendentes.map((u) => (
                <tr key={u.id} className="transition hover:bg-campo-surface2">
                  <td className="px-4 py-3 text-forest-100">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 text-stone-400">{ROLE_LABEL[u.role]}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-[0.65rem] ${VERIFICATION_STYLE[u.verification_status]}`}>{VERIFICATION_LABEL[u.verification_status]}</span></td>
                  <td className="px-4 py-3"><Link href={`/admin/usuarios/${u.id}`} className="text-xs text-gold hover:underline">Analisar →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-3 font-serif text-lg text-forest-100">Cadastros recentes</h2>
      <div className="space-y-2">
        {recentes.map((u) => (
          <Link key={u.id} href={`/admin/usuarios/${u.id}`} className="glass flex items-center justify-between rounded-xl border border-campo-border p-3 transition hover:border-gold/50">
            <span className="text-sm text-forest-100">{u.full_name || "—"} <span className="text-stone-500">· {ROLE_LABEL[u.role]}</span></span>
            <span className="text-xs text-stone-500">{new Date(u.created_at).toLocaleDateString("pt-BR")}</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl border border-campo-border p-5">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 font-serif text-2xl ${accent ? "text-gold" : "text-forest-100"}`}>{value}</p>
    </div>
  );
}
