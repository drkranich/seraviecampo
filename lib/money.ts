// Formata centavos em qualquer moeda/locale (internacionalização).
export function formatMoney(cents: number, currency = "BRL", locale = "pt-BR"): string {
  try {
    return (cents / 100).toLocaleString(locale, { style: "currency", currency });
  } catch {
    return (cents / 100).toFixed(2);
  }
}
