import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { haversineKm, formatDistance } from "@/lib/geo";
import { producerName, locationLabel } from "@/lib/profile";

type Prod = {
  id: string; full_name: string | null; display_name: string | null; farm_name: string | null;
  city: string | null; state: string | null; avatar_url: string | null;
  verification_status: string; lat: number | null; lng: number | null;
};

export default async function ProximosPage() {
  const { user, profile } = await requireRole("cliente");
  const supabase = await createClient();

  const { data: me } = await supabase.from("profiles").select("lat, lng").eq("id", user.id).single();
  const myLat = me?.lat as number | null, myLng = me?.lng as number | null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, farm_name, city, state, avatar_url, verification_status, lat, lng")
    .eq("role", "produtor")
    .not("lat", "is", null);
  let producers = (data ?? []) as Prod[];

  const withDist = producers
    .map((p) => ({ p, km: myLat != null && myLng != null && p.lat != null && p.lng != null ? haversineKm(myLat, myLng, p.lat, p.lng) : null }))
    .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} title="Perto de mim" subtitle="Produtores ordenados pela distância até você.">
      {myLat == null && (
        <div className="mb-6 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-stone-300">
          Você ainda não cadastrou sua localização. Vá em <Link href="/cliente/conta" className="text-gold hover:underline">Minha conta</Link> e ative o GPS para ver as distâncias.
        </div>
      )}
      {withDist.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">
          Nenhum produtor com localização cadastrada ainda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withDist.map(({ p, km }) => (
            <Link key={p.id} href={`/cliente/produtor/${p.id}`} className="glass rounded-2xl border border-campo-border p-5 transition hover:border-gold/50">
              <div className="flex items-center gap-3">
                <Avatar url={p.avatar_url} verified={p.verification_status === "verificado"} size={48} />
                <div className="min-w-0">
                  <p className="truncate font-serif text-lg text-forest-100">{producerName(p)}</p>
                  <p className="text-xs text-stone-500">{locationLabel(p) || "Localização não informada"}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gold">{km != null ? formatDistance(km) : "Distância indisponível"}</p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
