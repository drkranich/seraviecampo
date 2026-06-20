import { requireRole } from "@/lib/guard";
import { greeting } from "@/lib/greeting";
import { AppShell, ModuleCard, ENTREGADOR_NAV } from "@/components/AppShell";

export default async function EntregadorPage() {
  const { profile } = await requireRole("entregador");
  return (
    <AppShell
      badge="Entregador"
      nav={ENTREGADOR_NAV}
      userName={profile?.full_name ?? "Entregador"}
      title={greeting(profile?.full_name)}
      subtitle="Suas rotas e ganhos do dia."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard title="Rotas" desc="Rotas otimizadas com entregas colaborativas por região." />
        <ModuleCard title="Ganhos" desc="Acompanhe comissões e pagamentos." />
        <ModuleCard title="Entregas Pendentes" desc="Próximas coletas e entregas com GPS integrado." />
        <ModuleCard title="Histórico" desc="Entregas concluídas e comprovantes por foto." />
      </div>
    </AppShell>
  );
}
