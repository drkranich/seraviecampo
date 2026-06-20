import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type UserRole } from "@/lib/roles";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`, { status: 303 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const role = (profile?.role ?? "cliente") as UserRole;
  return NextResponse.redirect(`${origin}${ROLE_HOME[role]}`, { status: 303 });
}
