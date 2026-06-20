import { requireRole } from "@/lib/guard";
import { AppShell, ModuleCard, PRODUTOR_NAV } from "@/components/AppShell";

export default async function Page() {
  const { profile } = await requireRole("produtor");
  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="Marketing" subtitle="Atraia e fidelize.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard title="Vitrine" desc="Destaque produtos na descoberta dos clientes." />
        <ModuleCard title="Cupons" desc="Crie promoções e primeiras compras." />
        <ModuleCard title="Feed social" desc="Poste a colheita do dia e novidades." />
      </div>
    </AppShell>
  );
}
