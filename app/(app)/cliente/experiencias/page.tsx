import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import {
  EXP_STATUS_LABEL,
  EXP_STATUS_STYLE,
  formatExpPrice,
  type ExperienceBooking,
} from "@/lib/experiences";

export default async function MinhasExperienciasPage() {
  const { user, profile } = await requireRole("cliente");
  const supabase = await createClient();

  const { data } = await supabase
    .from("experience_bookings").select("*").eq("customer_id", user.id).order("created_at", { ascending: false });
  const bookings = (data ?? []) as ExperienceBooking[];

  const expIds = [...new Set(bookings.map((b) => b.experience_id))];
  const { data: exps } = await supabase.from("experiences").select("id, title")
    .in("id", expIds.length ? expIds : ["00000000-0000-0000-0000-000000000000"]);
  const expName = new Map((exps ?? []).map((e) => [e.id as string, e.title as string]));

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} profileHref="/cliente/conta"
      title="Experiências" subtitle="Suas vivências reservadas no campo.">
      <div className="mb-6">
        <Link href="/experiencias" className="rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Explorar experiências</Link>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">
          Você ainda não reservou nenhuma experiência. Descubra vivências extraordinárias no campo.
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="glass rounded-2xl border border-campo-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link href={`/experiencias/${b.experience_id}`} className="font-serif text-forest-100 hover:text-gold">{expName.get(b.experience_id) ?? "Experiência"}</Link>
                  <p className="text-xs text-stone-500">
                    {new Date(b.date).toLocaleDateString("pt-BR")}{b.time ? ` às ${b.time}` : ""} · {b.people} pessoa(s) · {formatExpPrice(b.total_cents, b.currency)}
                    {" · "}{b.payment_status === "pago" ? <span className="text-forest-300">pago</span> : <span className="text-amber-300">pagamento pendente</span>}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs ${EXP_STATUS_STYLE[b.status]}`}>{EXP_STATUS_LABEL[b.status]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
