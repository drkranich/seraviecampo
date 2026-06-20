import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { updateClienteProfile } from "./actions";

const inputCls = "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold";
const labelCls = "mb-1 block text-sm text-stone-300";

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { user, profile } = await requireRole("cliente");
  const { ok, error } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("profiles").select("full_name, phone, city, state").eq("id", user.id).single();
  const p = (data ?? {}) as { full_name?: string | null; phone?: string | null; city?: string | null; state?: string | null };

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} title="Minha conta" subtitle="Seus dados para entregas mais rápidas.">
      {ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Dados atualizados.</div>}
      {error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</div>}

      <form action={updateClienteProfile} className="max-w-xl space-y-4 rounded-2xl border border-campo-border glass p-6">
        <div>
          <label className={labelCls}>Nome completo</label>
          <input name="full_name" defaultValue={p.full_name ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Telefone / WhatsApp</label>
          <input name="phone" defaultValue={p.phone ?? ""} className={inputCls} placeholder="(31) 9...." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Cidade</label>
            <input name="city" defaultValue={p.city ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Estado (UF)</label>
            <input name="state" defaultValue={p.state ?? ""} maxLength={2} className={inputCls} />
          </div>
        </div>
        <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Salvar</button>
      </form>
    </AppShell>
  );
}
