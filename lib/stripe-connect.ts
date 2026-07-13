import {
  getConnectedAccountStatus,
  type StripeConnectAccountStatus,
  type StripeConnectAccountVersion,
  type StripeConnectedAccountStatus,
} from "@/lib/stripe";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ProfileStripeFields = {
  stripe_account_id?: string | null;
  stripe_charges_enabled?: boolean | null;
  stripe_account_version?: string | null;
  stripe_account_status?: string | null;
  stripe_transfers_status?: string | null;
  stripe_requirements_due?: string[] | null;
  stripe_requirements_past_due?: string[] | null;
};

export function stripeConnectVersion(value: unknown): StripeConnectAccountVersion {
  return value === "v2" ? "v2" : "legacy";
}

export function stripeStatusUpdate(status: StripeConnectedAccountStatus) {
  return {
    stripe_charges_enabled: status.ready,
    stripe_account_version: status.version,
    stripe_dashboard_type: status.dashboard,
    stripe_transfers_status: status.transfersStatus,
    stripe_account_status: status.accountStatus,
    stripe_requirements_due: status.requirementsDue,
    stripe_requirements_past_due: status.requirementsPastDue,
    stripe_last_status_sync_at: new Date().toISOString(),
  };
}

export async function refreshStripeAccountStatus(
  db: any,
  userId: string,
  accountId: string,
  version: StripeConnectAccountVersion
): Promise<StripeConnectedAccountStatus> {
  const status = await getConnectedAccountStatus(accountId, version);
  await db.from("profiles").update(stripeStatusUpdate(status)).eq("id", userId);
  return status;
}

export function canReceiveStripeTransfers(profile: ProfileStripeFields | null | undefined): boolean {
  return Boolean(profile?.stripe_account_id)
    && (profile?.stripe_account_status === "active" || profile?.stripe_charges_enabled === true);
}

export function stripeAccountStatusFromProfile(profile: ProfileStripeFields | null | undefined): StripeConnectAccountStatus {
  const value = profile?.stripe_account_status;
  if (value === "active" || value === "restricted" || value === "pending") return value;
  if (profile?.stripe_charges_enabled) return "active";
  return profile?.stripe_account_id ? "pending" : "not_started";
}

export function stripeAccountReady(profile: ProfileStripeFields | null | undefined): boolean {
  return stripeAccountStatusFromProfile(profile) === "active";
}

export function stripeAccountStatusText(connected: boolean, status: StripeConnectAccountStatus): string {
  if (!connected) return "Conecte uma conta Stripe para receber os pagamentos intermediados pela Seravie Campo.";
  if (status === "active") return "Conta Stripe conectada e pronta para receber repasses.";
  if (status === "restricted") return "O Stripe precisa de informações adicionais para liberar os repasses.";
  return "Sua conta Stripe existe, mas o cadastro ainda precisa ser concluído.";
}

export function stripeAccountStatusTitle(status: StripeConnectAccountStatus): string {
  if (status === "active") return "Conta conectada";
  if (status === "restricted") return "Ação necessária";
  if (status === "pending") return "Cadastro em andamento";
  return "Conta ainda não conectada";
}
