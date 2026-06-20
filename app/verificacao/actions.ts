"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type UserRole } from "@/lib/roles";

export async function confirmFace(selfiePath: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .update({
      selfie_url: selfiePath,
      face_verified: true,
      verification_status: "em_analise",
      verified_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("role")
    .single();

  const role = (profile?.role ?? "cliente") as UserRole;
  redirect(ROLE_HOME[role]);
}

// Envia um link mágico para o e-mail do usuário, para concluir a verificação
// num dispositivo com câmera (ex: celular).
export async function sendVerificationOtp(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
