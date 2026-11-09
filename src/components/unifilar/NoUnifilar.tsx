/**
 * No customizado do React Flow para componentes do unifilar.
 *
 * Renderiza o simbolo SVG (rotacionado), rotulos (codigo, nome, vao) e
 * os Handles (terminais) de que as conexoes dependem. Os terminais
 * trocam de borda conforme a rotacao para acompanhar fisicamente as
 * pontas do condutor quando o equipamento gira.
 */

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { SimboloUnifilar } from "./SimboloUnifilar";
import { TERMINAIS_BARRAMENTO, tipo } from "./catalogo";

const CLASSE_TERMINAL = "!h-3 !w-3 !min-h-0 !min-w-0 !border-2 !border-white bg-blue-600 shadow-sm";

function Terminal({ id, position, rotulo }: { id: string; position: Position; rotulo: string }) {
  return (
    <Handle
      id={id}
      type="source"
      position={position}
      className={CLASSE_TERMINAL}
      aria-label={rotulo}
      // modo Loose: o mesmo terminal inicia (ponta de saida) e recebe
      // (ponta de chegada) conexoes, sem handles ocultos duplicados.
      isConnectable
      isConnectableStart
      isConnectableEnd
    />
  );
}

export type DadosComponente = {
  tipo: string;
  codigo: string;
  nome: string;
  vao: string;
  rotacao: number; // 0 | 90 | 180 | 270
  largura: number;
  altura: number;
  id_ativo?: number | null;
};

export type NoUnifilarType = Node<DadosComponente, "noUnifilar">;

/** Bordas ocupadas por (T1, T2) conforme a rotacao horaria. */
function bordasTerminais(rotacao: number): [Position, Position] {
  const base: Record<number, [Position, Position]> = {
    0: [Position.Top, Position.Bottom],
    90: [Position.Right, Position.Left],
    180: [Position.Bottom, Position.Top],
    270: [Position.Left, Position.Right],
  };
  return base[(((rotacao % 360) + 360) % 360) / 90] ?? base[0];
}

function bordasBarramento(rotacao: number): [Position, Position, Position, Position] {
  const base90 = [Position.Right, Position.Left, Position.Bottom, Position.Top] as [Position, Position, Position, Position];
  const normal: [Position, Position, Position, Position] = [
    Position.Left,
    Position.Right,
    Position.Top,
    Position.Bottom,
  ];
  return Math.abs((rotacao % 180)) === 90 ? base90 : normal;
}

export function NoUnifilar({ data, selected }: NodeProps<NoUnifilarType>) {
  const definicao = tipo(data.tipo);

  const identificador = data.codigo?.trim();
  const etiquetaVao = data.vao?.trim();

  if (definicao.codigo === "BARRAMENTO" || definicao.codigo === "CONEXAO" || definicao.codigo === "ETIQUETA_VAO") {
    return (
      <div
        className={`relative flex items-center justify-center ${selected ? "rounded ring-2 ring-blue-600" : ""}`}
        style={{ width: data.largura, height: data.altura }}
      >
        <SimboloUnifilar tipo={definicao.codigo} largura={data.largura} altura={data.altura} />
        {identificador && definicao.codigo !== "ETIQUETA_VAO" ? (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold text-slate-500">
            {identificador}
          </span>
        ) : null}
        {TERMINAIS_BARRAMENTO.map((t, indice) => {
          const [esq, dir, topo, base] = bordasBarramento(data.rotacao);
          const posicoes = [esq, dir, topo, base];
          return (
            <Terminal
              key={t.id}
              id={t.id}
              position={posicoes[indice]}
              rotulo={`${t.label.toLowerCase()} de ${identificador || "barramento"}`}
            />
          );
        })}
      </div>
    );
  }

  const [t1, t2] = bordasTerminais(data.rotacao);

  return (
    <div
      className={`relative flex flex-col items-center ${selected ? "rounded-md ring-2 ring-blue-600" : ""}`}
      style={{ width: data.largura, minHeight: data.altura }}
    >
      <Terminal id="T1" position={t1} rotulo={`topo de ${identificador || "equipamento"}`} />
      <Terminal id="T2" position={t2} rotulo={`base de ${identificador || "equipamento"}`} />

      <div style={{ transform: `rotate(${data.rotacao}deg)` }}>
        <SimboloUnifilar tipo={definicao.codigo} largura={data.largura} altura={data.altura} />
      </div>

      {identificador ? (
        <span className="mt-0.5 select-none text-center text-[11px] font-bold leading-tight text-slate-900">
          {identificador}
        </span>
      ) : null}
      {data.nome && data.nome !== definicao.nome ? (
        <span className="select-none text-center text-[9px] leading-tight text-slate-500">{data.nome}</span>
      ) : null}
      {etiquetaVao ? (
        <span className="rounded bg-slate-200 px-1 text-[9px] font-semibold leading-4 text-slate-600">{etiquetaVao}</span>
      ) : null}
    </div>
  );
}
