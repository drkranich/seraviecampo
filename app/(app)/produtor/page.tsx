import { requireRole } from "@/lib/guard";
import { AppShell, ModuleCard } from "@/components/AppShell";

export default async function ProdutorPage() {
  const { profile } = await requireRole("produtor");
  return (
    <AppShell
      badge="Produtor Rural"
      title={`Bom dia, ${profile?.full_name?.split(" ")[0] || "Produtor"}!`}
      subtitle="Aqui está o resumo da sua operação gourmet de hoje."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard title="Minha Produção" desc="Plantado, crescendo, pronto para venda e reservado." />
        <ModuleCard title="Calendário de Safra" desc="O sistema lembra automaticamente o que plantar e colher." />
        <ModuleCard title="Gestão de Produtos" desc="Fotos, vídeos e a história de cada produto. Isso vende mais." />
        <ModuleCard title="Pedidos" desc="Novo, preparando, saiu para entrega, entregue." />
        <ModuleCard title="IA Rural" desc="Sugestões: quando vende mais e quanto produzir." />
        <ModuleCard title="Turismo Rural" desc="Hospedagem, café colonial, colha e pague." />
      </div>
    </AppShell>
  );
}
