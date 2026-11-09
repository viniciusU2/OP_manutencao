/**
 * EditorUnifilar â€” Etapa 1 (editor gráfico) sobre React Flow.
 * Biblioteca lateral + canvas + painel de propriedades.
 * Persistência: localStorage por subestação (banco na Etapa 2).
 * Modo: navegação (leitura) é o padrão; edição exige podeEditar.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Background, BackgroundVariant, ConnectionMode, Controls,
  addEdge, applyEdgeChanges, applyNodeChanges, ReactFlow, ReactFlowProvider,
  useEdgesState, useNodesState, useReactFlow, useUpdateNodeInternals,
} from "@xyflow/react";
import type { Connection, Edge, NodeChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import {
  Copy, Eye, Maximize2, Pencil, Redo2, RotateCw, Save, Trash2, Undo2,
} from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import api from "../../api/api";
import { CATALOGO, CATEGORIAS, tipo as buscarTipo } from "./catalogo";
import { SimboloUnifilar } from "./SimboloUnifilar";
import { NoUnifilar, type NoUnifilarType } from "./NoUnifilar";

const nodeTypes = { noUnifilar: NoUnifilar } as const;
const FORMATO = "diagrama-unifilar-v1";

const PREFIXO: Record<string, string> = {
  BARRAMENTO: "BAR", DISJUNTOR: "DJ", SECCIONADORA: "SEC",
  SECCIONADORA_ATERRAMENTO: "SCT", TC: "TC", TP: "TP", TPC: "TPC",
  PARA_RAIOS: "PR", REATOR: "REA", TRANSFORMADOR: "TR",
  CONEXAO: "CX", ETIQUETA_VAO: "VAO",
};

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
const ESTILO = { strokeWidth: 2, stroke: "#0f172a" } as const;

/** id unico seguro para contextos http (crypto.randomUUID exige https). */
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
      // descarta arestas legadas de versao com ponta indefinida ou no
      // inexistente (compatibilidade com rascunhos salvos antes do
      // modo Loose): ligacao sem terminal definido nao e confiavel
      const ids = new Set(d.nodes.map((n) => n.id));
      const boas = d.edges.filter(
        (e) =>
          ids.has(e.source) &&
          ids.has(e.target) &&
          typeof e.sourceHandle === "string" &&
          typeof e.targetHandle === "string" &&
          e.source !== e.target,
      );
      return { nodes: d.nodes, edges: boas };
    }
  } catch { /* corrompido: vazio */ }
  return null;
}

function normalizarSnapshot(valor: Partial<Snapshot> | null | undefined): Snapshot {
  const nodes = Array.isArray(valor?.nodes) ? valor.nodes.map((node) => {
    const definicao = buscarTipo(node.data?.tipo ?? "CONEXAO");
    return {
      ...node,
      type: "noUnifilar" as const,
      data: {
        ...node.data,
        codigo: node.data?.codigo ?? "",
        nome: node.data?.nome ?? "",
        vao: node.data?.vao ?? "",
        rotacao: node.data?.rotacao ?? 0,
        largura: node.data?.largura ?? definicao.largura,
        altura: node.data?.tipo === "REATOR" && node.data?.altura === 80
          ? definicao.altura
          : node.data?.altura ?? definicao.altura,
      },
    };
  }) : [];
  const edges = Array.isArray(valor?.edges) ? valor.edges.map((edge) => ({
    ...edge,
    type: edge.type ?? "smoothstep",
    style: ESTILO,
  })) : [];
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

function proxCodigo(nodes: NoUnifilarType[], tipoCod: string): string {
  const p = PREFIXO[tipoCod] ?? tipoCod.slice(0, 3).toUpperCase();
  const usados = new Set(nodes.map((n) => n.data.codigo).filter((c) => c.startsWith(p)));
  let n = 1;
  while (usados.has(`${p}${String(n).padStart(2, "0")}`)) n += 1;
  return `${p}${String(n).padStart(2, "0")}`;
}

function Miniatura({ tipoCodigo, w, h }: { tipoCodigo: string; w: number; h: number }) {
  return (
    <span className="flex h-10 w-full items-center justify-center overflow-hidden">
      <SimboloUnifilar tipo={tipoCodigo} largura={w} altura={h} />
    </span>
  );
}

function Canvas({ idSubestacao, nomeSubestacao, podeEditar }: {
  idSubestacao: number; nomeSubestacao: string; podeEditar: boolean;
}) {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const navigate = useNavigate();
  const atualizarInternos = useUpdateNodeInternals();

  const inicial = useMemo<Snapshot>(() => carregarLocal(idSubestacao) ?? { nodes: [], edges: [] }, [idSubestacao]);
  const [nodes, setNodes] = useNodesState<NoUnifilarType>(inicial.nodes);
  const [edges, setEdges] = useEdgesState(inicial.edges);
  const [modoEdicao, setModoEdicao] = useState(podeEditar);
  const [idSel, setIdSel] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [ativos, setAtivos] = useState<AtivoAssociavel[]>([]);
  const fonteArraste = useRef<string | null>(null);
  const ultimaAssinaturaServidor = useRef("");
  const avisoFalhaAutosave = useRef(false);
  const editar = modoEdicao && podeEditar;

  // quando o papel do usuario chega (carregamento async), o modo inicial acompanha
  useEffect(() => setModoEdicao(podeEditar), [podeEditar]);

  useEffect(() => {
    let ativo = true;
    api.get<AtivoAssociavel[]>(`/ativos/${idSubestacao}`)
      .then(({ data }) => { if (ativo) setAtivos(Array.isArray(data) ? data : []); })
      .catch(() => { if (ativo) setAtivos([]); });
    return () => { ativo = false; };
  }, [idSubestacao]);

  // histórico
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

  // Carrega do servidor; rascunho local so migra se o servidor nunca
  // recebeu um diagrama para esta subestacao.
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
          const migrado = normalizarSnapshot(rascunho);
          const resposta = await api.put<RespostaDiagrama>(
            `/unifilar/diagrama/${idSubestacao}`,
            migrado,
          );
          if (!ativo) return;
          snapshot = normalizarSnapshot(resposta.data);
          toast.success("Rascunho local migrado para o servidor.");
        }

        setNodes(snapshot.nodes);
        setEdges(snapshot.edges);
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

  // Mantem uma copia local de recuperacao; a persistencia oficial e remota.
  useEffect(() => {
    if (!pronto) return;
    const snapshot = normalizarSnapshot({ nodes, edges });
    const timer = setTimeout(() => salvarLocal(snapshot, idSubestacao, nomeSubestacao), 700);
    return () => clearTimeout(timer);
  }, [edges, idSubestacao, nomeSubestacao, nodes, pronto]);

  // Autosave remoto com debounce, somente durante edicao autorizada.
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

  const salvarAgora = useCallback(() => {
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
  }, [edges, idSubestacao, nomeSubestacao, nodes, setEdges, setNodes]);

  // mutações
  const inserir = useCallback((tipoCod: string, x: number, y: number) => {
    registrar();
    const def = buscarTipo(tipoCod);
    const novo: NoUnifilarType = {
      id: `c${idUnico()}`, type: "noUnifilar", position: { x, y },
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

  const rotacionar = useCallback(() => {
    if (!sel) return;
    registrar();
    const nova = (((sel.data.rotacao ?? 0) + 90) % 360);
    setNodes((at) => at.map((n) => (n.id === sel.id ? { ...n, data: { ...n.data, rotacao: nova } } : n)));
    atualizarInternos(sel.id);
  }, [atualizarInternos, registrar, sel, setNodes]);

  const duplicar = useCallback(() => {
    if (!sel) return;
    registrar();
    const def = buscarTipo(sel.data.tipo);
    const copia: NoUnifilarType = {
      ...sel, id: `c${idUnico()}`,
      position: { x: sel.position.x + 30, y: sel.position.y + 30 },
      data: { ...sel.data, codigo: proxCodigo(nodes, def.codigo) }, selected: false,
    };
    setNodes((at) => [...at, copia]);
    setIdSel(copia.id);
  }, [nodes, registrar, sel, setNodes]);

  const excluir = useCallback(() => {
    if (!sel) return;
    registrar();
    const lig = new Set(edges.filter((e) => e.source === sel.id || e.target === sel.id).map((e) => e.id));
    setEdges((at) => at.filter((e) => !lig.has(e.id)));
    setNodes((at) => at.filter((n) => n.id !== sel.id));
    setIdSel(null);
  }, [edges, registrar, sel, setEdges, setNodes]);

  // conexões com validação por terminal
  const grau = useCallback((no: string, term: string | null) =>
    edges.filter((e) => (e.source === no && e.sourceHandle === term) || (e.target === no && e.targetHandle === term)).length,
  [edges]);

  const onConnect = useCallback((c: Connection) => {
    if (!editar || !c.source || !c.target) return;
    if (c.source === c.target) { toast.warning("Um componente não se liga a si mesmo."); return; }
    const igual = edges.some((e) =>
      (e.source === c.source && e.sourceHandle === c.sourceHandle && e.target === c.target && e.targetHandle === c.targetHandle) ||
      (e.source === c.target && e.sourceHandle === c.targetHandle && e.target === c.source && e.targetHandle === c.sourceHandle));
    if (igual) { toast.warning("Já existe uma ligação idêntica entre estes terminais."); return; }
    const tipoNo = (no: string) => buscarTipo(nodes.find((n) => n.id === no)?.data.tipo ?? "").maxPorTerminal;
    if (grau(c.source, c.sourceHandle) >= tipoNo(c.source) || grau(c.target, c.targetHandle) >= tipoNo(c.target)) {
      toast.warning("Terminal sem capacidade para outra ligação.");
      return;
    }
    setEdges((at) => addEdge({ ...c, type: "smoothstep", style: ESTILO }, at));
  }, [editar, edges, grau, nodes, setEdges]);

  // mudanças de nós/arestas conforme o modo
  const mudarNos = useCallback((ch: NodeChange<NoUnifilarType>[]) => {
    const filtro = editar ? ch : ch.filter((m) => m.type === "select" || m.type === "dimensions");
    const fimArrasto = filtro.some((m) => m.type === "position" && (m as { dragging?: boolean }).dragging === false);
    setNodes(applyNodeChanges(filtro, nodes));
    if (fimArrasto) registrar();
  }, [editar, nodes, registrar, setNodes]);

  const mudarLig = useCallback((ch: Parameters<typeof applyEdgeChanges>[0]) => {
    const filtro = editar ? ch.filter((m) => m.type !== "remove") : ch.filter((m) => m.type === "select");
    setEdges(applyEdgeChanges(filtro, edges));
  }, [editar, edges, setEdges]);

  // propriedades
  const campo = useCallback((k: "codigo" | "nome" | "vao" | "id_ativo", v: string | number | null) => {
    if (!sel) return;
    setNodes((at) => at.map((n) => (n.id === sel.id ? { ...n, data: { ...n.data, [k]: v } } : n)));
  }, [sel, setNodes]);

  // atalhos
  const tecla = useCallback((e: React.KeyboardEvent) => {
    if (!editar) return;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? refazer() : desfazer(); }
    else if (ctrl && e.key.toLowerCase() === "s") { e.preventDefault(); salvarAgora(); }
    else if (ctrl && e.key.toLowerCase() === "d") { e.preventDefault(); duplicar(); }
    else if (e.key === "r" && !ctrl && sel) { rotacionar(); }
  }, [duplicar, desfazer, editar, refazer, rotacionar, salvarAgora, sel]);

  const defSel = sel ? buscarTipo(sel.data.tipo) : null;

  return (
    <div className="flex h-full min-h-0 flex-col" tabIndex={-1} onKeyDown={tecla}>
      {/* barra de ferramentas */}
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
        <Button variant="ghost" size="sm" className="h-7 text-red-600" onClick={excluir} disabled={!editar || !sel} title="Excluir (Del)"><Trash2 className="h-4 w-4" /></Button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <Button variant="ghost" size="sm" className="h-7" onClick={() => fitView({ padding: 0.2, duration: 300 })} title="Ajustar visualização"><Maximize2 className="h-4 w-4" /></Button>
        <div className="ml-auto flex items-center gap-1">
          {!editar && (
            <span className="mr-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              modo leitura
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
        {/* biblioteca */}
        <aside className="w-52 shrink-0 overflow-y-auto border-r bg-white p-2">
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
                      title={`${d.nome}${editar ? " â€” clique para inserir ou arraste" : ""}`}
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

        {/* canvas */}
        <div className="relative min-w-0 flex-1" onDrop={onDrop} onDragOver={(e) => editar && e.preventDefault()}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={mudarNos}
            onEdgesChange={mudarLig}
            onConnect={onConnect}
            onNodeClick={(_, n) => setIdSel(n.id)}
            onPaneClick={() => setIdSel(null)}
            nodesConnectable={editar && pronto}
            nodesDraggable={editar && pronto}
            connectionMode={ConnectionMode.Loose}
            connectionRadius={30}
            elementsSelectable
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
        </div>

        {/* painel de propriedades */}
        <aside className="w-60 shrink-0 overflow-y-auto border-l bg-white p-3">
          {!sel && (
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

