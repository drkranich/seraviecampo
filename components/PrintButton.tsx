"use client";
export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-lg bg-gold px-5 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light print:hidden">
      Imprimir / Salvar PDF
    </button>
  );
}
