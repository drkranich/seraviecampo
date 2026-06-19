import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seravie Campo — Agro Gourmet",
  description:
    "Sistema Operacional da Economia Local. Conectando campo e cidade com produtos extraordinários.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-campo-bg text-stone-100 antialiased">
        {children}
      </body>
    </html>
  );
}
