import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { stripeEnabled, getAccount } from "@/lib/stripe";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ refresh?: string; error?: string }>;
}) {
  const { user, profile } = await requireRole("produtor");
  const { refresh, error } = await searchParams;
  const supabase = await createClient();

  const { data: acc } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_charges_enabled")
    .eq("id", user.id)
    .single();
  let accountId = (acc?.stripe_account_id as string | null) ?? null;
  let chargesEnabled = Boolean(acc?.stripe_charges_enabled);

  // Atualiza status da conta conectada (ao voltar do onboarding ou no load)
  if (stripeEnabled() && accountId) {
    try {
      const acc = await getAccount(accountId);
      if (acc.charges_enabled !== chargesEnabled) {
        chargesEnabled = acc.charges_enabled;
        await supabase.from("profiles").update({ stripe_charges_enabled: chargesEnabled }).eq("id", user.id);
      }
    } catch {
      /* mantém status atual */
    }
  }

  const errMsg: Record<string, string> = {
    stripe_off: "A plataforma ainda não ativou o Stripe. Volte em breve.",
  };

  return (
    <AppShell
      badge="Produtor Rural" nav={PRODUTOR_NAV}
      userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil"
      title="Financeiro" subtitle="Receba os pagamentos dos seus clientes via Stripe."
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {errMsg[error] ?? decodeURIComponent(error)}
        </div>
      )}
      {refresh && chargesEnabled && (
        <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">
          Conta verificada — você já pode receber pagamentos.
        </div>
      )}

      <section className="glass max-w-2xl rounded-2xl border border-campo-border p-6">
        <h2 className="font-serif text-xl text-forest-100">Conta de recebimento (Stripe Connect)</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-400">
          A Seravie Campo conecta você ao cliente — o dinheiro das vendas cai direto na
          sua conta Stripe. Conecte-a uma vez para começar a cobrar.
        </p>

        <div className="mt-6">
          {!stripeEnabled() ? (
            <StatusBox tone="muted" title="Stripe em configuração">
              A integração de pagamentos será ativada pela plataforma. Assim que disponível,
              o botão de conectar aparece aqui.
            </StatusBox>
          ) : !accountId ? (
            <form action="/api/stripe/connect" method="post">
              <StatusBox tone="muted" title="Conta ainda não conectada">
                Conecte sua conta Stripe para receber os pagamentos dos pedidos.
              </StatusBox>
              <button className="mt-4 rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">
                Conectar conta Stripe
              </button>
            </form>
          ) : !chargesEnabled ? (
            <form action="/api/stripe/connect" method="post">
              <StatusBox tone="warn" title="Cadastro incompleto">
                Você começou a conexão, mas o Stripe ainda precisa de alguns dados.
                Continue o cadastro para liberar os recebimentos.
              </StatusBox>
              <button className="mt-4 rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">
                Continuar cadastro
              </button>
            </form>
          ) : (
            <StatusBox tone="ok" title="Conta conectada ✓">
              Tudo certo! Você já pode receber pagamentos dos clientes diretamente.
            </StatusBox>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function StatusBox({ tone, title, children }: { tone: "ok" | "warn" | "muted"; title: string; children: React.ReactNode }) {
  const styles = {
    ok: "border-forest-700 bg-forest-900/40 text-forest-200",
    warn: "border-gold/40 bg-gold/10 text-gold",
    muted: "border-campo-border bg-campo-surface2 text-stone-400",
  }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 ${styles}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs leading-relaxed opacity-90">{children}</p>
    </div>
  );
}
