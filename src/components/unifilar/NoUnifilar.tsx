/**
 * No customizado do React Flow para componentes do unifilar.
 *
 * A rotacao troca as dimensoes da caixa ocupada (90/270 graus invertem
 * largura e altura). Equipamentos giram o simbolo em torno do centro da
 * caixa; barramentos sao redesenhados na orientacao vertical. Os
 * terminais acompanham as bordas da caixa.
 */

import { useEffect } from "react";
import { Handle, Position, useNodeId, useUpdateNodeInternals, type NodeProps, type Node } from "@xyflow/react";
import { Link2 } from "lucide-react";
import { SimboloUnifilar } from "./SimboloUnifilar";
import { TERMINAIS_BARRAMENTO, tipo } from "./catalogo";

const CLASSE_TERMINAL = "!h-3 !w-3 !min-h-0 !min-w-0 !border-2 !border-white bg-blue-600 shadow-sm";

export type DadosComponente = {
  tipo: string;
  codigo: string;
  nome: string;
  vao: string;
  rotacao: number;
  largura: number;
  altura: number;
  id_ativo?: number | null;
};

export type NoUnifilarType = Node<DadosComponente, "noUnifilar">;

function rotacaoNormalizada(rotacao: number): number {
  return (((rotacao % 360) + 360) % 360);
}

/** Dimensoes da caixa ocupada pelo componente apos a rotacao. */
export function dimensoesRotacionadas(largura: number, altura: number, rotacao: number): { w: number; h: number } {
  const vertical = rotacaoNormalizada(rotacao) % 180 === 90;
  return vertical ? { w: altura, h: largura } : { w: largura, h: altura };
}

function bordasTerminais(rotacao: number): [Position, Position] {
  const base: Record<number, [Position, Position]> = {
    0: [Position.Top, Position.Bottom],
    90: [Position.Right, Position.Left],
    180: [Position.Bottom, Position.Top],
    270: [Position.Left, Position.Right],
  };
  return base[rotacaoNormalizada(rotacao) / 90] ?? base[0];
}

/** Bordas de B1..B4 na orientacao atual (horizontal ou vertical). */
function bordasBarramento(rotacao: number): [Position, Position, Position, Position] {
  const vertical = rotacaoNormalizada(rotacao) % 180 === 90;
  return vertical
    ? [Position.Top, Position.Bottom, Position.Right, Position.Left]
    : [Position.Left, Position.Right, Position.Top, Position.Bottom];
}

const TIPOS_BARRAMENTO = new Set(["BARRAMENTO", "CONEXAO", "ETIQUETA_VAO"]);

export function NoUnifilar({ data, selected }: NodeProps<NoUnifilarType>) {
  const definicao = tipo(data.tipo);
  const atualizarInternos = useUpdateNodeInternals();
  const nodeId = useNodeId();

  useEffect(() => {
    if (nodeId) atualizarInternos([nodeId]);
  }, [nodeId, atualizarInternos, data.rotacao, data.largura, data.altura]);

  const identificador = data.codigo?.trim();
  const etiquetaVao = data.vao?.trim();
  const { w, h } = dimensoesRotacionadas(data.largura, data.altura, data.rotacao);
  const contorno = selected ? "rounded-md ring-2 ring-blue-600" : "";
  const vertical = rotacaoNormalizada(data.rotacao) % 180 === 90;

  if (TIPOS_BARRAMENTO.has(definicao.codigo)) {
    const [esq, dir, topo, base] = bordasBarramento(data.rotacao);
    const posicoes = [esq, dir, topo, base];
    return (
      <div className={`relative ${contorno}`} style={{ width: w, height: h }}>
        <SimboloUnifilar tipo={definicao.codigo} largura={w} altura={h} />
        {identificador && definicao.codigo !== "ETIQUETA_VAO" ? (
          <span
            className={
              vertical
                ? "absolute left-full top-0 ml-1 whitespace-nowrap text-[10px] font-semibold text-slate-500"
                : "absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold text-slate-500"
            }
          >
            {identificador}
          </span>
        ) : null}
        {TERMINAIS_BARRAMENTO.map((t, indice) => (
          <Handle
            key={t.id}
            id={t.id}
            type="source"
            position={posicoes[indice]}
            className={CLASSE_TERMINAL}
            aria-label={`${t.label.toLowerCase()} de ${identificador || "barramento"}`}
            isConnectable
            isConnectableStart
            isConnectableEnd
          />
        ))}
      </div>
    );
  }

  const [t1, t2] = bordasTerminais(data.rotacao);

  return (
    <div
      className={`relative flex flex-col items-center ${contorno}`}
      style={{ width: w }}
      title={data.id_ativo != null ? "Duplo clique abre o ativo vinculado" : undefined}
    >
      <div className="relative" style={{ width: w, height: h }}>
        <Handle id="T1" type="source" position={t1} className={CLASSE_TERMINAL} aria-label={`topo de ${identificador || "equipamento"}`} isConnectable isConnectableStart isConnectableEnd />
        <Handle id="T2" type="source" position={t2} className={CLASSE_TERMINAL} aria-label={`base de ${identificador || "equipamento"}`} isConnectable isConnectableStart isConnectableEnd />
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: data.largura,
            height: data.altura,
            marginLeft: -data.largura / 2,
            marginTop: -data.altura / 2,
            transform: `rotate(${rotacaoNormalizada(data.rotacao)}deg)`,
          }}
        >
          <SimboloUnifilar tipo={definicao.codigo} largura={data.largura} altura={data.altura} />
        </div>
        {data.id_ativo != null && (
          <span
            className="absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm"
            title={`Ativo #${data.id_ativo}`}
          >
            <Link2 className="h-2.5 w-2.5" />
          </span>
        )}
      </div>

      <div className="absolute left-full top-1/2 ml-2 flex -translate-y-1/2 flex-col whitespace-nowrap">
        {identificador ? (
          <span className="select-none text-[11px] font-bold leading-tight text-slate-900">{identificador}</span>
        ) : null}
        {data.nome && data.nome !== definicao.nome && data.nome !== identificador ? (
          <span className="select-none text-[9px] leading-tight text-slate-500">{data.nome}</span>
        ) : null}
        {etiquetaVao ? (
          <span className="mt-0.5 w-fit rounded bg-slate-200 px-1 text-[9px] font-semibold leading-4 text-slate-600">{etiquetaVao}</span>
        ) : null}
      </div>
    </div>
  );
}
