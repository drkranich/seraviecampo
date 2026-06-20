"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Cancela a renovação. O mês atual já pago é cobrado integralmente (sem reembolso/pro-rata)
// e nada é cobrado no próximo ciclo. Acesso continua até o fim do período vigente.
export async function cancelSubscription(formData: FormData) {
  const back = String(formData.get("back") || "/");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("subscriptions")
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq("account_id", user.id);
  revalidatePath(back);
  redirect(`${back}?cancelado=1`);
}
