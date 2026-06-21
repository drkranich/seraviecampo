import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { IAAssistant } from "@/components/IAAssistant";
import { aiEnabled, AI_PER_USE_CENTS } from "@/lib/ai";
import { stripeEnabled } from "@/lib/stripe";
import { formatBRL } from "@/lib/catalog";

export default async function IAPage({
  searchParams,
}: { searchParams: Promise<{ card?: string }> }) {
  const { user, profile } = await requireRole("produtor");
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: prof } = await supabase.from("profiles").select("ai_card_added").eq("id", user.id).single();
  const hasCard = Boolean(prof?.ai_card_added);
  const period = new Date().toISOString().slice(0, 7);
  const { data: u } = await supabase.from("ai_usage").select("count, cost_cents").eq("producer_id", user.id).eq("period", period).maybeSingle();
  const count = (u?.count as number) ?? 0;
  const cost = (u?.cost_cents as number) ?? 0;

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="IA Rural" subtitle="Sua assistente para produzir e vender melhor.">
      {sp.card === "ok" && <div className="mb-4 max-w-2xl rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Cartão cadastrado! A IA Rural está liberada.</div>}
      {sp.card === "cancel" && <div className="mb-4 max-w-2xl rounded-lg border border-campo-border bg-campo-surface2 px-3 py-2 text-sm text-stone-400">Cadastro de cartão não concluído.</div>}
      {sp.card === "erro" && <div className="mb-4 max-w-2xl rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">Não foi possível abrir o cadastro de cartão. Tente novamente.</div>}

      <div className="mb-6 max-w-2xl rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-stone-300">
        <p><strong className="text-gold">Recurso pago à parte (por uso):</strong> {formatBRL(AI_PER_USE_CENTS)} por consulta. <strong>Não está incluída</strong> no seu plano da plataforma e é cobrada no <strong>cartão próprio da IA</strong> que você cadastrar — separado da mensalidade.</p>
      </div>

      {stripeEnabled() && (
        <div className="mb-6 max-w-2xl rounded-2xl border border-campo-border glass p-5">
          {hasCard ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-forest-200">Cartão cadastrado ✓</p>
                <p className="mt-1 text-xs text-stone-400">Uso de {period}: <strong className="text-gold">{count}</strong> consulta(s) · <strong className="text-gold">{formatBRL(cost)}</strong> (cobrado no fim do mês).</p>
              </div>
              <form action="/api/stripe/ia-card" method="post">
                <button className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Trocar cartão</button>
              </form>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-300">Cadastre um cartão para liberar a IA. A cobrança é por uso, à parte do plano.</p>
              <form action="/api/stripe/ia-card" method="post">
                <button className="rounded-lg bg-gold px-5 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Cadastrar cartão para a IA</button>
              </form>
            </div>
          )}
        </div>
      )}

      {!aiEnabled() && (
        <div className="mb-6 max-w-2xl rounded-xl border border-campo-border bg-campo-surface2 px-4 py-3 text-sm text-stone-400">
          A IA Rural será ativada quando a plataforma configurar a chave de IA. A interface já está pronta.
        </div>
      )}

      <IAAssistant />
    </AppShell>
  );
}
