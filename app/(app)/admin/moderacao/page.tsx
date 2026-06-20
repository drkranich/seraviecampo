import { requireRole } from "@/lib/guard";
import { AppShell, ModuleCard, ADMIN_NAV } from "@/components/AppShell";

export default async function ModeracaoPage() {
  const { profile } = await requireRole("super_admin");
  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} userName={profile?.full_name ?? "Administrador"} title="Moderação" subtitle="Integridade do ecossistema.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard title="Avaliações suspeitas" desc="Detecção de avaliações fraudulentas ou em massa." />
        <ModuleCard title="Denúncias" desc="Fila de denúncias de produtos e usuários." />
        <ModuleCard title="Central de Conflitos" desc="Registro de disputas com fotos, horários e geolocalização." />
        <ModuleCard title="Produtos irregulares" desc="Itens fora das políticas da plataforma." />
        <ModuleCard title="Inteligência Estratégica" desc="Tendências e previsão de demanda regional." />
        <ModuleCard title="Economia Circular Local" desc="Quanto a comunidade movimentou e empregos gerados." />
      </div>
    </AppShell>
  );
}
