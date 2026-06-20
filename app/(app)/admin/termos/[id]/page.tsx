import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/PrintButton";

type Acc = {
  id: string; user_id: string; terms_slug: string; terms_version: number; content_snapshot: string;
  ip: string | null; country: string | null; device: string | null; user_agent: string | null;
  full_name: string | null; email: string | null; accepted_at: string;
};

export default async function DocumentoAssinadoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("super_admin");
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("term_acceptances").select("*").eq("id", id).single();
  if (!data) notFound();
  const a = data as Acc;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 text-stone-200">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/admin/termos" className="text-sm text-stone-400 hover:text-gold">← Voltar</Link>
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-campo-border bg-white p-10 text-stone-900 print:border-0 print:p-0">
        <h1 className="font-serif text-2xl">Comprovante de Aceite — Seravie Campo</h1>
        <p className="mt-1 text-sm text-stone-600">Documento gerado eletronicamente. Termo {a.terms_slug} versão v{a.terms_version}.</p>

        <table className="mt-6 w-full text-sm">
          <tbody>
            <Row k="Nome" v={a.full_name || "—"} />
            <Row k="E-mail" v={a.email || "—"} />
            <Row k="Identificador do usuário" v={a.user_id} />
            <Row k="Data e hora do aceite" v={new Date(a.accepted_at).toLocaleString("pt-BR")} />
            <Row k="Endereço IP" v={a.ip || "—"} />
            <Row k="País da conexão" v={a.country || "—"} />
            <Row k="Dispositivo" v={a.device || "—"} />
            <Row k="Agente (navegador)" v={a.user_agent || "—"} />
          </tbody>
        </table>

        <h2 className="mt-8 font-serif text-lg">Conteúdo aceito</h2>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-stone-800">{a.content_snapshot}</pre>

        <p className="mt-8 border-t border-stone-300 pt-4 text-xs text-stone-500">
          Assinatura eletrônica registrada pela Seravie Campo. A integridade deste comprovante é garantida pelos metadados acima (IP, dispositivo, data/hora e país), vinculados de forma única a este aceite ({a.id}).
        </p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-stone-200">
      <td className="py-1.5 pr-4 align-top font-medium text-stone-600">{k}</td>
      <td className="py-1.5 align-top break-all">{v}</td>
    </tr>
  );
}
