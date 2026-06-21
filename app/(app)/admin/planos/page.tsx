import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { ConfirmButton } from "@/components/ConfirmButton";
import { FancySelect } from "@/components/FancySelect";
import { getPlans, type DbPlan } from "@/lib/plans-db";
import { updatePlan, createPlan, deletePlan } from "./actions";

const inputCls = "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold";
const ROLE_LABEL: Record<string, string> = { produtor: "Produtor", cliente: "Cliente", entregador: "Entregador" };
function reais(cents: number) { return (cents / 100).toFixed(2).replace(".", ","); }

export default async function PlanosCmsPage({
  searchParams,
}: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { profile } = await requireRole("super_admin");
  const sp = await searchParams;
  const supabase = await createClient();
  const plans = await getPlans(supabase);
  const roles = ["produtor", "cliente", "entregador"];

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} userName={profile?.full_name ?? "Administrador"} title="Planos" subtitle="Criar, editar e excluir planos. Ao mudar o preço, um novo price é criado no Stripe.">
      {sp.ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Planos atualizados.</div>}
      {sp.error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(sp.error)}</div>}

      {/* Novo plano */}
      <details className="glass mb-8 rounded-2xl border border-gold/30 p-5">
        <summary className="cursor-pointer font-serif text-lg text-gold">+ Adicionar plano</summary>
        <form action={createPlan} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs text-stone-400">Identificador (slug, ex.: produtor_max)</label><input name="id" className={inputCls} placeholder="produtor_max" /></div>
          <div><label className="mb-1 block text-xs text-stone-400">Papel</label><FancySelect name="role" defaultValue="produtor" options={roles.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} /></div>
          <div><label className="mb-1 block text-xs text-stone-400">Nome</label><input name="name" className={inputCls} /></div>
          <div><label className="mb-1 block text-xs text-stone-400">Subtítulo</label><input name="tagline" className={inputCls} /></div>
          <div><label className="mb-1 block text-xs text-stone-400">Preço (R$/mês)</label><input name="price" inputMode="decimal" className={inputCls} placeholder="0,00" /></div>
          <div><label className="mb-1 block text-xs text-stone-400">Comissão (%)</label><input name="commission_pct" inputMode="numeric" className={inputCls} placeholder="—" /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-xs text-stone-400">Benefícios (1 por linha)</label><textarea name="features" rows={4} className={`${inputCls} text-xs`} /></div>
          <button className="w-fit rounded-lg bg-gold px-6 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light sm:col-span-2">Criar plano</button>
        </form>
      </details>

      {roles.map((role) => (
        <section key={role} className="mb-8">
          <h2 className="mb-3 font-serif text-xl text-forest-100">{ROLE_LABEL[role]}</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.filter((p: DbPlan) => p.role === role).map((p: DbPlan) => (
              <div key={p.id} className="glass rounded-2xl border border-campo-border p-5">
                <form action={updatePlan} className="space-y-3">
                  <input type="hidden" name="id" value={p.id} />
                  <p className="text-xs uppercase tracking-wider text-stone-500">{p.id}{p.stripe_price_id ? " · price ✓" : ""}</p>
                  <div><label className="mb-1 block text-xs text-stone-400">Nome</label><input name="name" defaultValue={p.name} className={inputCls} /></div>
                  <div><label className="mb-1 block text-xs text-stone-400">Subtítulo</label><input name="tagline" defaultValue={p.tagline} className={inputCls} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="mb-1 block text-xs text-stone-400">Preço (R$/mês)</label><input name="price" defaultValue={reais(p.price_cents)} inputMode="decimal" className={inputCls} /></div>
                    <div><label className="mb-1 block text-xs text-stone-400">Comissão (%)</label><input name="commission_pct" defaultValue={p.commission_pct ?? ""} inputMode="numeric" placeholder="—" className={inputCls} /></div>
                  </div>
                  <div><label className="mb-1 block text-xs text-stone-400">Benefícios (1 por linha)</label><textarea name="features" defaultValue={(p.features ?? []).join("\n")} rows={5} className={`${inputCls} text-xs`} /></div>
                  <label className="flex items-center gap-2 text-sm text-stone-300"><input type="checkbox" name="active" defaultChecked={p.active} className="accent-gold" /> Ativo</label>
                  <button className="w-full rounded-lg bg-gold py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Salvar</button>
                </form>
                <form action={deletePlan} className="mt-2">
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton message={`Excluir o plano "${p.name}"? Quem já assina não é afetado, mas ele some das opções.`} className="w-full rounded-lg border border-red-900/50 py-2 text-xs text-red-300 transition hover:bg-red-950/40">Excluir plano</ConfirmButton>
                </form>
              </div>
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
