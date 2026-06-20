export type Country = { code: string; name: string; currency: string; locale: string };

// Lista completa: Brasil + todas as Américas (Sul, Central, Norte e Caribe) + toda a Europa.
export const COUNTRIES: Country[] = [
  // Brasil (padrão)
  { code: "BR", name: "Brasil", currency: "BRL", locale: "pt-BR" },

  // América do Sul
  { code: "AR", name: "Argentina", currency: "ARS", locale: "es-AR" },
  { code: "BO", name: "Bolívia", currency: "BOB", locale: "es-BO" },
  { code: "CL", name: "Chile", currency: "CLP", locale: "es-CL" },
  { code: "CO", name: "Colômbia", currency: "COP", locale: "es-CO" },
  { code: "EC", name: "Equador", currency: "USD", locale: "es-EC" },
  { code: "GY", name: "Guiana", currency: "GYD", locale: "en-GY" },
  { code: "PY", name: "Paraguai", currency: "PYG", locale: "es-PY" },
  { code: "PE", name: "Peru", currency: "PEN", locale: "es-PE" },
  { code: "SR", name: "Suriname", currency: "SRD", locale: "nl-SR" },
  { code: "UY", name: "Uruguai", currency: "UYU", locale: "es-UY" },
  { code: "VE", name: "Venezuela", currency: "VES", locale: "es-VE" },

  // América Central
  { code: "BZ", name: "Belize", currency: "BZD", locale: "en-BZ" },
  { code: "CR", name: "Costa Rica", currency: "CRC", locale: "es-CR" },
  { code: "SV", name: "El Salvador", currency: "USD", locale: "es-SV" },
  { code: "GT", name: "Guatemala", currency: "GTQ", locale: "es-GT" },
  { code: "HN", name: "Honduras", currency: "HNL", locale: "es-HN" },
  { code: "NI", name: "Nicaragua", currency: "NIO", locale: "es-NI" },
  { code: "PA", name: "Panamá", currency: "PAB", locale: "es-PA" },

  // América do Norte
  { code: "CA", name: "Canadá", currency: "CAD", locale: "en-CA" },
  { code: "US", name: "Estados Unidos", currency: "USD", locale: "en-US" },
  { code: "MX", name: "México", currency: "MXN", locale: "es-MX" },

  // Caribe
  { code: "BS", name: "Bahamas", currency: "BSD", locale: "en-BS" },
  { code: "BB", name: "Barbados", currency: "BBD", locale: "en-BB" },
  { code: "CU", name: "Cuba", currency: "CUP", locale: "es-CU" },
  { code: "DO", name: "República Dominicana", currency: "DOP", locale: "es-DO" },
  { code: "HT", name: "Haiti", currency: "HTG", locale: "fr-HT" },
  { code: "JM", name: "Jamaica", currency: "JMD", locale: "en-JM" },
  { code: "PR", name: "Porto Rico", currency: "USD", locale: "es-PR" },
  { code: "TT", name: "Trinidad e Tobago", currency: "TTD", locale: "en-TT" },

  // Europa
  { code: "AL", name: "Albânia", currency: "ALL", locale: "sq-AL" },
  { code: "AD", name: "Andorra", currency: "EUR", locale: "ca-AD" },
  { code: "AT", name: "Áustria", currency: "EUR", locale: "de-AT" },
  { code: "BY", name: "Bielorrússia", currency: "BYN", locale: "be-BY" },
  { code: "BE", name: "Bélgica", currency: "EUR", locale: "nl-BE" },
  { code: "BA", name: "Bósnia e Herzegovina", currency: "BAM", locale: "bs-BA" },
  { code: "BG", name: "Bulgária", currency: "BGN", locale: "bg-BG" },
  { code: "HR", name: "Croácia", currency: "EUR", locale: "hr-HR" },
  { code: "CY", name: "Chipre", currency: "EUR", locale: "el-CY" },
  { code: "CZ", name: "Tchéquia", currency: "CZK", locale: "cs-CZ" },
  { code: "DK", name: "Dinamarca", currency: "DKK", locale: "da-DK" },
  { code: "EE", name: "Estônia", currency: "EUR", locale: "et-EE" },
  { code: "FI", name: "Finlândia", currency: "EUR", locale: "fi-FI" },
  { code: "FR", name: "França", currency: "EUR", locale: "fr-FR" },
  { code: "DE", name: "Alemanha", currency: "EUR", locale: "de-DE" },
  { code: "GR", name: "Grécia", currency: "EUR", locale: "el-GR" },
  { code: "HU", name: "Hungria", currency: "HUF", locale: "hu-HU" },
  { code: "IS", name: "Islândia", currency: "ISK", locale: "is-IS" },
  { code: "IE", name: "Irlanda", currency: "EUR", locale: "en-IE" },
  { code: "IT", name: "Itália", currency: "EUR", locale: "it-IT" },
  { code: "XK", name: "Kosovo", currency: "EUR", locale: "sq-XK" },
  { code: "LV", name: "Letônia", currency: "EUR", locale: "lv-LV" },
  { code: "LI", name: "Liechtenstein", currency: "CHF", locale: "de-LI" },
  { code: "LT", name: "Lituânia", currency: "EUR", locale: "lt-LT" },
  { code: "LU", name: "Luxemburgo", currency: "EUR", locale: "fr-LU" },
  { code: "MT", name: "Malta", currency: "EUR", locale: "mt-MT" },
  { code: "MD", name: "Moldávia", currency: "MDL", locale: "ro-MD" },
  { code: "MC", name: "Mônaco", currency: "EUR", locale: "fr-MC" },
  { code: "ME", name: "Montenegro", currency: "EUR", locale: "sr-ME" },
  { code: "NL", name: "Países Baixos", currency: "EUR", locale: "nl-NL" },
  { code: "MK", name: "Macedônia do Norte", currency: "MKD", locale: "mk-MK" },
  { code: "NO", name: "Noruega", currency: "NOK", locale: "nb-NO" },
  { code: "PL", name: "Polônia", currency: "PLN", locale: "pl-PL" },
  { code: "PT", name: "Portugal", currency: "EUR", locale: "pt-PT" },
  { code: "RO", name: "Romênia", currency: "RON", locale: "ro-RO" },
  { code: "RU", name: "Rússia", currency: "RUB", locale: "ru-RU" },
  { code: "SM", name: "San Marino", currency: "EUR", locale: "it-SM" },
  { code: "RS", name: "Sérvia", currency: "RSD", locale: "sr-RS" },
  { code: "SK", name: "Eslováquia", currency: "EUR", locale: "sk-SK" },
  { code: "SI", name: "Eslovênia", currency: "EUR", locale: "sl-SI" },
  { code: "ES", name: "Espanha", currency: "EUR", locale: "es-ES" },
  { code: "SE", name: "Suécia", currency: "SEK", locale: "sv-SE" },
  { code: "CH", name: "Suíça", currency: "CHF", locale: "de-CH" },
  { code: "UA", name: "Ucrânia", currency: "UAH", locale: "uk-UA" },
  { code: "GB", name: "Reino Unido", currency: "GBP", locale: "en-GB" },
  { code: "VA", name: "Vaticano", currency: "EUR", locale: "it-VA" },
];

export const COUNTRY_MAP = new Map(COUNTRIES.map((c) => [c.code, c]));

export function countryOf(code?: string | null): Country {
  return COUNTRY_MAP.get(code || "BR") ?? COUNTRIES[0];
}
