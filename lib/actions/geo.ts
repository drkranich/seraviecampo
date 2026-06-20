"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveLocation(formData: FormData) {
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const redirectTo = String(formData.get("redirect") || "/cliente/conta");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) redirect(`${redirectTo}?geoerro=1`);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("profiles").update({ lat, lng, geo_updated_at: new Date().toISOString() }).eq("id", user.id);
  revalidatePath(redirectTo);
  redirect(`${redirectTo}?geook=1`);
}
