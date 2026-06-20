export type Country = { code: string; name: string; currency: string; locale: string };

// Brasil + América Latina + Europa + EUA (lista inicial; ampliável)
export const COUNTRIES: Country[] = [
  { code: "BR", name: "Brasil", currency: "BRL", locale: "pt-BR" },
  { code: "PT", name: "Portugal", currency: "EUR", locale: "pt-PT" },
  { code: "US", name: "Estados Unidos", currency: "USD", locale: "en-US" },
  { code: "ES", name: "Espanha", currency: "EUR", locale: "es-ES" },
  { code: "FR", name: "França", currency: "EUR", locale: "fr-FR" },
  { code: "DE", name: "Alemanha", currency: "EUR", locale: "de-DE" },
  { code: "IT", name: "Itália", currency: "EUR", locale: "it-IT" },
  { code: "GB", name: "Reino Unido", currency: "GBP", locale: "en-GB" },
  { code: "NL", name: "Países Baixos", currency: "EUR", locale: "nl-NL" },
  { code: "IE", name: "Irlanda", currency: "EUR", locale: "en-IE" },
  { code: "AR", name: "Argentina", currency: "ARS", locale: "es-AR" },
  { code: "CL", name: "Chile", currency: "CLP", locale: "es-CL" },
  { code: "CO", name: "Colômbia", currency: "COP", locale: "es-CO" },
  { code: "MX", name: "México", currency: "MXN", locale: "es-MX" },
  { code: "PE", name: "Peru", currency: "PEN", locale: "es-PE" },
  { code: "UY", name: "Uruguai", currency: "UYU", locale: "es-UY" },
  { code: "PY", name: "Paraguai", currency: "PYG", locale: "es-PY" },
  { code: "BO", name: "Bolívia", currency: "BOB", locale: "es-BO" },
  { code: "EC", name: "Equador", currency: "USD", locale: "es-EC" },
];

export const COUNTRY_MAP = new Map(COUNTRIES.map((c) => [c.code, c]));

export function countryOf(code?: string | null): Country {
  return COUNTRY_MAP.get(code || "BR") ?? COUNTRIES[0];
}
