import { requireRole } from "@/lib/guard";
import { AppShell, ModuleCard, ENTREGADOR_NAV } from "@/components/AppShell";

export default async function RotasPage() {
  const { profile } = await requireRole("entregador");
  return (
    <AppShell badge="Entregador" nav={ENTREGADOR_NAV} userName={profile?.full_name ?? "Entregador"} title="Rotas e Mapa" subtitle="Otimize seu trajeto e acompanhe entregas.">
      <div className="mb-6 flex h-64 items-center justify-center rounded-2xl border border-dashed border-campo-border glass text-center">
        <div>
          <p className="text-4xl">🗺️</p>
          <p className="mt-2 text-sm text-stone-400">Mapa ao vivo chega na etapa de GPS.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard title="Rota otimizada" desc="Agrupe entregas próximas e reduza o trajeto." />
        <ModuleCard title="Navegação GPS" desc="Direções passo a passo até cada endereço." />
        <ModuleCard title="Entregas colaborativas" desc="Aceite várias entregas de uma mesma região." />
        <ModuleCard title="Tempo estimado" desc="Previsão de chegada para cada parada." />
        <ModuleCard title="Comprovante por foto" desc="Registre a entrega com foto e geolocalização." />
        <ModuleCard title="Status em tempo real" desc="O cliente acompanha sua localização." />
      </div>
    </AppShell>
  );
}
