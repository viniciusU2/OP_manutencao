import { useState } from "react";
import { AlertTriangle, ImageOff, X, ZoomIn } from "lucide-react";

type AtivoOpcao = { id_ativo: number; codigo_ativo: string; fase: string | null; bay: string | null };
type ItemOpcao = { id_plano_item: number; nome_item: string; unidade: string | null };
type Foto = {
  arquivo: string; miniatura: string | null; id_ativo_sugerido: number | null;
  id_plano_item_sugerido: number | null; confianca: number; possivel_duplicata: boolean;
  duplicata_de: string | null; requer_confirmacao: boolean;
};
type Analise = { quantidade_fotos: number; fotos: Foto[]; ativos: AtivoOpcao[]; itens: ItemOpcao[] };
export type RevisaoEvidencia = { ativoId: string; itemId: string; valor: string; status: string; observacao: string; incluir: boolean };
type Revisao = RevisaoEvidencia;

function inicial(foto: Foto): Revisao {
  return { ativoId: foto.id_ativo_sugerido?.toString() ?? "", itemId: foto.id_plano_item_sugerido?.toString() ?? "", valor: "", status: "OK", observacao: "", incluir: true };
}

export default function ReviewEvidenceGrid({ analise, confirmados, onConfirmChange, onReviewsChange, initialReviews }: {
  analise: Analise; confirmados: Set<string>; onConfirmChange: (arquivo: string, confirmado: boolean) => void; onReviewsChange?: (revisoes: Record<string, RevisaoEvidencia>) => void; initialReviews?: Record<string, RevisaoEvidencia>;
}) {
  const [fotoAmpliada, setFotoAmpliada] = useState<Foto | null>(null);
  const [revisoes, setRevisoes] = useState<Record<string, Revisao>>(() =>
    initialReviews ?? Object.fromEntries(analise.fotos.map((foto) => [foto.arquivo, inicial(foto)]))
  );

  function atualizar(arquivo: string, patch: Partial<Revisao>) {
    setRevisoes((atual) => {
      const proximo = { ...atual, [arquivo]: { ...(atual[arquivo] ?? inicial(analise.fotos.find((f) => f.arquivo === arquivo)!)), ...patch } };
      onReviewsChange?.(proximo);
      return proximo;
    });
  }

  const ativosIdentificados = analise.fotos.filter((foto) => foto.id_ativo_sugerido).length;
  const itensSugeridos = analise.fotos.filter((foto) => foto.id_plano_item_sugerido).length;

  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2 text-xs font-semibold text-sky-900">
      <span className="rounded-full bg-sky-100 px-3 py-1">{analise.quantidade_fotos} fotos</span>
      <span className="rounded-full bg-sky-100 px-3 py-1">{ativosIdentificados} ativos identificados</span>
      <span className="rounded-full bg-sky-100 px-3 py-1">{itensSugeridos} itens sugeridos</span>
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      {analise.fotos.map((foto) => {
        const revisao = revisoes[foto.arquivo] ?? inicial(foto);
        const confirmado = confirmados.has(foto.arquivo);
        return <article key={foto.arquivo} className={`overflow-hidden rounded-lg border bg-white shadow-sm ${foto.requer_confirmacao && !confirmado ? "border-amber-400" : "border-slate-200"}`}>
          <button type="button" className="group relative grid min-h-72 w-full place-items-center overflow-hidden bg-slate-100 p-2 sm:min-h-96" onClick={() => foto.miniatura && setFotoAmpliada(foto)} aria-label={`Ampliar ${foto.arquivo}`}>
            {foto.miniatura ? <img src={foto.miniatura} alt={foto.arquivo} className="max-h-[460px] h-auto w-auto max-w-full object-contain" /> : <div className="grid h-full place-items-center text-slate-400"><ImageOff size={34} /></div>}
            {foto.miniatura && <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-slate-950/75 px-2.5 py-1.5 text-xs font-semibold text-white opacity-90 shadow group-hover:opacity-100"><ZoomIn size={15} />Ampliar</span>}
          </button>
          <div className="space-y-3 p-3 text-xs">
            <p className="m-0 truncate font-bold text-slate-900" title={foto.arquivo}>{foto.arquivo}</p>
            <label className="grid gap-1 font-medium">Ativo/fase
              <select className="h-9 rounded-md border border-slate-300 bg-white px-2" value={revisao.ativoId} onChange={(e) => atualizar(foto.arquivo, { ativoId: e.target.value })}>
                <option value="">Sem vínculo</option>{analise.ativos.map((ativo) => <option key={ativo.id_ativo} value={ativo.id_ativo}>{ativo.codigo_ativo}{ativo.fase ? ` · ${ativo.fase}` : ""}{ativo.bay ? ` · ${ativo.bay}` : ""}</option>)}
              </select>
            </label>
            <label className="grid gap-1 font-medium">Item do plano
              <select className="h-9 rounded-md border border-slate-300 bg-white px-2" value={revisao.itemId} onChange={(e) => atualizar(foto.arquivo, { itemId: e.target.value })}>
                <option value="">Sem vínculo</option>{analise.itens.map((item) => <option key={item.id_plano_item} value={item.id_plano_item}>{item.nome_item}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-[1fr_112px] gap-2">
              <label className="grid gap-1 font-medium">Valor medido<input className="h-9 rounded-md border border-slate-300 px-2" value={revisao.valor} onChange={(e) => atualizar(foto.arquivo, { valor: e.target.value })} /></label>
              <label className="grid gap-1 font-medium">Status<select className="h-9 rounded-md border border-slate-300 bg-white px-2" value={revisao.status} onChange={(e) => atualizar(foto.arquivo, { status: e.target.value })}><option>OK</option><option>NOK</option><option>NA</option></select></label>
            </div>
            <label className="grid gap-1 font-medium">Observação<input className="h-9 rounded-md border border-slate-300 px-2" value={revisao.observacao} onChange={(e) => atualizar(foto.arquivo, { observacao: e.target.value })} /></label>
            {foto.possivel_duplicata && <p className="m-0 flex items-center gap-1 rounded bg-amber-50 p-2 text-amber-800"><AlertTriangle size={13} />Possível duplicata de {foto.duplicata_de}</p>}
            <div className="flex items-end justify-between gap-2 pt-1">
              <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={revisao.incluir} onChange={(e) => atualizar(foto.arquivo, { incluir: e.target.checked })} />Incluir evidência ({Math.round(foto.confianca * 100)}% confiança)</label>
              {foto.requer_confirmacao && <label className="flex items-center gap-1 font-semibold text-amber-800"><input type="checkbox" checked={confirmado} onChange={(e) => onConfirmChange(foto.arquivo, e.target.checked)} />Revisado</label>}
            </div>
          </div>
        </article>;
      })}
    </div>
    {fotoAmpliada?.miniatura && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Visualização ampliada de ${fotoAmpliada.arquivo}`} onClick={() => setFotoAmpliada(null)}>
      <div className="relative flex h-full w-full flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3 text-white"><p className="truncate text-sm font-semibold" title={fotoAmpliada.arquivo}>{fotoAmpliada.arquivo}</p><button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 hover:bg-white/25" onClick={() => setFotoAmpliada(null)} aria-label="Fechar imagem ampliada"><X size={22} /></button></div>
        <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-black/40 p-2 text-center">
          <img src={fotoAmpliada.miniatura} alt={fotoAmpliada.arquivo} className="mx-auto h-auto max-h-none max-w-none object-contain sm:min-w-[min(1200px,90vw)]" />
        </div>
        <p className="mt-2 text-center text-xs text-slate-300">Use a rolagem para examinar toda a imagem. Clique fora para fechar.</p>
      </div>
    </div>}
  </div>;
}

