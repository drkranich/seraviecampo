import { requireRole } from "@/lib/guard";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { IAAssistant } from "@/components/IAAssistant";
import { aiEnabled } from "@/lib/ai";

export default async function IAPage() {
  const { profile } = await requireRole("produtor");
  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="IA Rural" subtitle="Sua assistente para produzir e vender melhor.">
      <div className="mb-6 max-w-2xl rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-stone-300">
        <p><strong className="text-gold">Recurso pago à parte (por uso).</strong> A IA Rural <strong>não está incluída</strong> no seu plano da plataforma: é cobrada conforme o uso e exige um <strong>cartão de crédito próprio</strong> cadastrado para a IA. O valor do plano (Campo/Gourmet/Premium) continua separado e não cobre a IA.</p>
        <p className="mt-2 text-xs text-stone-500">Cadastro de cartão e cobrança por uso entram em breve. Por enquanto, o uso é cortesia durante os testes.</p>
      </div>
      {!aiEnabled() && (
        <div className="mb-6 max-w-2xl rounded-xl border border-campo-border bg-campo-surface2 px-4 py-3 text-sm text-stone-400">
          A IA Rural será ativada quando a plataforma configurar a chave de IA. A interface já está pronta — as respostas começam a funcionar assim que a chave estiver ativa.
        </div>
      )}
      <IAAssistant />
    </AppShell>
  );
}
