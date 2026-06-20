// Cumprimento conforme a hora do dia (fuso de Brasília) + primeiro nome.
export function greeting(name?: string | null): string {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date())
  );
  const part = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const first = name?.trim().split(" ")[0];
  return first ? `${part}, ${first}!` : `${part}!`;
}
