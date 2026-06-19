import { requireRole } from "@/lib/guard";
import { AppShell, ModuleCard } from "@/components/AppShell";

export default async function EntregadorPage() {
  const { profile } = await requireRole("entregador");
  return (
    <AppShell
      badge="Entregador"
      title={`Olá, ${profile?.full_name?.split(" ")[0] || "entregador"}!`}
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
