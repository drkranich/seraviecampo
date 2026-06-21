import { createClient } from "@/lib/supabase/server";
import { getSite } from "@/lib/site";

export async function PanelNotice({ role }: { role: "cliente" | "produtor" | "entregador" }) {
  const supabase = await createClient();
  const site = await getSite(supabase);
  const msg = site.avisos?.[role];
  if (!msg) return null;
  return (
    <div className="mb-6 flex items-start gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-stone-200">
      <span aria-hidden className="mt-0.5 text-gold">★</span>
      <p>{msg}</p>
    </div>
  );
}
