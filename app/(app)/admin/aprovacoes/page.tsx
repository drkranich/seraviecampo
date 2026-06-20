import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { ROLE_LABEL, type UserRole } from "@/lib/roles";
import { VERIFICATION_LABEL, VERIFICATION_STYLE, locationLabel } from "@/lib/profile";
import { Avatar } from "@/components/Avatar";
import { ViewDocumentButton } from "@/components/ViewDocumentButton";
import { setVerification } from "../actions";

type Row = { id: string; role: UserRole; full_name: string | null; farm_name: string | null; city: string | null; state: string | null; verification_status: string; face_verified: boolean; created_at: string; avatar_url: string | null; document_url: string | null; document_type: string | null };

export default async function AprovacoesPage() {
  const { profile } = await requireRole("super_admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, farm_name, city, state, verification_status, face_verified, created_at, avatar_url, document_url, document_type")
    .in("role", ["produtor", "entregador"])
    .order("created_at", { ascending: false });

  const all = (data ?? []) as Row[];
  const pending = all.filter((p) => p.verification_status === "pendente" || p.verification_status === "em_analise");
  const decided = all.filter((p) => p.verification_status === "verificado" || p.verification_status === "rejeitado");

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} userName={profile?.full_name ?? "Administrador"} title="Central de Aprovação" subtitle={`${pending.length} aguardando análise`}>
      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">
          Nenhuma aprovação pendente. 🎉
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => (
            <Card key={p.id} p={p} />
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 font-serif text-lg text-stone-400">Decididos</h2>
          <div className="space-y-3">
            {decided.map((p) => <Card key={p.id} p={p} decided />)}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Card({ p, decided }: { p: Row; decided?: boolean }) {
  const approve = setVerification.bind(null, p.id, "verificado");
  const reject = setVerification.bind(null, p.id, "rejeitado");
  return (
    <article className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-campo-border p-4">
      <div className="flex items-center gap-3">
        <Avatar url={p.avatar_url} size={44} verified={p.verification_status === "verificado"} fallback={p.role === "produtor" ? "🌾" : "🛵"} />
        <div>
          <p className="text-sm text-forest-100">{p.farm_name || p.full_name || "—"}</p>
          <p className="text-xs text-stone-500">
            {ROLE_LABEL[p.role]} · {locationLabel(p) || "—"} · rosto {p.face_verified ? "✓" : "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {p.document_url ? (
          <ViewDocumentButton path={p.document_url} />
        ) : (
          <span className="text-xs text-stone-500">sem documento</span>
        )}
        <span className={`rounded-full border px-3 py-1 text-xs ${VERIFICATION_STYLE[p.verification_status]}`}>
          {VERIFICATION_LABEL[p.verification_status]}
        </span>
        {!decided && (
          <>
            <form action={reject}>
              <button className="rounded-lg border border-campo-border px-3 py-1.5 text-xs text-red-300 transition hover:border-red-900/60">Rejeitar</button>
            </form>
            <form action={approve}>
              <button className="rounded-lg bg-gold px-4 py-1.5 text-xs font-medium text-campo-bg transition hover:bg-gold-light">Aprovar</button>
            </form>
          </>
        )}
      </div>
    </article>
  );
}
