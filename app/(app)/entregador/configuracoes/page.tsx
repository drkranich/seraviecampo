import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ENTREGADOR_NAV } from "@/components/AppShell";
import { DocumentUpload } from "@/components/DocumentUpload";
import { stripeEnabled } from "@/lib/stripe";
import {
  refreshStripeAccountStatus,
  stripeAccountReady,
  stripeAccountStatusFromProfile,
  stripeAccountStatusText,
  stripeAccountStatusTitle,
  stripeConnectVersion,
} from "@/lib/stripe-connect";
import { updateVehicle } from "./actions";

const inputCls = "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold";
const labelCls = "mb-1 block text-sm text-stone-300";

export default async function ConfigEntregadorPage({
  searchParams,
}: { searchParams: Promise<{ ok?: string; error?: string; refresh?: string }> }) {
  const { user, profile } = await requireRole("entregador");
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles")
    .select("vehicle_type, vehicle_plate, document_url, stripe_account_id, stripe_charges_enabled, stripe_account_version, stripe_account_status, stripe_transfers_status, stripe_requirements_due, stripe_requirements_past_due")
    .eq("id", user.id).single();
  const p = (data ?? {}) as {
    vehicle_type?: string | null;
    vehicle_plate?: string | null;
    document_url?: string | null;
    stripe_account_id?: string | null;
    stripe_charges_enabled?: boolean | null;
    stripe_account_version?: string | null;
    stripe_account_status?: string | null;
    stripe_transfers_status?: string | null;
    stripe_requirements_due?: string[] | null;
    stripe_requirements_past_due?: string[] | null;
  };

  const accountId = p.stripe_account_id ?? null;
  const accountVersion = stripeConnectVersion(p.stripe_account_version);
  let accountStatus = stripeAccountStatusFromProfile(p);
  let chargesEnabled = stripeAccountReady(p);
  if (stripeEnabled() && accountId) {
    try {
      const status = await refreshStripeAccountStatus(supabase, user.id, accountId, accountVersion);
      accountStatus = status.accountStatus;
      chargesEnabled = status.ready;
    } catch { /* mantém */ }
  }

  const errMsg: Record<string, string> = {
    stripe_off: "Pagamento online temporariamente indisponível. Tente novamente em instantes ou acione o suporte.",
    connect_setup: "Não foi possível abrir o onboarding do Stripe agora. Tente novamente em instantes.",
  };

  return (
    <AppShell badge="Entregador" nav={ENTREGADOR_NAV} userName={profile?.full_name ?? "Entregador"} title="Configurações" subtitle="Veículo, recebimentos, documentos e conta.">
      {sp.ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Dados atualizados.</div>}
      {sp.refresh && chargesEnabled && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Conta verificada — você já pode receber.</div>}
      {sp.error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{errMsg[sp.error] ?? decodeURIComponent(sp.error)}</div>}

      <section className="glass mb-4 max-w-2xl rounded-2xl border border-campo-border p-6">
        <h2 className="font-serif text-lg text-forest-100">Recebimentos (Stripe)</h2>
        <p className="mt-2 text-sm text-stone-400">A Seravie Campo processa os fretes via Stripe e repassa seus valores para a conta conectada, com a taxa da plataforma descontada.</p>
        <div className="mt-4">
          {!stripeEnabled() ? (
            <div className="rounded-xl border border-campo-border bg-campo-surface2 px-4 py-3 text-sm text-stone-400">Pagamento online temporariamente indisponível. Tente novamente em instantes.</div>
          ) : !accountId ? (
            <form action="/api/stripe/connect" method="post">
              <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Conectar conta Stripe</button>
            </form>
          ) : !chargesEnabled ? (
            <form action="/api/stripe/connect" method="post">
              <div className="mb-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
                <strong>{stripeAccountStatusTitle(accountStatus)}.</strong> {stripeAccountStatusText(Boolean(accountId), accountStatus)}
              </div>
              <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Continuar cadastro</button>
            </form>
          ) : (
            <div className="rounded-xl border border-forest-700 bg-forest-900/40 px-4 py-3 text-sm text-forest-200">Conta conectada ✓ Você já pode receber pelos fretes.</div>
          )}
        </div>
      </section>

      <form action={updateVehicle} className="glass mb-4 max-w-2xl space-y-4 rounded-2xl border border-campo-border p-6">
        <h2 className="font-serif text-lg text-forest-100">Veículo</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Tipo de veículo</label>
            <input name="vehicle_type" defaultValue={p.vehicle_type ?? ""} className={inputCls} placeholder="Moto, carro, bicicleta…" />
          </div>
          <div>
            <label className={labelCls}>Placa</label>
            <input name="vehicle_plate" defaultValue={p.vehicle_plate ?? ""} className={inputCls} placeholder="ABC1D23" />
          </div>
        </div>
        <DocumentUpload userId={user.id} label="CNH (carteira de motorista)" docType="cnh" currentPath={p.document_url} />
        <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Salvar</button>
      </form>

      <section className="glass max-w-2xl rounded-2xl border border-campo-border p-6">
        <h2 className="font-serif text-lg text-forest-100">Conta</h2>
        <p className="mt-2 text-sm text-stone-400">E-mail: <span className="text-stone-200">{user.email}</span></p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/entregador/perfil" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Editar perfil</Link>
          <Link href="/entregador/assinatura" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Meu plano</Link>
        </div>
        <form action="/auth/signout" method="post" className="mt-4">
          <button className="rounded-lg border border-red-900/50 px-4 py-2 text-sm text-red-300 transition hover:bg-red-950/40">Sair da conta</button>
        </form>
      </section>
    </AppShell>
  );
}
