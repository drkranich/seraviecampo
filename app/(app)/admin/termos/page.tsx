import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { updateTerms } from "./actions";

type Term = { slug: string; title: string; content: string; version: number; updated_at: string };
type Acc = { id: string; user_id: string; terms_version: number; accepted_at: string; ip: string | null; country: string | null; device: string | null; full_name: string | null };

export default async function TermosAdminPage({
  searchParams,
}: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { profile } = await requireRole("super_admin");
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: term } = await supabase.from("legal_terms").select("*").eq("slug", "cancelamento").single();
  const t = term as Term | null;

  const { data: accData } = await supabase.from("term_acceptances")
    .select("id, user_id, terms_version, accepted_at, ip, country, device, full_name")
    .order("accepted_at", { ascending: false }).limit(200);
  const acceptances = (accData ?? []) as Acc[];

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} userName={profile?.full_name ?? "Administrador"} title="Termos e aceites" subtitle="Edite a política e acompanhe os aceites assinados.">
      {sp.ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Termos atualizados (nova versão publicada).</div>}
      {sp.error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(sp.error)}</div>}

      <section className="glass mb-8 rounded-2xl border border-campo-border p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg text-forest-100">Editar termo de cancelamento</h2>
          {t && <span className="rounded-full border border-campo-border px-3 py-1 text-xs text-stone-400">Versão atual: v{t.version}</span>}
        </div>
        <form action={updateTerms} className="space-y-3">
          <input type="hidden" name="slug" value="cancelamento" />
          <div>
            <label className="mb-1 block text-sm text-stone-300">Título</label>
            <input name="title" defaultValue={t?.title ?? ""} className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-stone-300">Conteúdo</label>
            <textarea name="content" defaultValue={t?.content ?? ""} rows={16} className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 font-mono text-xs leading-relaxed text-stone-100 outline-none focus:border-gold" />
          </div>
          <p className="text-xs text-stone-500">Ao salvar, uma nova versão é publicada. Aceites antigos guardam o texto da versão que foi assinada.</p>
          <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Publicar nova versão</button>
        </form>
      </section>

      <h2 className="mb-3 font-serif text-xl text-forest-100">Aceites registrados ({acceptances.length})</h2>
      {acceptances.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-8 text-center text-stone-400">Nenhum aceite ainda.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-campo-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-campo-surface2 text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Versão</th>
                <th className="px-4 py-3">Data/hora</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">País</th>
                <th className="px-4 py-3">Dispositivo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-campo-border glass">
              {acceptances.map((a) => (
                <tr key={a.id} className="transition hover:bg-campo-surface2">
                  <td className="px-4 py-3 text-forest-100">{a.full_name || a.user_id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-stone-400">v{a.terms_version}</td>
                  <td className="px-4 py-3 text-stone-400">{new Date(a.accepted_at).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-stone-400">{a.ip || "—"}</td>
                  <td className="px-4 py-3 text-stone-400">{a.country || "—"}</td>
                  <td className="px-4 py-3 text-stone-400">{a.device || "—"}</td>
                  <td className="px-4 py-3"><Link href={`/admin/termos/${a.id}`} className="text-xs text-gold hover:underline">Documento assinado →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
