import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { getSite } from "@/lib/site";
import { updateSite } from "./actions";

const inputCls = "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold";
const labelCls = "mb-1 block text-sm text-stone-300";

export default async function SiteCmsPage({
  searchParams,
}: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { profile } = await requireRole("super_admin");
  const sp = await searchParams;
  const supabase = await createClient();
  const site = await getSite(supabase);

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} userName={profile?.full_name ?? "Administrador"} title="Site / CMS" subtitle="Edite a página pública de apresentação.">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/" target="_blank" className="text-sm text-gold hover:underline">Ver página pública →</Link>
      </div>
      {sp.ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Página atualizada.</div>}
      {sp.error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(sp.error)}</div>}

      <form action={updateSite} className="glass max-w-3xl space-y-4 rounded-2xl border border-campo-border p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelCls}>Marca</label><input name="brand" defaultValue={site.brand} className={inputCls} /></div>
          <div><label className={labelCls}>Texto do botão (CTA)</label><input name="hero_cta" defaultValue={site.hero_cta} className={inputCls} /></div>
        </div>
        <div><label className={labelCls}>Hero — kicker (linha pequena)</label><input name="hero_kicker" defaultValue={site.hero_kicker} className={inputCls} /></div>
        <div><label className={labelCls}>Hero — título</label><input name="hero_title" defaultValue={site.hero_title} className={inputCls} /></div>
        <div><label className={labelCls}>Hero — subtítulo</label><textarea name="hero_subtitle" defaultValue={site.hero_subtitle} rows={3} className={inputCls} /></div>

        <div><label className={labelCls}>Título “Como funciona”</label><input name="steps_title" defaultValue={site.steps_title} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Passos (JSON: lista de {"{ title, desc }"})</label>
          <textarea name="steps" defaultValue={JSON.stringify(site.steps, null, 2)} rows={8} className={`${inputCls} font-mono text-xs`} />
        </div>
        <div>
          <label className={labelCls}>Cartões de perfil (JSON: lista de {"{ tag, nome, desc }"})</label>
          <textarea name="perfis" defaultValue={JSON.stringify(site.perfis, null, 2)} rows={10} className={`${inputCls} font-mono text-xs`} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelCls}>CTA — título</label><input name="cta_title" defaultValue={site.cta_title} className={inputCls} /></div>
          <div><label className={labelCls}>CTA — texto</label><input name="cta_text" defaultValue={site.cta_text} className={inputCls} /></div>
        </div>
        <div className="rounded-xl border border-campo-border bg-campo-surface2/40 p-4">
          <p className="mb-2 text-sm font-medium text-forest-100">Avisos no topo de cada painel (deixe vazio para não exibir)</p>
          <div className="space-y-3">
            <div><label className={labelCls}>Aviso — Cliente</label><input name="aviso_cliente" defaultValue={site.avisos.cliente} className={inputCls} /></div>
            <div><label className={labelCls}>Aviso — Produtor</label><input name="aviso_produtor" defaultValue={site.avisos.produtor} className={inputCls} /></div>
            <div><label className={labelCls}>Aviso — Entregador</label><input name="aviso_entregador" defaultValue={site.avisos.entregador} className={inputCls} /></div>
          </div>
        </div>
        <div><label className={labelCls}>Rodapé</label><textarea name="footer" defaultValue={site.footer} rows={2} className={inputCls} /></div>

        <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Salvar página</button>
      </form>
    </AppShell>
  );
}
