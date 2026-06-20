"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReservationStatus } from "@/lib/reservations";

export async function setReservationStatus(id: string, status: ReservationStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("harvest_reservations").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("producer_id", user.id);
  revalidatePath("/produtor/reservas");
  redirect("/produtor/reservas?ok=1");
}
