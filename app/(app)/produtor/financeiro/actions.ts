"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setPayoutMode(formData: FormData) {
  const mode = String(formData.get("payout_mode") || "mensal") === "imediato" ? "imediato" : "mensal";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("profiles").update({ payout_mode: mode }).eq("id", user.id);
  revalidatePath("/produtor/financeiro");
  redirect("/produtor/financeiro?ok=1");
}
