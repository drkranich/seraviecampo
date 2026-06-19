import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-campo-border bg-campo-surface p-8 shadow-2xl">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-stone-600">
          Plataforma de intermediação tecnológica · Conectando campo e cidade
        </p>
      </div>
    </div>
  );
}
