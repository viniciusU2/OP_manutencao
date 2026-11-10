/**
 * Ambiente de operacao estilo SAGE (SCADA) sobre o diagrama unifilar.
 *
 * Simulacao local: nenhum comando e enviado ao campo. O estado parte de
 * todos os disjuntores/seccionadoras fechados e aterramentos abertos e
 * pode ser restaurado. Cada manobra passa por intertravamento e fica
 * registrada na lista de eventos.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Move,
  Power,
  RefreshCcw,
  RotateCcw,
  X,
} from "lucide-react";

import api from "../api/api";
import SageUnifilar, { type SageNode } from "../components/unifilar/SageUnifilar";
import { tipo as buscarTipo } from "../components/unifilar/catalogo";
import { dimensoesRotacionadas } from "../components/unifilar/NoUnifilar";
import type { Edge } from "@xyflow/react";
import { useAuth } from "../context/AuthContext";
import {
  analisar,
  escolherFonte,
  estadoInicial,
  ehOperavel,
  validarComando,
  type AnaliseSage,
  type ArestaSim,
  type ComponenteSim,
  type EstadoChave,
} from "../lib/sageSim";

type Severidade = "INFO" | "ATENCAO" | "ALARME";
type Evento = { id: string; hora: Date; severidade: Severidade; texto: string };

const NOME_TIPO: Record<string, string> = {
  BARRAMENTO: "Barramento",
  DISJUNTOR: "Disjuntor",
  SECCIONADORA: "Seccionadora",
  SECCIONADORA_ATERRAMENTO: "Seccionadora de aterramento",
  TC: "Transformador de corrente",
  TP: "Transformador de potencial",
  TPC: "Transformador de potencial capacitivo",
  PARA_RAIOS: "Para-raios",
  REATOR: "Reator",
  TRANSFORMADOR: "Transformador de potencia",
  CONEXAO: "Ponto de conexao",
  ETIQUETA_VAO: "Identificacao de vao",
};

type DiagramaApi = {
  nodes?: Array<{
    id: string;
    position?: { x: number; y: number };
    data?: {
      tipo?: string;
      codigo?: string;
      nome?: string;
      vao?: string;
      rotacao?: number;
      largura?: number;
      altura?: number;
      id_ativo?: number | null;
    };
  }>;
  edges?: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }>;
};

type SubestacaoApi = { id_subestacao: number; nome: string; tensao_kv?: number | null };

function idEvento() {
  return Math.random().toString(36).slice(2, 9);
}

function normalizarNos(nodes: DiagramaApi["nodes"]): SageNode[] {
  return (nodes ?? []).map((n) => {
    const def = buscarTipo(n.data?.tipo ?? "CONEXAO");
    const largura = n.data?.largura ?? def.largura;
    const altura = n.data?.altura ?? def.altura;
    const rotacao = n.data?.rotacao ?? 0;
    const { w, h } = dimensoesRotacionadas(largura, altura, rotacao);
    return {
      id: n.id,
      type: "noUnifilar",
      position: n.position ?? { x: 0, y: 0 },
      width: w,
      height: h,
      data: {
        tipo: def.codigo,
        codigo: n.data?.codigo ?? "",
        nome: n.data?.nome ?? "",
        vao: n.data?.vao ?? "",
        rotacao,
        largura,
        altura,
        id_ativo: n.data?.id_ativo ?? null,
      },
    };
  });
}

function classeSeveridade(sev: Severidade) {
  if (sev === "ALARME") return "text-red-600";
  if (sev === "ATENCAO") return "text-amber-700";
  return "text-slate-700";
}

function classePonto(sev: Severidade) {
  if (sev === "ALARME") return "bg-red-500";
  if (sev === "ATENCAO") return "bg-amber-500";
  return "bg-blue-400";
}

export function SagePage() {
  const { id } = useParams<{ id: string }>();
  const idSubestacao = Number(id);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [nome, setNome] = useState("");
  const [tensaoBase, setTensaoBase] = useState(500);
  const [nos, setNos] = useState<SageNode[]>([]);
  const [arestas, setArestas] = useState<ArestaSim[]>([]);
  const [edgesFlow, setEdgesFlow] = useState<Edge[]>([]);
  const [componentes, setComponentes] = useState<ComponenteSim[]>([]);
  const [estados, setEstados] = useState<Record<string, EstadoChave>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [comando, setComando] = useState<{ id: string; novo: EstadoChave } | null>(null);
  const [agora, setAgora] = useState(new Date());
  const [versao, setVersao] = useState(0);
  const [posicao, setPosicao] = useState<{ x: number; y: number } | null>(null);
  const arraste = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Janela de comando flutuante: posicao aleatoria e descentralizada a cada
  // equipamento selecionado, como as janelas do supervisório.
  useEffect(() => {
    if (!selecionadoId) {
      setPosicao(null);
      return;
    }
    const largura = Math.min(340, Math.max(260, window.innerWidth * 0.26));
    const altura = 280;
    const minX = Math.round(window.innerWidth * 0.14);
    const maxX = Math.max(minX, Math.min(window.innerWidth - largura - 12, Math.round(window.innerWidth * 0.66)));
    const minY = Math.round(window.innerHeight * 0.16);
    const maxY = Math.max(minY, Math.min(window.innerHeight - altura - 12, Math.round(window.innerHeight * 0.56)));
    const x = minX + Math.random() * Math.max(1, maxX - minX);
    const y = minY + Math.random() * Math.max(1, maxY - minY);
    setPosicao({ x: Math.round(x), y: Math.round(y) });
  }, [selecionadoId]);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    setErro("");
    setSelecionadoId(null);
    setComando(null);

    Promise.allSettled([
      api.get<DiagramaApi>(`/unifilar/diagrama/${idSubestacao}`),
      api.get<SubestacaoApi[]>("/subestacao"),
    ])
      .then(([diagRes, subRes]) => {
        if (!vivo) return;
        if (diagRes.status === "rejected") {
          setErro("Nao foi possivel carregar o diagrama desta instalacao.");
          return;
        }

        const diagrama = diagRes.value.data ?? {};
        const nosNorm = normalizarNos(diagrama.nodes);
        const comps: ComponenteSim[] = nosNorm.map((n) => ({
          id: n.id,
          tipo: n.data.tipo,
          codigo: n.data.codigo,
          nome: n.data.nome,
          id_ativo: n.data.id_ativo,
        }));
        const listaArestas: ArestaSim[] = (diagrama.edges ?? []).map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        }));
        const ligacoes = (diagrama.edges ?? []).map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? null,
          targetHandle: e.targetHandle ?? null,
          type: "smoothstep" as const,
        }));

        if (subRes.status === "fulfilled") {
          const sub = (subRes.value.data ?? []).find((s) => Number(s.id_subestacao) === idSubestacao);
          setNome(sub?.nome ?? `Instalacao #${idSubestacao}`);
          if (sub?.tensao_kv) setTensaoBase(Number(sub.tensao_kv));
        } else {
          setNome(`Instalacao #${idSubestacao}`);
        }

        const iniciais = estadoInicial(comps);
        let restaurados = iniciais;
        try {
          const cru = localStorage.getItem(`sage:estados:${idSubestacao}`);
          if (cru) {
            const salvo = JSON.parse(cru) as Record<string, EstadoChave>;
            const mesclado: Record<string, EstadoChave> = { ...iniciais };
            for (const chave of Object.keys(mesclado)) {
              if (salvo[chave] === "ABERTO" || salvo[chave] === "FECHADO") mesclado[chave] = salvo[chave];
            }
            restaurados = mesclado;
          }
        } catch {
          restaurados = iniciais;
        }

        setNos(nosNorm);
        setArestas(listaArestas);
        setEdgesFlow(ligacoes);
        setComponentes(comps);
        setEstados(restaurados);

        const posicoes = Object.fromEntries(nosNorm.map((n) => [n.id, n.position]));
        const fonte = escolherFonte(comps, posicoes);
        const codigoFonte = comps.find((c) => c.id === fonte)?.codigo ?? "-";
        setEventos([
          { id: idEvento(), hora: new Date(), severidade: "INFO", texto: "Sessao de supervisao iniciada (modo simulacao)." },
          { id: idEvento(), hora: new Date(), severidade: "INFO", texto: `Fonte de energia simulada: ${codigoFonte}.` },
          { id: idEvento(), hora: new Date(), severidade: "INFO", texto: `Diagrama carregado: ${comps.length} componentes e ${listaArestas.length} conexoes.` },
        ]);
      })
      .catch(() => {
        if (vivo) setErro("Nao foi possivel carregar o diagrama desta instalacao.");
      })
      .finally(() => {
        if (vivo) setCarregando(false);
      });

    return () => {
      vivo = false;
    };
  }, [idSubestacao, versao]);

  const posicoes = useMemo(
    () => Object.fromEntries(nos.map((n) => [n.id, n.position])),
    [nos],
  );
  const fonteId = useMemo(() => escolherFonte(componentes, posicoes), [componentes, posicoes]);

  const analise: AnaliseSage = useMemo(
    () => analisar(componentes, arestas, estados, fonteId, tensaoBase, posicoes),
    [componentes, arestas, estados, fonteId, tensaoBase, posicoes],
  );

  const selecionado = componentes.find((c) => c.id === selecionadoId) ?? null;

  function registrar(texto: string, severidade: Severidade = "INFO") {
    setEventos((atual) => [
      { id: idEvento(), hora: new Date(), severidade, texto },
      ...atual,
    ].slice(0, 120));
  }

  function persistir(novos: Record<string, EstadoChave>) {
    try {
      localStorage.setItem(`sage:estados:${idSubestacao}`, JSON.stringify(novos));
    } catch {
      /* armazenamento indisponivel */
    }
  }

  function executar(alvoId: string, novo: EstadoChave) {
    const alvo = componentes.find((c) => c.id === alvoId);
    if (!alvo) return;
    const resultado = validarComando(alvo, novo, analise, estados, componentes, arestas);
    const acao = novo === "ABERTO" ? "ABERTURA" : "FECHAMENTO";

    if (!resultado.permitido) {
      registrar(
        severidadeDe(resultado.severidade) === "ALARME"
          ? `BLOQUEIO — ${alvo.codigo}: ${resultado.motivo}`
          : `${alvo.codigo}: ${resultado.motivo}`,
        severidadeDe(resultado.severidade),
      );
      if (resultado.severidade === "BLOQUEIO") toast.error(resultado.motivo);
      setComando(null);
      return;
    }

    const novos = { ...estados, [alvoId]: novo };
    const novaAnalise = analisar(componentes, arestas, novos, fonteId, tensaoBase, posicoes);
    setEstados(novos);
    persistir(novos);
    setComando(null);

    registrar(
      `${acao} — ${alvo.codigo} (${NOME_TIPO[alvo.tipo] ?? alvo.tipo}). ${resultado.motivo}`,
      severidadeDe(resultado.severidade),
    );

    const antes = new Map(analise.barras.map((b) => [b.id, b]));
    for (const barra of novaAnalise.barras) {
      const anterior = antes.get(barra.id);
      if (anterior?.energizada && !barra.energizada) {
        registrar(`Barramento ${barra.codigo} desenergizado.`, "ALARME");
      } else if (!anterior?.energizada && barra.energizada) {
        registrar(`Barramento ${barra.codigo} energizado — ${barra.tensaoKv.toFixed(1).replace(".", ",")} kV.`, "INFO");
      }
    }

    const cargasAntes = analise.cargas.filter((c) => c.energizada).length;
    const cargasDepois = novaAnalise.cargas.filter((c) => c.energizada).length;
    if (cargasDepois < cargasAntes) {
      registrar(`${cargasAntes - cargasDepois} carga(s) desenergizada(s) pela manobra.`, "ATENCAO");
    }
  }

  function restaurar() {
    if (!window.confirm("Restaurar todos os equipamentos para o estado inicial da simulacao?")) return;
    const iniciais = estadoInicial(componentes);
    setEstados(iniciais);
    persistir(iniciais);
    setComando(null);
    registrar("Estado inicial restaurado pelo operador.", "ATENCAO");
  }

  const previa = selecionado && ehOperavel(selecionado.tipo)
    ? validarComando(
        selecionado,
        estados[selecionado.id] === "ABERTO" ? "FECHADO" : "ABERTO",
        analise,
        estados,
        componentes,
        arestas,
      )
    : null;

  const alvoComando = comando ? componentes.find((c) => c.id === comando.id) ?? null : null;
  const fonte = componentes.find((c) => c.id === fonteId) ?? null;

  function iniciarArraste(evento: React.PointerEvent<HTMLDivElement>) {
    if (!posicao) return;
    arraste.current = { dx: evento.clientX - posicao.x, dy: evento.clientY - posicao.y };
    evento.preventDefault();
    const mover = (ev: PointerEvent) => {
      const d = arraste.current;
      if (!d) return;
      setPosicao({
        x: Math.max(4, Math.min(window.innerWidth - 120, ev.clientX - d.dx)),
        y: Math.max(4, Math.min(window.innerHeight - 60, ev.clientY - d.dy)),
      });
    };
    const soltar = () => {
      arraste.current = null;
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-3 p-3 sm:p-4">

      {erro && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          <AlertTriangle size={16} />
          {erro}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="relative min-h-[460px] overflow-hidden rounded-xl border border-slate-700 bg-slate-100 shadow-lg lg:min-h-[68vh]">
          {carregando ? (
            <div className="grid h-full min-h-[460px] place-items-center text-sm text-slate-500">
              Carregando diagrama...
            </div>
          ) : nos.length ? (
            <SageUnifilar
              nodes={nos}
              edges={edgesFlow}
              estados={estados}
              analise={analise}
              selecionadoId={selecionadoId}
              aoSelecionar={(id) => {
                setSelecionadoId(id);
                setComando(null);
              }}
            />
          ) : (
            <div className="grid h-full min-h-[460px] place-items-center px-6 text-center text-sm text-slate-500">
              Nenhum diagrama salvo para esta instalacao. Monte o arranjo no editor unifilar.
            </div>
          )}
          <div className="pointer-events-none absolute left-2 top-2 z-[7] rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
            Tensao de barra · <span className="text-red-600">vermelho = energizado</span> · <span className="text-emerald-600">verde = desenergizado/aberto</span>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-3">
          <section className="rounded-xl border border-blue-100 bg-white px-3 py-2.5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-slate-900">{nome || "Carregando..."}</p>
                  <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                    Simulacao
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                  {fonte ? (
                    <>Fonte <span className="font-mono font-semibold text-slate-700">{fonte.codigo}</span></>
                  ) : (
                    "Sem fonte"
                  )}
                  <span className="mx-1.5 text-slate-300">|</span>
                  {usuario?.nome ?? "Operador"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-1 font-mono text-[11px] tabular-nums text-slate-500">
                  {agora.toLocaleTimeString("pt-BR")}
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/subestacoes/${idSubestacao}/unifilar`)}
                  className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  title="Voltar ao unifilar"
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={restaurar}
                  disabled={!componentes.length}
                  className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"
                  title="Restaurar estado inicial"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setVersao((v) => v + 1)}
                  className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  title="Atualizar diagrama"
                >
                  <RefreshCcw size={14} />
                </button>
              </div>
            </div>
            <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
              Clique em um equipamento no diagrama para supervisionar e manobrar.
            </p>
          </section>

          <section className="flex min-h-[180px] flex-1 flex-col overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/70 px-3 py-2">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
                <AlertTriangle size={14} className="text-blue-600" />
                Eventos
              </h2>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                {eventos.length}
              </span>
            </div>
            <div className="max-h-[42vh] min-h-[120px] flex-1 overflow-y-auto px-3">
              <ul className="divide-y divide-blue-50">
                {eventos.map((evento) => (
                  <li key={evento.id} className="flex gap-2 py-2 transition hover:bg-blue-50/40">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${classePonto(evento.severidade)}`} />
                    <div className="min-w-0">
                      <p className={`text-[11px] leading-snug ${classeSeveridade(evento.severidade)}`}>
                        {evento.texto}
                      </p>
                      <p className="font-mono text-[9px] text-slate-500">
                        {evento.hora.toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <p className="border-t border-blue-50 bg-slate-50/60 px-3 py-2 text-[9px] leading-relaxed text-slate-500">
              Ambiente de simulacao. Nenhum comando e transmitido ao sistema supervisado.
            </p>
          </section>
        </aside>
      </div>

      {selecionado && posicao && (
        <div
          role="dialog"
          aria-label={`Supervisao de ${selecionado.codigo}`}
          className="fixed z-[90] w-[330px] max-w-[calc(100vw-24px)]"
          style={{ left: posicao.x, top: posicao.y }}
        >
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div
              onPointerDown={iniciarArraste}
              className="flex cursor-move touch-none select-none items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2"
              title="Arraste para reposicionar"
            >
              <Move size={13} className="text-blue-600" />
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Supervisao de equipamento
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelecionadoId(null);
                  setComando(null);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="ml-auto grid h-6 w-6 place-items-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label="Fechar janela"
                title="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-base font-bold text-slate-900">{selecionado.codigo}</p>
                  <p className="text-[11px] text-slate-500">{NOME_TIPO[selecionado.tipo] ?? selecionado.tipo}</p>
                </div>
                {ehOperavel(selecionado.tipo) && (
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                    estados[selecionado.id] === "ABERTO"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}>
                    {estados[selecionado.id] === "ABERTO" ? "ABERTO" : "FECHADO"}
                  </span>
                )}
              </div>

              {selecionado.id_ativo != null && (
                <Link
                  to={`/ativo/${selecionado.id_ativo}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  <ExternalLink size={12} />
                  Abrir ativo #{selecionado.id_ativo}
                </Link>
              )}

              {ehOperavel(selecionado.tipo) ? (
                <>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-700">Intertravamento: </span>
                    {previa ? previa.motivo : "Sem analise."}
                  </div>

                  {!comando && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setComando({ id: selecionado.id, novo: "ABERTO" })}
                        disabled={estados[selecionado.id] === "ABERTO"}
                        className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Power size={13} />
                        Abrir
                      </button>
                      <button
                        type="button"
                        onClick={() => setComando({ id: selecionado.id, novo: "FECHADO" })}
                        disabled={estados[selecionado.id] === "FECHADO"}
                        className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-red-300 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Power size={13} />
                        Fechar
                      </button>
                    </div>
                  )}

                  {comando && alvoComando && (
                    <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-2.5">
                      <p className="text-[11px] font-semibold text-amber-800">
                        Confirmar {comando.novo === "ABERTO" ? "abertura" : "fechamento"} de {alvoComando.codigo}?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => executar(comando.id, comando.novo)}
                          className="inline-flex h-7 flex-1 items-center justify-center rounded bg-amber-500 text-[11px] font-bold text-white hover:bg-amber-600"
                        >
                          Executar
                        </button>
                        <button
                          type="button"
                          onClick={() => setComando(null)}
                          className="inline-flex h-7 flex-1 items-center justify-center rounded border border-slate-300 bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Componente de supervisao (sem comando de manobra).
                </p>
              )}

              <p className="border-t border-slate-100 pt-1.5 text-[9px] text-slate-400">
                Arraste pelo titulo para mover a janela.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function severidadeDe(sev: "INFO" | "ATENCAO" | "BLOQUEIO"): Severidade {
  if (sev === "BLOQUEIO") return "ALARME";
  if (sev === "ATENCAO") return "ATENCAO";
  return "INFO";
}
