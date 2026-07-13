import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripeEnabled, createConnectAccount, createAccountLink } from "@/lib/stripe";
import { stripeConnectVersion } from "@/lib/stripe-connect";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`, { status: 303 });

  const { data: profile } = await supabase
    .from("profiles").select("stripe_account_id, stripe_account_version, role").eq("id", user.id).single();

  const area =
    profile?.role === "entregador" ? "/entregador/configuracoes"
    : profile?.role === "parceiro" ? "/parceiro/financeiro"
    : "/produtor/financeiro";
  if (!stripeEnabled()) return NextResponse.redirect(`${origin}${area}?error=stripe_off`, { status: 303 });

  let accountId = profile?.stripe_account_id as string | null;
  let accountVersion = stripeConnectVersion(profile?.stripe_account_version);
  try {
    if (!accountId) {
      accountId = await createConnectAccount(user.email ?? "");
      accountVersion = "v2";
      await supabase.from("profiles").update({
        stripe_account_id: accountId,
        stripe_account_version: accountVersion,
        stripe_dashboard_type: "express",
        stripe_account_status: "pending",
        stripe_transfers_status: "pending",
      }).eq("id", user.id);
    }
    const link = await createAccountLink(accountId, `${origin}${area}?refresh=1`, `${origin}${area}?refresh=1`, accountVersion);
    return NextResponse.redirect(link, { status: 303 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    const code = /connect/i.test(msg) ? "connect_setup" : encodeURIComponent(msg);
    return NextResponse.redirect(`${origin}${area}?error=${code}`, { status: 303 });
  }
}
