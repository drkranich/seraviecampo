import { formatMoney } from "@/lib/money";
import {
  compactStripeId,
  formatDateTime,
  transferKindLabel,
  transferSourceLabel,
  transferStatusClass,
  transferStatusLabel,
  type PayoutTransferRow,
} from "@/lib/financial";

export function PayoutTransferTable({
  transfers,
  empty = "Nenhum repasse Stripe registrado ainda.",
}: {
  transfers: PayoutTransferRow[];
  empty?: string;
}) {
  if (transfers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-campo-border glass p-6 text-center text-sm text-stone-500">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-campo-border glass">
      <table className="w-full text-left text-sm">
        <thead className="bg-campo-surface2 text-xs uppercase tracking-wider text-stone-500">
          <tr>
            <th className="px-4 py-2">Origem</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Valor</th>
            <th className="px-4 py-2">Stripe</th>
            <th className="px-4 py-2">Data</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer) => (
            <tr key={transfer.id} className="border-t border-campo-border">
              <td className="px-4 py-2">
                <p className="text-forest-100">{transferKindLabel(transfer.kind)}</p>
                <p className="max-w-[220px] truncate font-mono text-[0.65rem] text-stone-500">
                  {transferSourceLabel(transfer.source_type)} {transfer.source_id}
                </p>
              </td>
              <td className="px-4 py-2">
                <span className={`rounded-full border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.12em] ${transferStatusClass(transfer.status)}`}>
                  {transferStatusLabel(transfer.status)}
                </span>
                {transfer.error && <p className="mt-1 max-w-[220px] truncate text-[0.7rem] text-red-300">{transfer.error}</p>}
              </td>
              <td className="px-4 py-2 text-gold">{formatMoney(transfer.amount_cents, transfer.currency)}</td>
              <td className="px-4 py-2">
                <p className="font-mono text-xs text-stone-400">{compactStripeId(transfer.stripe_transfer_id)}</p>
                {transfer.stripe_reversal_id && (
                  <p className="font-mono text-[0.65rem] text-red-300">estorno {compactStripeId(transfer.stripe_reversal_id)}</p>
                )}
              </td>
              <td className="px-4 py-2 text-stone-400">{formatDateTime(transfer.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

