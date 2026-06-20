"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateVehicle(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const values = {
    vehicle_type: String(formData.get("vehicle_type") || "").trim() || null,
    vehicle_plate: String(formData.get("vehicle_plate") || "").trim() || null,
    document_url: String(formData.get("document_url") || "").trim() || null,
    document_type: String(formData.get("document_type") || "").trim() || null,
  };
  const { error } = await supabase.from("profiles").update(values).eq("id", user.id);
  if (error) redirect("/entregador/configuracoes?error=" + encodeURIComponent(error.message));
  revalidatePath("/entregador/configuracoes");
  redirect("/entregador/configuracoes?ok=1");
}
