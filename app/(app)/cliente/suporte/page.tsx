import { requireRole } from "@/lib/guard";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { SupportChat } from "@/components/SupportChat";

export default async function SuportePage() {
  const { user, profile } = await requireRole("cliente");
  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Usuário"} title="Suporte" subtitle="Fale com a equipe Seravie Campo.">
      <div className="max-w-2xl">
        <SupportChat threadUserId={user.id} />
      </div>
    </AppShell>
  );
}
