/**
 * EditorUnifilar - editor grafico do diagrama unifilar (React Flow).
 *
 * As ligacoes sao desenhadas por uma camada SVG propria, em coordenadas
 * de fluxo, medida a partir dos terminais renderizados. A rota e
 * ortogonal e sai de cada terminal na direcao do seu lado. Barramentos
 * oferecem pontos de derivacao dinamicos ao longo do seu comprimento.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Background, BackgroundVariant, ConnectionMode, Controls,
  addEdge, applyNodeChanges, ReactFlow, ReactFlowProvider,
  useEdgesState, useNodesState, useReactFlow, useUpdateNodeInternals,
} from "@xyflow/react";
import type { Connection, Edge, NodeChange, Viewport } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import {
  Copy, Eye, Maximize2, Pencil, Redo2, RotateCw, Save, Trash2, Undo2, Unlink,
} from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import api from "../../api/api";
import { CATALOGO, CATEGORIAS, tipo as buscarTipo } from "./catalogo";
import { SimboloUnifilar } from "./SimboloUnifilar";
import { NoUnifilar, dimensoesRotacionadas, type NoUnifilarType } from "./NoUnifilar";

const nodeTypes = { noUnifilar: NoUnifilar } as const;
const FORMATO = "diagrama-unifilar-v1";
const COR_LIGACAO = "#1e3a8a";
const RECUO = 18;

const PREFIXO: Record<string, string> = {
  BARRAMENTO: "BAR", DISJUNTOR: "DJ", SECCIONADORA: "SEC",
  SECCIONADORA_ATERRAMENTO: "SCT", TC: "TC", TP: "TP", TPC: "TPC",
  PARA_RAIOS: "PR", REATOR: "REA", TRANSFORMADOR: "TR",
  CONEXAO: "CX", ETIQUETA_VAO: "VAO",
};

const rotacaoNormalizada = (r: number) => ((r % 360) + 360) % 360;

const ROTULO: Record<string, string> = {
  estrutura: "Estrutura", equipamento: "Equipamentos",
  instrumento: "Instrumentos", apoio: "Apoio",
};

type Snapshot = { nodes: NoUnifilarType[]; edges: Edge[] };
type RespostaDiagrama = Partial<Snapshot> & {
  id_subestacao?: number;
  atualizado_em?: string | null;
};
type AtivoAssociavel = {
  id_ativo: number;
  codigo_ativo: string;
  bay?: string | null;
  status?: string | null;
};
type Ponto = { x: number; y: number };
type Linha = { id: string; pontos: Ponto[] };

const ESTILO = { strokeWidth: 3, stroke: COR_LIGACAO } as const;
const TRANSFORMACAO = /translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)\s*scale\(\s*(-?[\d.]+)\s*\)/;

function idUnico() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
function chave(idSubes: number) { return `unifilar:diagrama:${idSubes}`; }

function salvarLocal(s: Snapshot, idSubes: number, nome: string) {
  localStorage.setItem(chave(idSubes), JSON.stringify({
    formato: FORMATO, id_subestacao: idSubes, nome, salvo_em: new Date().toISOString(), ...s,
  }));
}

function carregarLocal(idSubes: number): Snapshot | null {
  try {
    const cru = localStorage.getItem(chave(idSubes));
    if (!cru) return null;
    const d = JSON.parse(cru) as Snapshot & { formato?: string };
    if (d.formato === FORMATO && Array.isArray(d.nodes)) {
      return normalizarSnapshot(d);
    }
  } catch { /* corrompido */ }
  return null;
}

function normalizarSnapshot(valor: Partial<Snapshot> | null | undefined): Snapshot {
  const nodes = Array.isArray(valor?.nodes) ? valor.nodes.map((node) => {
    const definicao = buscarTipo(node.data?.tipo ?? "CONEXAO");
    return {
      ...node,
      type: "noUnifilar" as const,
      ...dimensoesRotacionadas(
        node.data?.largura ?? definicao.largura,
        node.data?.altura ?? definicao.altura,
        node.data?.rotacao ?? 0,
      ),
      data: {
        ...node.data,
        codigo: node.data?.codigo ?? "",
        nome: node.data?.nome ?? "",
        vao: node.data?.vao ?? "",
        rotacao: node.data?.rotacao ?? 0,
        largura: node.data?.largura ?? definicao.largura,
        altura: node.data?.altura ?? definicao.altura,
      },
    };
  }) : [];
  const ids = new Set(nodes.map((node) => node.id));
  const edges = Array.isArray(valor?.edges) ? valor.edges
    .filter((edge) =>
      ids.has(edge.source) &&
      ids.has(edge.target) &&
      edge.source !== edge.target &&
      typeof edge.sourceHandle === "string" &&
      typeof edge.targetHandle === "string" &&
      edge.sourceHandle.length > 0 &&
      edge.targetHandle.length > 0,
    )
    .map((edge) => ({ ...edge, type: "smoothstep", style: ESTILO })) : [];
  return { nodes, edges };
}

function assinatura(snapshot: Snapshot): string {
  return JSON.stringify({
    nodes: snapshot.nodes.map((node) => ({
      id: node.id,
      type: node.type ?? "noUnifilar",
      position: node.position,
      data: node.data,
    })),
    edges: snapshot.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle ?? null,
      target: edge.target,
      targetHandle: edge.targetHandle ?? null,
      type: edge.type ?? "smoothstep",
    })),
  });
}

function Miniatura({ tipoCodigo, w, h }: { tipoCodigo: string; w: number; h: number }) {
  return (
    <span className="flex h-10 w-full items-center justify-center overflow-hidden">
      <SimboloUnifilar tipo={tipoCodigo} largura={w} altura={h} />
    </span>
  );
}

function proxCodigo(nodes: NoUnifilarType[], tipoCod: string): string {
  const p = PREFIXO[tipoCod] ?? tipoCod.slice(0, 3).toUpperCase();
  const usados = new Set(nodes.map((n) => n.data.codigo).filter((c) => c.startsWith(p)));
  let n = 1;
  while (usados.has(`${p}${String(n).padStart(2, "0")}`)) n += 1;
  return `${p}${String(n).padStart(2, "0")}`;
}

/** Rota ortogonal entre dois terminais, saindo de cada um na sua direcao. */
function rotaOrtogonal(p1: Ponto, d1: Ponto, p2: Ponto, d2: Ponto): Ponto[] {
  const a = { x: p1.x + d1.x * RECUO, y: p1.y + d1.y * RECUO };
  const b = { x: p2.x + d2.x * RECUO, y: p2.y + d2.y * RECUO };
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

/** Mede no DOM as ligacoes, em coordenadas de fluxo (independentes de zoom/pan). */
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

  /** Ponto de derivacao no barramento, alinhado a posicao do outro terminal. */
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

function Canvas({ idSubestacao, nomeSubestacao, podeEditar }: {
  idSubestacao: number; nomeSubestacao: string; podeEditar: boolean;
}) {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const atualizarInternos = useUpdateNodeInternals();
  const navigate = useNavigate();

  const inicial = useMemo<Snapshot>(() => carregarLocal(idSubestacao) ?? { nodes: [], edges: [] }, [idSubestacao]);
  const [nodes, setNodes] = useNodesState<NoUnifilarType>(inicial.nodes);
  const [edges, setEdges] = useEdgesState(inicial.edges);
  const [modoEdicao, setModoEdicao] = useState(podeEditar);
  const [idSel, setIdSel] = useState<string | null>(null);
  const [idLigSel, setIdLigSel] = useState<string | null>(null);
  const [idLigHover, setIdLigHover] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [ativos, setAtivos] = useState<AtivoAssociavel[]>([]);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [vista, setVista] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const fonteArraste = useRef<string | null>(null);
  const ultimaAssinaturaServidor = useRef("");
  const avisoFalhaAutosave = useRef(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const editar = modoEdicao && podeEditar;

  useEffect(() => setModoEdicao(podeEditar), [podeEditar]);

  useEffect(() => {
    if (!pronto) return;
    const t = window.setTimeout(() => fitView({ padding: 0.12, duration: 200 }), 350);
    return () => clearTimeout(t);
  }, [pronto, fitView]);

  const atualizarLinhas = useCallback(() => {
    if (areaRef.current) setLinhas(medirLigacoes(areaRef.current, edges, nodes));
  }, [edges, nodes]);

  useEffect(() => {
    const quadro = requestAnimationFrame(atualizarLinhas);
    const atraso = window.setTimeout(atualizarLinhas, 300);
    return () => { cancelAnimationFrame(quadro); clearTimeout(atraso); };
  }, [atualizarLinhas, pronto]);

  useEffect(() => {
    window.addEventListener("resize", atualizarLinhas);
    return () => window.removeEventListener("resize", atualizarLinhas);
  }, [atualizarLinhas]);

  useEffect(() => {
    let ativo = true;
    setPronto(false);
    ultimaAssinaturaServidor.current = "";

    const carregar = async () => {
      try {
        const { data } = await api.get<RespostaDiagrama>(`/unifilar/diagrama/${idSubestacao}`);
        if (!ativo) return;

        let snapshot = normalizarSnapshot(data);
        const rascunho = carregarLocal(idSubestacao);
        if (data.atualizado_em == null && podeEditar && rascunho?.nodes.length) {
          const resposta = await api.put<RespostaDiagrama>(
            `/unifilar/diagrama/${idSubestacao}`,
            normalizarSnapshot(rascunho),
          );
          if (!ativo) return;
          snapshot = normalizarSnapshot(resposta.data);
          toast.success("Rascunho local migrado para o servidor.");
        }

        setNodes(snapshot.nodes);
        setEdges(snapshot.edges);
        window.setTimeout(() => atualizarInternos(snapshot.nodes.map((node) => node.id)), 200);
        ultimaAssinaturaServidor.current = assinatura(snapshot);
        salvarLocal(snapshot, idSubestacao, nomeSubestacao);
        setPronto(true);
      } catch {
        if (!ativo) return;
        const fallback = normalizarSnapshot(carregarLocal(idSubestacao));
        setNodes(fallback.nodes);
        setEdges(fallback.edges);
        setPronto(true);
        toast.error("Nao foi possivel carregar o diagrama do servidor; exibindo o rascunho local.");
      }
    };

    void carregar();
    return () => { ativo = false; };
  }, [idSubestacao, nomeSubestacao, podeEditar, setEdges, setNodes]);

  useEffect(() => {
    if (!pronto) return;
    const snapshot = normalizarSnapshot({ nodes, edges });
    const timer = setTimeout(() => salvarLocal(snapshot, idSubestacao, nomeSubestacao), 700);
    return () => clearTimeout(timer);
  }, [edges, idSubestacao, nomeSubestacao, nodes, pronto]);

  useEffect(() => {
    if (!pronto || !editar) return;
    const snapshot = normalizarSnapshot({ nodes, edges });
    const atual = assinatura(snapshot);
    if (!atual || atual === ultimaAssinaturaServidor.current) return;

    const timer = setTimeout(() => {
      void api.put<RespostaDiagrama>(`/unifilar/diagrama/${idSubestacao}`, snapshot)
        .then(({ data }) => {
          const salvo = normalizarSnapshot(data);
          ultimaAssinaturaServidor.current = assinatura(salvo);
          salvarLocal(salvo, idSubestacao, nomeSubestacao);
          avisoFalhaAutosave.current = false;
        })
        .catch(() => {
          salvarLocal(snapshot, idSubestacao, nomeSubestacao);
          if (!avisoFalhaAutosave.current) {
            toast.error("Falha ao sincronizar com o servidor; o rascunho ficou salvo neste navegador.");
            avisoFalhaAutosave.current = true;
          }
        });
    }, 900);
    return () => clearTimeout(timer);
  }, [edges, editar, idSubestacao, nomeSubestacao, nodes, pronto]);

  useEffect(() => {
    let ativo = true;
    api.get<AtivoAssociavel[]>(`/ativos/${idSubestacao}`)
      .then(({ data }) => { if (ativo) setAtivos(Array.isArray(data) ? data : []); })
      .catch(() => { if (ativo) setAtivos([]); });
    return () => { ativo = false; };
  }, [idSubestacao]);

  const passado = useRef<Snapshot[]>([]);
  const futuro = useRef<Snapshot[]>([]);
  const [, tickHist] = useState(0);
  const snap = useCallback<() => Snapshot>(() => ({ nodes: nodes.map((n) => ({ ...n })), edges: edges.map((e) => ({ ...e })) }), [edges, nodes]);
  const registrar = useCallback(() => { passado.current.push(snap()); if (passado.current.length > 60) passado.current.shift(); futuro.current = []; tickHist((t) => t + 1); }, [snap]);
  const desfazer = useCallback(() => {
    const ant = passado.current.pop(); if (!ant) return;
    futuro.current.push(snap()); setNodes(ant.nodes); setEdges(ant.edges); tickHist((t) => t + 1);
  }, [snap, setEdges, setNodes]);
  const refazer = useCallback(() => {
    const seq = futuro.current.pop(); if (!seq) return;
    passado.current.push(snap()); setNodes(seq.nodes); setEdges(seq.edges); tickHist((t) => t + 1);
  }, [snap, setEdges, setNodes]);
  const podeUndo = passado.current.length > 0, podeRedo = futuro.current.length > 0;

  const inserir = useCallback((tipoCod: string, x: number, y: number) => {
    registrar();
    const def = buscarTipo(tipoCod);
    const novo: NoUnifilarType = {
      id: `c${idUnico()}`, type: "noUnifilar", position: { x, y },
      width: def.largura, height: def.altura,
      data: {
        tipo: def.codigo, codigo: proxCodigo(nodes, def.codigo),
        nome: def.codigo === "ETIQUETA_VAO" ? "Vão 1" : "", vao: "", rotacao: 0,
        largura: def.largura, altura: def.altura,
      },
    };
    setNodes((at) => [...at, novo]);
    setIdSel(novo.id);
  }, [nodes, registrar, setNodes]);

  const doCentro = useCallback((tipoCod: string) => {
    const p = screenToFlowPosition({ x: window.innerWidth / 2 - 40, y: window.innerHeight / 2 - 80 });
    inserir(tipoCod, p.x + (Date.now() % 5) * 26, p.y + (Date.now() % 4) * 22);
  }, [inserir, screenToFlowPosition]);

  const onDrop = useCallback((e: React.DragEvent) => {
    if (!editar) return;
    e.preventDefault();
    const tipoCod = fonteArraste.current ?? e.dataTransfer.getData("text/unifilar");
    if (!tipoCod) return;
    fonteArraste.current = null;
    const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    inserir(tipoCod, p.x, p.y);
  }, [editar, inserir, screenToFlowPosition]);

  const sel = useMemo(() => nodes.find((n) => n.id === idSel) ?? null, [idSel, nodes]);
  const defSel = sel ? buscarTipo(sel.data.tipo) : null;
  const ligSel = useMemo(() => edges.find((e) => e.id === idLigSel) ?? null, [edges, idLigSel]);
  const rotuloDe = useCallback((id: string) => {
    const no = nodes.find((n) => n.id === id);
    return no?.data.codigo || no?.data.nome || id;
  }, [nodes]);

  const rotacionar = useCallback(() => {
    if (!sel) return;
    registrar();
    const nova = (((sel.data.rotacao ?? 0) + 90) % 360);
    const { w, h } = dimensoesRotacionadas(sel.data.largura, sel.data.altura, nova);
    setNodes((at) => at.map((n) => (n.id === sel.id ? { ...n, width: w, height: h, data: { ...n.data, rotacao: nova } } : n)));
    atualizarInternos(sel.id);
  }, [atualizarInternos, registrar, sel, setNodes]);

  const duplicar = useCallback(() => {
    if (!sel) return;
    registrar();
    const def = buscarTipo(sel.data.tipo);
    const copia: NoUnifilarType = {
      ...sel, id: `c${idUnico()}`,
      position: { x: sel.position.x + 30, y: sel.position.y + 30 },
      width: sel.width, height: sel.height,
      data: { ...sel.data, codigo: proxCodigo(nodes, def.codigo) }, selected: false,
    };
    setNodes((at) => [...at, copia]);
    setIdSel(copia.id);
  }, [nodes, registrar, sel, setNodes]);

  const removerLigacao = useCallback((id: string) => {
    registrar();
    setEdges((at) => at.filter((e) => e.id !== id));
    setIdLigSel(null);
  }, [registrar, setEdges]);

  const removerLigacoesDoComponente = useCallback(() => {
    if (!sel) return;
    const alvo = edges.filter((e) => e.source === sel.id || e.target === sel.id);
    if (!alvo.length) return;
    const nome = sel.data.codigo || sel.data.nome || sel.id;
    if (!window.confirm(alvo.length > 1
      ? `Remover as ${alvo.length} ligações de ${nome}?`
      : `Remover a ligação de ${nome}?`)) return;
    registrar();
    const ids = new Set(alvo.map((e) => e.id));
    setEdges((at) => at.filter((e) => !ids.has(e.id)));
    setIdLigSel(null);
  }, [edges, registrar, sel, setEdges]);

  const excluir = useCallback(() => {
    if (idLigSel) { removerLigacao(idLigSel); return; }
    if (!sel) return;
    registrar();
    const lig = new Set(edges.filter((e) => e.source === sel.id || e.target === sel.id).map((e) => e.id));
    setEdges((at) => at.filter((e) => !lig.has(e.id)));
    setNodes((at) => at.filter((n) => n.id !== sel.id));
    setIdSel(null);
  }, [edges, idLigSel, registrar, removerLigacao, sel, setEdges, setNodes]);

  const grau = useCallback((no: string, term: string | null) =>
    edges.filter((e) => (e.source === no && e.sourceHandle === term) || (e.target === no && e.targetHandle === term)).length,
  [edges]);

  const onConnect = useCallback((c: Connection) => {
    if (!editar || !c.source || !c.target) return;
    if (c.source === c.target) { toast.warning("Um componente não se liga a si mesmo."); return; }
    const igual = edges.some((e) =>
      (e.source === c.source && (e.sourceHandle ?? null) === (c.sourceHandle ?? null) && e.target === c.target && (e.targetHandle ?? null) === (c.targetHandle ?? null)) ||
      (e.source === c.target && (e.sourceHandle ?? null) === (c.targetHandle ?? null) && e.target === c.source && (e.targetHandle ?? null) === (c.sourceHandle ?? null)));
    if (igual) { toast.warning("Já existe uma ligação idêntica entre estes terminais."); return; }
    const tipoNo = (no: string) => buscarTipo(nodes.find((n) => n.id === no)?.data.tipo ?? "").maxPorTerminal;
    if (grau(c.source, c.sourceHandle ?? null) >= tipoNo(c.source) || grau(c.target, c.targetHandle ?? null) >= tipoNo(c.target)) {
      toast.warning("Terminal sem capacidade para outra ligação.");
      return;
    }
    setEdges((at) => addEdge({ ...c, type: "smoothstep", style: ESTILO }, at));
    toast.success("Ligação criada.");
  }, [editar, edges, grau, nodes, setEdges]);

  const mudarNos = useCallback((ch: NodeChange<NoUnifilarType>[]) => {
    const filtro = editar ? ch : ch.filter((m) => m.type === "select" || m.type === "dimensions");
    const fimArrasto = filtro.some((m) => m.type === "position" && (m as { dragging?: boolean }).dragging === false);
    setNodes(applyNodeChanges(filtro, nodes));
    if (fimArrasto) registrar();
  }, [editar, nodes, registrar, setNodes]);

  const campo = useCallback((k: "codigo" | "nome" | "vao" | "id_ativo", v: string | number | null) => {
    if (!sel) return;
    setNodes((at) => at.map((n) => (n.id === sel.id ? { ...n, data: { ...n.data, [k]: v } } : n)));
  }, [sel, setNodes]);

  function salvarAgora() {
    const snapshot = normalizarSnapshot({ nodes, edges });
    setSalvando(true);
    void api.put<RespostaDiagrama>(`/unifilar/diagrama/${idSubestacao}`, snapshot)
      .then(({ data }) => {
        const salvo = normalizarSnapshot(data);
        setNodes(salvo.nodes);
        setEdges(salvo.edges);
        ultimaAssinaturaServidor.current = assinatura(salvo);
        salvarLocal(salvo, idSubestacao, nomeSubestacao);
        avisoFalhaAutosave.current = false;
        toast.success("Diagrama salvo no servidor.");
      })
      .catch(() => {
        salvarLocal(snapshot, idSubestacao, nomeSubestacao);
        toast.error("Falha ao salvar no servidor; o rascunho ficou neste navegador.");
      })
      .finally(() => setSalvando(false));
  }

  const tecla = useCallback((e: React.KeyboardEvent) => {
    if (!editar) return;
    const ctrl = e.ctrlKey || e.metaKey;
    const alvo = e.target as HTMLElement | null;
    const digitando = !!alvo && (
      alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" ||
      alvo.tagName === "SELECT" || alvo.isContentEditable
    );
    if (digitando && !ctrl) return;
    if (ctrl && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? refazer() : desfazer(); }
    else if (ctrl && e.key.toLowerCase() === "s") { e.preventDefault(); salvarAgora(); }
    else if (ctrl && e.key.toLowerCase() === "d") { e.preventDefault(); duplicar(); }
    else if ((e.key === "Delete" || e.key === "Backspace") && idLigSel) {
      e.preventDefault(); removerLigacao(idLigSel);
    }
    else if (e.key === "r" && !ctrl && sel) { rotacionar(); }
  }, [duplicar, desfazer, editar, idLigSel, refazer, removerLigacao, rotacionar, sel]);

  return (
    <div className="flex h-full min-h-0 flex-col" tabIndex={-1} onKeyDown={tecla}>
      <div className="z-10 flex items-center gap-1.5 border-b bg-white px-2 py-1.5">
        {podeEditar && (
          <Button variant={modoEdicao ? "default" : "outline"} size="sm" className="h-7 px-2 text-xs"
            onClick={() => setModoEdicao((m) => !m)} title="Alternar entre modo de navegação e edição">
            {modoEdicao ? <><Pencil className="mr-1 h-3.5 w-3.5" />Editando</> : <><Eye className="mr-1 h-3.5 w-3.5" />Navegação</>}
          </Button>
        )}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <Button variant="ghost" size="sm" className="h-7" onClick={desfazer} disabled={!editar || !podeUndo} title="Desfazer (Ctrl+Z)"><Undo2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-7" onClick={refazer} disabled={!editar || !podeRedo} title="Refazer (Ctrl+Shift+Z)"><Redo2 className="h-4 w-4" /></Button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <Button variant="ghost" size="sm" className="h-7" onClick={rotacionar} disabled={!editar || !sel} title="Rotacionar (R)"><RotateCw className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-7" onClick={duplicar} disabled={!editar || !sel} title="Duplicar (Ctrl+D)"><Copy className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-7 text-red-600" onClick={excluir} disabled={!editar || (!sel && !idLigSel)}
          title={idLigSel ? "Excluir ligação (Del)" : "Excluir componente (Del)"}><Trash2 className="h-4 w-4" /></Button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <Button variant="ghost" size="sm" className="h-7" onClick={() => fitView({ padding: 0.2, duration: 300 })} title="Ajustar visualização"><Maximize2 className="h-4 w-4" /></Button>
        <div className="ml-auto flex items-center gap-1">
          {!editar && (
            <span className="mr-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">modo leitura</span>
          )}
          {editar && (
            <span className="mr-1 hidden rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 sm:inline">
              Dica: arraste entre terminais para ligar; clique na linha para remover
            </span>
          )}
          {podeEditar && modoEdicao && (
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={salvarAgora} disabled={!editar || !pronto || salvando} title="Salvar (Ctrl+S)">
              <Save className="mr-1 h-3.5 w-3.5" />{salvando ? "Salvando..." : "Salvar"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-44 shrink-0 overflow-y-auto border-r bg-white p-2">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Componentes</p>
          {CATEGORIAS.map((cat) => {
            const itens = CATALOGO.filter((t) => t.categoria === cat);
            if (!itens.length) return null;
            return (
              <div key={cat} className="mb-3">
                <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">{ROTULO[cat]}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {itens.map((d) => (
                    <button key={d.codigo} type="button" disabled={!editar || !pronto} draggable={editar && pronto}
                      onDragStart={(e) => { e.dataTransfer.setData("text/unifilar", d.codigo); fonteArraste.current = d.codigo; }}
                      onDragEnd={() => { fonteArraste.current = null; }}
                      onClick={() => doCentro(d.codigo)}
                      title={`${d.nome}${editar ? " — clique para inserir ou arraste" : ""}`}
                      className="flex flex-col items-center justify-center rounded border border-slate-300 bg-white p-1.5 hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40">
                      <Miniatura tipoCodigo={d.codigo} w={26} h={28} />
                      <span className="line-clamp-2 text-center text-[9px] leading-tight text-slate-600">{d.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>

        <div ref={areaRef} className="relative min-w-0 flex-1" onDrop={onDrop} onDragOver={(e) => editar && e.preventDefault()}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={mudarNos}
            onConnect={onConnect}
            onMove={(_, v) => setVista(v)}
            onNodeClick={(_, n) => { setIdSel(n.id); setIdLigSel(null); }}
            onPaneClick={() => { setIdSel(null); setIdLigSel(null); }}
            nodesConnectable={editar && pronto}
            nodesDraggable={editar && pronto}
            connectionMode={ConnectionMode.Loose}
            connectionRadius={40}
            minZoom={0.08}
            maxZoom={2.5}
            snapToGrid={editar}
            snapGrid={[10, 10]}
            deleteKeyCode={editar ? ["Backspace", "Delete"] : null}
            defaultEdgeOptions={{ type: "smoothstep", style: ESTILO }}
            connectionLineStyle={ESTILO}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
            <Controls position="bottom-right" showInteractive={editar} />
          </ReactFlow>
          <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible">
            <g transform={`translate(${vista.x} ${vista.y}) scale(${vista.zoom})`}>
              {linhas.map((linha) => {
                const selecionada = linha.id === idLigSel;
                const destacada = selecionada || linha.id === idLigHover;
                return (
                  <g key={linha.id}>
                    {editar && pronto && (
                      <path
                        d={caminho(linha.pontos)}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={Math.min(140, 16 / Math.max(vista.zoom, 0.08))}
                        style={{ pointerEvents: "stroke", cursor: "pointer" }}
                        onMouseEnter={() => setIdLigHover(linha.id)}
                        onMouseLeave={() => setIdLigHover((atual) => (atual === linha.id ? null : atual))}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setIdLigSel(linha.id);
                          setIdSel(null);
                        }}
                      >
                        <title>Clique para selecionar a ligação</title>
                      </path>
                    )}
                    <path
                      d={caminho(linha.pontos)}
                      fill="none"
                      stroke={selecionada ? "#dc2626" : destacada ? "#2563eb" : COR_LIGACAO}
                      strokeWidth={selecionada ? 3.5 : destacada ? 3 : 2.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      style={{ pointerEvents: "none" }}
                    />
                    <circle cx={linha.pontos[0].x} cy={linha.pontos[0].y} r={3} fill={selecionada ? "#dc2626" : COR_LIGACAO} style={{ pointerEvents: "none" }} />
                    <circle cx={linha.pontos[linha.pontos.length - 1].x} cy={linha.pontos[linha.pontos.length - 1].y} r={3} fill={selecionada ? "#dc2626" : COR_LIGACAO} style={{ pointerEvents: "none" }} />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <aside className="w-56 shrink-0 overflow-y-auto border-l bg-white p-3">
          {ligSel && (
            <div className="grid gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Ligação</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-800">
                  <strong>{rotuloDe(ligSel.source)}</strong>
                  <span className="text-slate-400"> ({ligSel.sourceHandle})</span>
                  <span className="mx-1 text-slate-400">→</span>
                  <strong>{rotuloDe(ligSel.target)}</strong>
                  <span className="text-slate-400"> ({ligSel.targetHandle})</span>
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Clique em outra linha para trocar a seleção. Pressione Delete para remover.
                </p>
              </div>
              <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => removerLigacao(ligSel.id)} disabled={!editar}>
                <Unlink className="mr-1 h-3.5 w-3.5" />Excluir ligação
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIdLigSel(null)}>
                Cancelar seleção
              </Button>
            </div>
          )}
          {!sel && !ligSel && (
            <p className="text-xs text-slate-500">
              {editar ? "Selecione um componente ou insira um novo pela biblioteca." : "Clique em um componente para ver suas informações."}
            </p>
          )}
          {sel && defSel && (
            <div className="grid gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Componente</p>
                <p className="text-sm font-semibold text-slate-900">{defSel.nome}</p>
                <p className="text-[10px] text-slate-500">ID interno {sel.id.slice(0, 10)}</p>
                <Button variant="outline" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={rotacionar} disabled={!editar}>
                  <RotateCw className="mr-1 h-3.5 w-3.5" />Girar 90° (atual: {rotacaoNormalizada(sel.data.rotacao)}°)
                </Button>
              </div>
              <label className="grid gap-1 text-[11px] font-semibold text-slate-700">
                Código / identificação
                <Input value={sel.data.codigo} disabled={!editar} onChange={(e) => campo("codigo", e.target.value)} className="h-8 text-xs" />
              </label>
              <label className="grid gap-1 text-[11px] font-semibold text-slate-700">
                Nome
                <Input value={sel.data.nome} disabled={!editar} placeholder={defSel.nome} onChange={(e) => campo("nome", e.target.value)} className="h-8 text-xs" />
              </label>
              <label className="grid gap-1 text-[11px] font-semibold text-slate-700">
                Vão
                <Input value={sel.data.vao} disabled={!editar} placeholder="ex.: 15D7" onChange={(e) => campo("vao", e.target.value)} className="h-8 text-xs" />
              </label>
              {defSel.aceitaAtivo && (
                <label className="grid gap-1 text-[11px] font-semibold text-slate-700">
                  Ativo associado
                  <select
                    value={sel.data.id_ativo ?? ""}
                    disabled={!editar}
                    onChange={(e) => campo("id_ativo", e.target.value ? Number(e.target.value) : null)}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-normal disabled:bg-slate-100"
                  >
                    <option value="">Sem associação</option>
                    {ativos.map((ativo) => (
                      <option key={ativo.id_ativo} value={ativo.id_ativo}>
                        {ativo.codigo_ativo}{ativo.bay ? ` — vão ${ativo.bay}` : ""}
                      </option>
                    ))}
                  </select>
                  {sel.data.id_ativo != null && (
                    <span className="text-[10px] font-normal text-slate-500">
                      {ativos.find((ativo) => ativo.id_ativo === sel.data.id_ativo)?.status ?? "Ativo da subestação"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/ativo/${sel.data.id_ativo}`)}
                    className="mt-1 inline-flex items-center gap-1 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    Ver ativo #{sel.data.id_ativo}
                  </button>
                </label>
              )}
              <div className="text-[11px] text-slate-600">
                <p><strong className="text-slate-700">Ligações:</strong>{" "}
                  {edges.filter((e) => e.source === sel.id || e.target === sel.id).length}</p>
                <Button variant="outline" size="sm" className="mt-2 h-7 w-full px-2 text-[11px] text-red-600"
                  onClick={removerLigacoesDoComponente}
                  disabled={!editar || !edges.some((e) => e.source === sel.id || e.target === sel.id)}
                  title="Remove todas as ligações deste componente">
                  <Unlink className="mr-1 h-3.5 w-3.5" />Excluir as ligações
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function EditorUnifilar(props: { idSubestacao: number; nomeSubestacao: string; podeEditar: boolean }) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
