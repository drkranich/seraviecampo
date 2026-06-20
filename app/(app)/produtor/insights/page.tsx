import { requireRole } from "@/lib/guard";
import { AppShell, ModuleCard, PRODUTOR_NAV } from "@/components/AppShell";

export default async function Page() {
  const { profile } = await requireRole("produtor");
  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="Insights" subtitle="Inteligência da sua operação.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard title="IA Rural" desc="Sugestões do que produzir e quanto, por demanda." />
        <ModuleCard title="Tendências" desc="O que está em alta na sua região." />
        <ModuleCard title="Previsão de demanda" desc="Prepare a produção para feriados e picos." />
      </div>
    </AppShell>
  );
}
