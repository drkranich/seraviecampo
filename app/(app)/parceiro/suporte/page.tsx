import { requireRole } from "@/lib/guard";
import { AppShell, PARCEIRO_NAV } from "@/components/AppShell";
import { SupportChat } from "@/components/SupportChat";

export default async function SuporteParceiroPage() {
  const { user, profile } = await requireRole("parceiro");
  return (
    <AppShell badge="Parceiro de Experiências" nav={PARCEIRO_NAV} userName={profile?.full_name ?? "Parceiro"} title="Suporte" subtitle="Fale com a equipe Seravie Campo.">
      <div className="max-w-2xl">
        <SupportChat threadUserId={user.id} />
      </div>
    </AppShell>
  );
}
