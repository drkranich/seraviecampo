import { requireRole } from "@/lib/guard";
import { AppShell, ModuleCard, ENTREGADOR_NAV } from "@/components/AppShell";
import { PasskeyManager } from "@/components/PasskeyManager";

export default async function ConfigEntregadorPage() {
  const { profile } = await requireRole("entregador");
  return (
    <AppShell badge="Entregador" nav={ENTREGADOR_NAV} userName={profile?.full_name ?? "Entregador"} title="Configurações" subtitle="Conta e segurança.">
      <div className="space-y-6">
        <PasskeyManager />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard title="Dados bancários" desc="Conta para receber suas comissões (Stripe Connect)." />
          <ModuleCard title="Documentos" desc="CNH e documento do veículo para verificação." />
          <ModuleCard title="Notificações" desc="Avisos de novas entregas na sua região." />
        </div>
      </div>
    </AppShell>
  );
}
