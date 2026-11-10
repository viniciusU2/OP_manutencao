/**
 * Canvas do modo SAGE: desenho real do unifilar em modo supervisao.
 *
 * - Linhas pretas quando ambos os terminais estao energizados; cinza
 *   tracejado quando o trecho esta desenergizado.
 * - Etiquetas de tensao de barra em coordenadas de tela.
 * - Clique seleciona o equipamento (a operacao e feita no painel).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2, Minus, Plus } from "lucide-react";
import type { Viewport } from "@xyflow/react";

import { NoUnifilar, type NoUnifilarType } from "./NoUnifilar";
import { tipo as buscarTipo } from "./catalogo";
import type { AnaliseSage, EstadoChave } from "../../lib/sageSim";

const nodeTypes = { noUnifilar: NoUnifilar } as const;
const RECUO = 18;
const TRANSFORMACAO = /translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)\s*scale\(\s*(-?[\d.]+)\s*\)/;

type Ponto = { x: number; y: number };
type Linha = { id: string; pontos: Ponto[] };

function recuoSeguro(origem: Ponto, direcao: Ponto, alvo: Ponto): number {
  const distancia = direcao.x !== 0 ? Math.abs(alvo.x - origem.x) : Math.abs(alvo.y - origem.y);
  return Math.max(1, Math.min(RECUO, distancia / 2));
}

function rotaOrtogonal(p1: Ponto, d1: Ponto, p2: Ponto, d2: Ponto): Ponto[] {
  if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < 3) return [p1, p2];
  const a = { x: p1.x + d1.x * recuoSeguro(p1, d1, p2), y: p1.y + d1.y * recuoSeguro(p1, d1, p2) };
  const b = { x: p2.x + d2.x * recuoSeguro(p2, d2, p1), y: p2.y + d2.y * recuoSeguro(p2, d2, p1) };
  const verticalSaida = d1.x === 0;
  const verticalChegada = d2.x === 0;
  if (verticalSaida && verticalChegada) {
    const meio = (a.y + b.y) / 2;
    return [p1, a, { x: a.x, y: meio }, { x: b.x, y: meio }, b, p2];
  }
  if (!verticalSaida && !verticalChegada) {
    const meio = (a.x + b.x) / 2;
    return [p1, a, { x: meio, y: a.y }, { x: meio, y: b.y }, b, p2];
  }
  if (verticalSaida) return [p1, a, { x: a.x, y: b.y }, b, p2];
  return [p1, a, { x: b.x, y: a.y }, b, p2];
}

function caminho(pontos: Ponto[]): string {
  return pontos.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

function medirLigacoes(wrap: HTMLElement, arestas: Edge[], nos: NoUnifilarType[]): Linha[] {
  const base = wrap.querySelector<HTMLElement>(".react-flow__viewport");
  if (!base) return [];
  const area = wrap.getBoundingClientRect();
  const m = TRANSFORMACAO.exec(base.style.transform);
  const tx = m ? parseFloat(m[1]) : 0;
  const ty = m ? parseFloat(m[2]) : 0;
  const z = m ? parseFloat(m[3]) : 1;
  const paraFluxo = (x: number, y: number): Ponto => ({ x: (x - area.left - tx) / z, y: (y - area.top - ty) / z });

  const noEl = (id: string) => wrap.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`);
  const handleEl = (id: string, h: string | null | undefined) =>
    h ? noEl(id)?.querySelector<HTMLElement>(`.react-flow__handle[data-handleid="${h}"]`) ?? null : null;
  const centroDe = (el: Element): Ponto => {
    const r = el.getBoundingClientRect();
    return paraFluxo(r.left + r.width / 2, r.top + r.height / 2);
  };
  const direcaoDe = (el: Element): Ponto => {
    const c = el.className;
    if (c.includes("handle-top")) return { x: 0, y: -1 };
    if (c.includes("handle-bottom")) return { x: 0, y: 1 };
    if (c.includes("handle-left")) return { x: -1, y: 0 };
    return { x: 1, y: 0 };
  };
  const tipoDe = new Map(nos.map((n) => [n.id, n.data.tipo]));

  const nominal = (id: string, h: string | null | undefined): Ponto | null => {
    const el = handleEl(id, h) ?? noEl(id);
    return el ? centroDe(el) : null;
  };

  const pontoNoBarramento = (no: HTMLElement, alvo: Ponto): { p: Ponto; d: Ponto } => {
    const r = no.getBoundingClientRect();
    const topo = paraFluxo(r.left, r.top);
    const fundo = paraFluxo(r.right, r.bottom);
    const horizontal = (fundo.x - topo.x) >= (fundo.y - topo.y);
    if (horizontal) {
      const x = Math.min(Math.max(alvo.x, topo.x + 8), fundo.x - 8);
      return alvo.y < (topo.y + fundo.y) / 2
        ? { p: { x, y: topo.y }, d: { x: 0, y: -1 } }
        : { p: { x, y: fundo.y }, d: { x: 0, y: 1 } };
    }
    const y = Math.min(Math.max(alvo.y, topo.y + 8), fundo.y - 8);
    return alvo.x < (topo.x + fundo.x) / 2
      ? { p: { x: topo.x, y }, d: { x: -1, y: 0 } }
      : { p: { x: fundo.x, y }, d: { x: 1, y: 0 } };
  };

  const ponta = (id: string, h: string | null | undefined, alvo: Ponto): { p: Ponto; d: Ponto } | null => {
    const no = noEl(id);
    if (!no) return null;
    if (tipoDe.get(id) === "BARRAMENTO") return pontoNoBarramento(no, alvo);
    const el = handleEl(id, h);
    return el ? { p: centroDe(el), d: direcaoDe(el) } : null;
  };

  const linhas: Linha[] = [];
  for (const e of arestas) {
    const alvoA = nominal(e.target, e.targetHandle);
    const alvoB = nominal(e.source, e.sourceHandle);
    if (!alvoA || !alvoB) continue;
    const A = ponta(e.source, e.sourceHandle, alvoA);
    const B = ponta(e.target, e.targetHandle, alvoB);
    if (!A || !B) continue;
    linhas.push({ id: e.id, pontos: rotaOrtogonal(A.p, A.d, B.p, B.d) });
  }
  return linhas;
}

export type SageNode = NoUnifilarType;

function CanvasSage({
  nodes: nosBase,
  edges,
  estados,
  analise,
  selecionadoId,
  aoSelecionar,
}: {
  nodes: SageNode[];
  edges: Edge[];
  estados: Record<string, EstadoChave>;
  analise: AnaliseSage;
  selecionadoId: string | null;
  aoSelecionar: (id: string | null) => void;
}) {
  const { setViewport, zoomIn, zoomOut } = useReactFlow();
  const areaRef = useRef<HTMLDivElement>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [vista, setVista] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const nodesRef = useRef<SageNode[]>([]);
  const ajustou = useRef(false);

  const nodes = useMemo(() => {
    return nosBase.map((n) => {
      const estado = estados[n.id] ?? null;
      return {
        ...n,
        data: {
          ...n.data,
          sageEstado: estado,
          sageEnergizado: analise.energizados.has(n.id),
          sageSelecionado: n.id === selecionadoId,
        },
      };
    });
  }, [nosBase, estados, analise, selecionadoId]);
  nodesRef.current = nodes;

  const atualizarLinhas = useCallback(() => {
    if (areaRef.current) setLinhas(medirLigacoes(areaRef.current, edges, nodes));
  }, [edges, nodes]);

  useEffect(() => {
    const quadro = requestAnimationFrame(atualizarLinhas);
    const atraso = window.setTimeout(atualizarLinhas, 250);
    return () => {
      cancelAnimationFrame(quadro);
      clearTimeout(atraso);
    };
  }, [atualizarLinhas]);

  const ajustar = useCallback((folga = 16) => {
    const el = areaRef.current;
    const atuais = nodesRef.current;
    if (!el || !atuais.length) return;
    const larguraTela = el.clientWidth;
    const alturaTela = el.clientHeight;
    if (larguraTela < 20 || alturaTela < 20) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of atuais) {
      const w = n.width ?? n.data.largura ?? 0;
      const h = n.height ?? n.data.altura ?? 0;
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + w);
      maxY = Math.max(maxY, n.position.y + h);
    }
    maxX += 70;
    maxY += 12;
    const larg = Math.max(1, maxX - minX);
    const alt = Math.max(1, maxY - minY);
    const zoom = Math.max(0.06, Math.min(2.5, Math.min(
      (larguraTela - folga * 2) / larg,
      (alturaTela - folga * 2) / alt,
    )));
    void setViewport({
      x: (larguraTela - larg * zoom) / 2 - minX * zoom,
      y: (alturaTela - alt * zoom) / 2 - minY * zoom,
      zoom,
    }, { duration: 0 });
  }, [setViewport]);

  /** Padrao: enquadra pela largura e ancora no topo, com equipamentos legiveis. */
  const ajustarTopo = useCallback((folga = 14) => {
    const el = areaRef.current;
    const atuais = nodesRef.current;
    if (!el || !atuais.length) return;
    const larguraTela = el.clientWidth;
    const alturaTela = el.clientHeight;
    if (larguraTela < 20 || alturaTela < 20) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity;
    for (const n of atuais) {
      const w = n.width ?? n.data.largura ?? 0;
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + w);
    }
    maxX += 70;
    const larg = Math.max(1, maxX - minX);
    const zoom = Math.max(0.06, Math.min(1.05, (larguraTela - folga * 2) / larg));
    void setViewport({
      x: (larguraTela - larg * zoom) / 2 - minX * zoom,
      y: folga - minY * zoom,
      zoom,
    }, { duration: 0 });
  }, [setViewport]);

  useEffect(() => {
    if (ajustou.current || !nosBase.length) return;
    const t = window.setTimeout(() => {
      ajustarTopo(14);
      ajustou.current = true;
    }, 260);
    return () => clearTimeout(t);
  }, [ajustarTopo, nosBase.length]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (ajustou.current) ajustarTopo(14);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ajustarTopo]);

  useEffect(() => {
    window.addEventListener("resize", atualizarLinhas);
    return () => window.removeEventListener("resize", atualizarLinhas);
  }, [atualizarLinhas]);

  const barras = useMemo(() => {
    return nosBase
      .filter((n) => n.data.tipo === "BARRAMENTO")
      .map((n) => {
        const barra = analise.barras.find((b) => b.id === n.id);
        const w = n.width ?? n.data.largura ?? 0;
        const x = (n.position.x + w / 2) * vista.zoom + vista.x;
        const y = n.position.y * vista.zoom + vista.y - 44;
        return { no: n, barra, x, y };
      });
  }, [nosBase, analise, vista]);

  const energiaPorAresta = useMemo(() => {
    const mapa = new Map<string, boolean>();
    for (const e of edges) {
      mapa.set(e.id, analise.energizados.has(e.source) && analise.energizados.has(e.target));
    }
    return mapa;
  }, [edges, analise]);

  return (
    <div ref={areaRef} className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, n) => aoSelecionar(n.id)}
        onPaneClick={() => aoSelecionar(null)}
        onMove={(_, v) => setVista(v)}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        minZoom={0.08}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#b3b3b3" />
      </ReactFlow>

      <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible">
        <g transform={`translate(${vista.x} ${vista.y}) scale(${vista.zoom})`}>
          {linhas.map((linha) => {
            const inicio = linha.pontos[0];
            const fim = linha.pontos[linha.pontos.length - 1];
            const viva = energiaPorAresta.get(linha.id) ?? false;
            return (
              <g key={linha.id}>
                <path
                  d={caminho(linha.pontos)}
                  fill="none"
                  stroke={viva ? "#0f172a" : "#94a3b8"}
                  strokeWidth={viva ? 2.6 : 1.8}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={viva ? undefined : "7 5"}
                />
                <circle cx={inicio.x} cy={inicio.y} r={2.6} fill={viva ? "#0f172a" : "#94a3b8"} />
                <circle cx={fim.x} cy={fim.y} r={2.6} fill={viva ? "#0f172a" : "#94a3b8"} />
              </g>
            );
          })}
        </g>
      </svg>

      {barras.map(({ no, barra, x, y }) => (
        <div
          key={no.id}
          className="pointer-events-none absolute z-[6] -translate-x-1/2"
          style={{ left: x, top: y }}
        >
          <div
            className="rounded-md border px-2 py-1 shadow-md"
            style={{
              borderColor: barra?.energizada ? "#dc2626" : "#16a34a",
              background: "#0b1220",
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${barra?.energizada ? "bg-red-500" : "bg-emerald-500"}`} />
              <span className="text-[9px] font-bold uppercase tracking-wide text-slate-300">
                {barra?.codigo ?? no.data.codigo}
              </span>
            </div>
            <div className={`font-mono text-[13px] font-bold leading-4 ${barra?.energizada ? "text-white" : "text-emerald-400"}`}>
              {barra?.energizada ? `${barra.tensaoKv.toFixed(1).replace(".", ",")} kV` : "0,0 kV"}
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-2 right-2 z-[7] flex items-center gap-0.5 rounded-lg border border-slate-300 bg-white/95 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => void zoomOut({ duration: 0 })}
          className="grid h-7 w-7 place-items-center rounded text-slate-600 hover:bg-slate-100"
          title="Diminuir zoom"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-10 text-center text-[10px] font-semibold tabular-nums text-slate-500">
          {Math.round(vista.zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => void zoomIn({ duration: 0 })}
          className="grid h-7 w-7 place-items-center rounded text-slate-600 hover:bg-slate-100"
          title="Aumentar zoom"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <span className="mx-0.5 h-4 w-px bg-slate-200" />
        <button
          type="button"
          onClick={() => ajustar(16)}
          className="flex h-7 items-center gap-1 rounded px-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
          title="Ver todo o diagrama"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Ver tudo
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-2 left-2 z-[7] rounded-md border border-slate-300 bg-white/95 px-2 py-1 text-[10px] text-slate-600 shadow-sm">
        <span className="mr-2 inline-flex items-center gap-1"><i className="inline-block h-0.5 w-4 bg-slate-900" />Energizado</span>
        <span className="mr-2 inline-flex items-center gap-1"><i className="inline-block h-0.5 w-4 border-t border-dashed border-slate-400" />Desenergizado</span>
        <span className="mr-2 inline-flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full bg-red-600" />Fechado/carregado</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full bg-emerald-500" />Aberto</span>
      </div>
    </div>
  );
}

export default function SageUnifilar(props: {
  nodes: SageNode[];
  edges: Edge[];
  estados: Record<string, EstadoChave>;
  analise: AnaliseSage;
  selecionadoId: string | null;
  aoSelecionar: (id: string | null) => void;
}) {
  // Garante que os tipos do catalogo existam (defensivo para diagramas antigos).
  const nodes = useMemo(
    () => props.nodes.map((n) => ({ ...n, data: { ...n.data, tipo: buscarTipo(n.data.tipo).codigo } })),
    [props.nodes],
  );
  return (
    <ReactFlowProvider>
      <CanvasSage {...props} nodes={nodes} />
    </ReactFlowProvider>
  );
}
