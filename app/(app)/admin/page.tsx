import { requireRole } from "@/lib/guard";
import { greeting } from "@/lib/greeting";
import { AppShell, ModuleCard, ADMIN_NAV } from "@/components/AppShell";

export default async function AdminPage() {
  const { profile } = await requireRole("super_admin");
  return (
    <AppShell
      badge="Seravie OS"
      nav={ADMIN_NAV}
      userName={profile?.full_name ?? "Administrador"}
      title={greeting(profile?.full_name)}
      subtitle={`Bem-vindo, ${profile?.full_name || "Administrador"}. Você enxerga o ecossistema inteiro.`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard title="Dashboard Executivo" desc="Faturamento, GMV, produtores, clientes, cidades e taxa de crescimento." />
        <ModuleCard title="Mapa Nacional" desc="Produtores, clientes, pedidos e problemas por cidade do Brasil." />
        <ModuleCard title="Central de Aprovação" desc="Fila de novos produtores, entregadores e documentos — estilo Stripe." />
        <ModuleCard title="Central de Moderação" desc="Avaliações suspeitas, fraudes, denúncias e produtos irregulares." />
        <ModuleCard title="Inteligência Estratégica" desc="Tendências de produção e previsão de demanda regional." />
        <ModuleCard title="Economia Circular Local" desc="Quanto a comunidade movimentou e empregos gerados." />
      </div>
    </AppShell>
  );
}
