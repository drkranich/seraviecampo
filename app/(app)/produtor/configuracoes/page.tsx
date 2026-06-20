import { requireRole } from "@/lib/guard";
import { AppShell, ModuleCard, PRODUTOR_NAV } from "@/components/AppShell";
import { PasskeyManager } from "@/components/PasskeyManager";

export default async function Page() {
  const { profile } = await requireRole("produtor");
  return (
    <AppShell
      badge="Produtor Rural" nav={PRODUTOR_NAV}
      userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil"
      title="Configurações" subtitle="Sua conta, segurança e preferências."
    >
      <div className="space-y-6">
        <PasskeyManager />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard title="Dados da conta" desc="Nome, contato e senha." />
          <ModuleCard title="Notificações" desc="Escolha o que e como ser avisado." />
          <ModuleCard title="Termos e políticas" desc="Aceite de intermediação e responsabilidade." />
        </div>
      </div>
    </AppShell>
  );
}
