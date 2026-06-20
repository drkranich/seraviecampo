// Tarifa de frete dinâmica (espelha o cálculo do checkout no banco).
// Sem almoço grátis: todo frete é cobrado e repassado ao entregador,
// com uma fatia para a plataforma.
export const SHIP = {
  baseCents: 500,        // tarifa base
  perKmCents: 120,       // por km
  minCents: 600,         // mínimo
  fallbackCents: 900,    // quando faltam coordenadas
  platformPct: 0.2,      // fatia da plataforma sobre o frete
};

export function shippingCents(distanceKm: number | null | undefined): number {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return SHIP.fallbackCents;
  return Math.max(SHIP.minCents, SHIP.baseCents + Math.round(distanceKm * SHIP.perKmCents));
}

export function courierShareCents(feeCents: number): number {
  return Math.round(feeCents * (1 - SHIP.platformPct));
}

export function platformShareCents(feeCents: number): number {
  return feeCents - courierShareCents(feeCents);
}
