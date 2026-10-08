import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  ShieldAlert,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  Filter,
  RefreshCw,
  RotateCcw,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import Container from "../components/Container";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

type IndicadoresDashboard = {
  total_planos: number;
  planos_com_execucao: number;
  os_total: number;
  os_realizadas: number;
  os_abertas: number;
  os_vencidas: number;
  taxa_conclusao: number;
};

type PlanoResumo = {
  id_plano_manutencao: number;
  plano: string;
  tipo_ativo: string;
  total_itens: number;
  total_os: number;
  os_realizadas: number;
  os_abertas: number;
  os_vencidas: number;
  taxa_conclusao: number;
  ultima_execucao: string | null;
  proxima_execucao: string | null;
  instalacoes: string[];
};

type DashboardResponse = {
  indicadores: IndicadoresDashboard;
  planos: PlanoResumo[];
  instalacoes: string[];
};

type OrdemRealizada = {
  id_os: number;
  numero_os: string;
  status?: string | null;
  instalacao?: string | null;
  codigo_ativo?: string | null;
  tipo_ativo?: string | null;
  item_plano?: string | null;
  data_inicio_execucao?: string | null;
  data_execucao?: string | null;
  responsavel?: string | null;
  duracao_horas?: number | null;
  atraso_dias: number;
};

type HistoricoResponse = {
  items: OrdemRealizada[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  distribuicao_mensal: { mes: string; quantidade: number }[];
};

type Filtros = {
  data_inicio: string;
  data_fim: string;
  instalacao: string;
};

const INDICADORES_VAZIOS: IndicadoresDashboard = {
  total_planos: 0,
  planos_com_execucao: 0,
  os_total: 0,
  os_realizadas: 0,
  os_abertas: 0,
  os_vencidas: 0,
  taxa_conclusao: 0,
};

const DASHBOARD_VAZIO: DashboardResponse = {
  indicadores: INDICADORES_VAZIOS,
  planos: [],
  instalacoes: [],
};

const FILTROS_INICIAIS: Filtros = {
  data_inicio: "",
  data_fim: "",
  instalacao: "",
};

function formatarData(value?: string | null, comHora = false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    ...(comHora ? { timeStyle: "short" as const } : {}),
  }).format(date);
}

function formatarMes(value: string) {
  const [ano, mes] = value.split("-").map(Number);
  if (!ano || !mes) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(new Date(ano, mes - 1, 1));
}

function formatarNumero(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function percentual(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function paramsDosFiltros(filtros: Filtros) {
  return Object.fromEntries(
    Object.entries(filtros).filter(([, value]) => value.trim() !== "")
  );
}

function statusClass(status?: string | null) {
  const normalizado = status?.toUpperCase() ?? "";
  if (["ENCERRADA", "CONCLUIDA", "CONCLUÍDA", "EXECUTADA", "FINALIZADA"].includes(normalizado)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function PlanoDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse>(DASHBOARD_VAZIO);
  const [historico, setHistorico] = useState<HistoricoResponse | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<number | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  const possuiFiltroDeDados = Boolean(
    filtros.data_inicio || filtros.data_fim || filtros.instalacao
  );

  const periodoValido = !(
    filtros.data_inicio && filtros.data_fim && filtros.data_inicio > filtros.data_fim
  );

  const carregarDashboard = useCallback(async (filtrosAtuais: Filtros) => {
    setLoading(true);
    try {
      const { data } = await api.get<DashboardResponse>(
        "/planos-manutencao/dashboard",
        { params: paramsDosFiltros(filtrosAtuais) }
      );
      setDashboard(data);
      setAtualizadoEm(new Date());
      const filtrarComDados = Boolean(
        filtrosAtuais.data_inicio || filtrosAtuais.data_fim || filtrosAtuais.instalacao
      );
      const candidatos = filtrarComDados
        ? data.planos.filter((plano) => plano.total_os > 0)
        : data.planos;
      setPlanoSelecionado((atual) => {
        if (atual && candidatos.some((plano) => plano.id_plano_manutencao === atual)) {
          return atual;
        }
        return [...candidatos].sort((a, b) => b.os_realizadas - a.os_realizadas)[0]?.id_plano_manutencao ?? null;
      });
    } catch {
      setDashboard(DASHBOARD_VAZIO);
      toast.error("Erro ao carregar o dashboard dos planos");
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarHistorico = useCallback(
    async (planoId: number, paginaAtual: number, filtrosAtuais: Filtros) => {
      setLoadingHistorico(true);
      try {
        const { data } = await api.get<HistoricoResponse>(
          `/planos-manutencao/${planoId}/ordens-servico-realizadas`,
          {
            params: {
              ...paramsDosFiltros(filtrosAtuais),
              page: paginaAtual,
              page_size: 15,
            },
          }
        );
        setHistorico(data);
      } catch {
        setHistorico(null);
        toast.error("Erro ao carregar as OS realizadas do plano");
      } finally {
        setLoadingHistorico(false);
      }
    },
    []
  );

  useEffect(() => {
    if (periodoValido) void carregarDashboard(filtros);
  }, [carregarDashboard, filtros, periodoValido]);

  useEffect(() => {
    if (!planoSelecionado) {
      setHistorico(null);
      return;
    }
    if (periodoValido) void carregarHistorico(planoSelecionado, pagina, filtros);
  }, [carregarHistorico, filtros, pagina, periodoValido, planoSelecionado]);

  const planosNoRecorte = useMemo(
    () => possuiFiltroDeDados
      ? dashboard.planos.filter((plano) => plano.total_os > 0)
      : dashboard.planos,
    [dashboard.planos, possuiFiltroDeDados]
  );

  const planosOrdenados = useMemo(
    () => [...planosNoRecorte].sort((a, b) =>
      a.plano.localeCompare(b.plano, "pt-BR") || a.id_plano_manutencao - b.id_plano_manutencao
    ),
    [planosNoRecorte]
  );

  const ranking = useMemo(
    () => [...planosNoRecorte]
      .sort((a, b) => b.os_realizadas - a.os_realizadas || b.taxa_conclusao - a.taxa_conclusao)
      .slice(0, 8),
    [planosNoRecorte]
  );

  const selecionado = dashboard.planos.find(
    (plano) => plano.id_plano_manutencao === planoSelecionado
  );

  const indicadores = useMemo<IndicadoresDashboard>(() => {
    if (!selecionado) return INDICADORES_VAZIOS;
    return {
      total_planos: 1,
      planos_com_execucao: selecionado.os_realizadas > 0 ? 1 : 0,
      os_total: selecionado.total_os,
      os_realizadas: selecionado.os_realizadas,
      os_abertas: selecionado.os_abertas,
      os_vencidas: selecionado.os_vencidas,
      taxa_conclusao: selecionado.taxa_conclusao,
    };
  }, [selecionado]);

  const serieMensal = useMemo(() => {
    const dados = historico?.distribuicao_mensal.slice(-12) ?? [];
    const maior = Math.max(1, ...dados.map((item) => item.quantidade));
    const esquerda = 42;
    const topo = 18;
    const base = 178;
    const faixa = 620;
    const passo = dados.length > 1 ? faixa / (dados.length - 1) : 0;
    const pontos = dados.map((item, index) => ({
      ...item,
      x: dados.length === 1 ? esquerda + faixa / 2 : esquerda + passo * index,
      y: base - (item.quantidade / maior) * (base - topo),
    }));
    return {
      maior,
      pontos,
      linha: pontos.map((ponto) => `${ponto.x},${ponto.y}`).join(" "),
      area: pontos.length
        ? `${esquerda},${base} ${pontos.map((ponto) => `${ponto.x},${ponto.y}`).join(" ")} ${pontos.at(-1)?.x},${base}`
        : "",
    };
  }, [historico]);

  const composicao = useMemo(() => {
    const total = Math.max(indicadores.os_total, 1);
    const realizadas = (indicadores.os_realizadas / total) * 100;
    const vencidas = (indicadores.os_vencidas / total) * 100;
    const abertasNoPrazo = Math.max(0, indicadores.os_abertas - indicadores.os_vencidas);
    return {
      abertasNoPrazo,
      estilo: {
        background: `conic-gradient(#2563eb 0 ${realizadas}%, #ef4444 ${realizadas}% ${realizadas + vencidas}%, #f59e0b ${realizadas + vencidas}% 100%)`,
      },
    };
  }, [indicadores]);

  function limparFiltros() {
    setFiltros(FILTROS_INICIAIS);
    setPagina(1);
  }

  function atualizarFiltro(campo: keyof Filtros, valor: string) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
    setPagina(1);
  }

  function selecionarPlano(id: number) {
    setPlanoSelecionado(id);
    setPagina(1);
  }

  const kpis = [
    { label: "Plano selecionado", value: selecionado ? `#${selecionado.id_plano_manutencao}` : "—", detail: selecionado?.plano ?? "Selecione um plano", icon: Wrench, accent: "#2563eb", iconClass: "bg-blue-50 text-blue-700" },
    { label: "OS realizadas", value: formatarNumero(indicadores.os_realizadas), detail: `${formatarNumero(indicadores.os_total)} vinculadas a este plano`, icon: CheckCircle2, accent: "#059669", iconClass: "bg-emerald-50 text-emerald-700" },
    { label: "Índice de conclusão", value: percentual(indicadores.taxa_conclusao), detail: "No período selecionado", icon: CircleGauge, accent: "#7c3aed", iconClass: "bg-violet-50 text-violet-700" },
    { label: "OS em aberto", value: formatarNumero(indicadores.os_abertas), detail: `${composicao.abertasNoPrazo} dentro do prazo`, icon: ClipboardList, accent: "#d97706", iconClass: "bg-amber-50 text-amber-700" },
    { label: "OS vencidas", value: formatarNumero(indicadores.os_vencidas), detail: "Exigem acompanhamento", icon: AlertTriangle, accent: "#dc2626", iconClass: "bg-red-50 text-red-700" },
  ];

  return (
    <Container>
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-[#f3f5f8] shadow-sm">
        <header className="relative overflow-hidden bg-[#14213d] px-5 py-5 text-white md:px-7">
          <div className="absolute inset-y-0 right-0 w-56 bg-gradient-to-l from-blue-600/30 to-transparent" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                <BarChart3 size={15} /> Inteligência de manutenção
              </div>
              <h1 className="m-0 text-2xl font-semibold tracking-tight md:text-3xl">Desempenho dos planos preventivos</h1>
              <p className="mt-1 text-sm text-slate-300">Visão executiva das OS planejadas, realizadas e pendentes.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-2 text-right text-xs text-slate-300">
                <span className="block uppercase tracking-wide">Atualização</span>
                <strong className="text-white">
                  {atualizadoEm ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(atualizadoEm) : "Carregando..."}
                </strong>
              </div>
              <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link to="/manutencao-corretiva/dashboard"><ShieldAlert size={16} /> Corretivas</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link to="/inspecoes/dashboard"><ClipboardCheck size={16} /> Inspeções</Link>
              </Button>
              <Button asChild className="bg-[#f4b400] text-slate-950 hover:bg-[#ffc42c]">
                <Link to="/planos-manutencao"><Wrench size={16} /> Planos</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="border-b border-slate-300 bg-white px-5 py-4 md:px-7" aria-label="Filtros do dashboard">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700"><Filter size={16} className="text-blue-700" /> Filtros</h2>
            {possuiFiltroDeDados && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Recorte aplicado</span>}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_220px_180px_180px_auto] xl:items-end">
            <Slicer label="Plano de manutenção">
              <select value={planoSelecionado ?? ""} onChange={(event) => event.target.value && selecionarPlano(Number(event.target.value))} className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                {!planosOrdenados.length && <option value="">Nenhum plano encontrado</option>}
                {planosOrdenados.map((plano) => <option key={plano.id_plano_manutencao} value={plano.id_plano_manutencao}>#{plano.id_plano_manutencao} — {plano.plano}</option>)}
              </select>
            </Slicer>
            <Slicer label="Instalação">
              <select value={filtros.instalacao} onChange={(event) => atualizarFiltro("instalacao", event.target.value)} className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value="">Todas as instalações</option>
                {dashboard.instalacoes.map((instalacao) => <option key={instalacao} value={instalacao}>{instalacao}</option>)}
              </select>
            </Slicer>
            <Slicer label="Execução inicial"><Input type="date" value={filtros.data_inicio} onChange={(event) => atualizarFiltro("data_inicio", event.target.value)} className={`rounded ${periodoValido ? "border-slate-300" : "border-red-400"}`} /></Slicer>
            <Slicer label="Execução final"><Input type="date" value={filtros.data_fim} onChange={(event) => atualizarFiltro("data_fim", event.target.value)} className={`rounded ${periodoValido ? "border-slate-300" : "border-red-400"}`} /></Slicer>
            <div className="flex items-center justify-end gap-2">
              {loading && <span className="flex items-center gap-1.5 text-xs font-medium text-blue-700"><RefreshCw size={14} className="animate-spin" /> Atualizando</span>}
              <Button type="button" variant="outline" onClick={limparFiltros} disabled={loading || !possuiFiltroDeDados} aria-label="Limpar filtros" title="Limpar filtros"><RotateCcw size={16} /></Button>
            </div>
          </div>
          {!periodoValido && <p className="mt-2 text-xs font-medium text-red-600">A data inicial não pode ser posterior à data final.</p>}
        </section>

        <main className="space-y-4 p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return <section key={kpi.label} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: kpi.accent }} />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p><p className="mt-2 text-3xl font-bold tabular-nums text-slate-950">{loading ? "—" : kpi.value}</p><p className="mt-1 truncate text-xs text-slate-500">{kpi.detail}</p></div>
                  <span className={`rounded-lg p-2.5 ${kpi.iconClass}`}><Icon size={19} /></span>
                </div>
              </section>;
            })}
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.75fr)]">
            <Visual title="Evolução das OS realizadas" subtitle={selecionado ? `Plano #${selecionado.id_plano_manutencao} · ${selecionado.plano}` : "Selecione um plano"}>
              <div className="h-[292px] p-4">
                {loadingHistorico ? <VisualVazio>Carregando série histórica...</VisualVazio> : !serieMensal.pontos.length ? <VisualVazio>Nenhuma execução encontrada no período selecionado.</VisualVazio> : (
                  <svg viewBox="0 0 680 225" className="h-full w-full" role="img" aria-label="Evolução mensal das OS realizadas">
                    <defs><linearGradient id="areaExecucoes" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" /></linearGradient></defs>
                    {[0, 0.25, 0.5, 0.75, 1].map((percentualLinha) => { const y = 178 - percentualLinha * 160; return <g key={percentualLinha}><line x1="42" x2="662" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 4" /><text x="34" y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">{Math.round(serieMensal.maior * percentualLinha)}</text></g>; })}
                    <polygon points={serieMensal.area} fill="url(#areaExecucoes)" />
                    <polyline points={serieMensal.linha} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                    {serieMensal.pontos.map((ponto) => <g key={ponto.mes}><circle cx={ponto.x} cy={ponto.y} r="5" fill="#2563eb" stroke="white" strokeWidth="2"><title>{formatarMes(ponto.mes)}: {ponto.quantidade} OS realizadas</title></circle><text x={ponto.x} y={ponto.y - 11} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e3a8a">{ponto.quantidade}</text><text x={ponto.x} y="201" textAnchor="middle" fontSize="9" fill="#64748b">{formatarMes(ponto.mes)}</text></g>)}
                  </svg>
                )}
              </div>
            </Visual>

            <Visual title="Composição das OS" subtitle="Distribuição do período selecionado">
              <div className="grid min-h-[292px] place-items-center p-5">
                <div className="flex w-full flex-col items-center gap-5 sm:flex-row sm:justify-center xl:flex-col 2xl:flex-row">
                  <div className="relative h-40 w-40 shrink-0 rounded-full" style={composicao.estilo}><div className="absolute inset-[24px] grid place-items-center rounded-full bg-white text-center shadow-inner"><div><strong className="block text-2xl text-slate-950">{percentual(indicadores.taxa_conclusao)}</strong><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">conclusão</span></div></div></div>
                  <div className="w-full max-w-56 space-y-3">
                    <LegendaComposicao cor="#2563eb" label="Realizadas" valor={indicadores.os_realizadas} />
                    <LegendaComposicao cor="#f59e0b" label="Abertas no prazo" valor={composicao.abertasNoPrazo} />
                    <LegendaComposicao cor="#ef4444" label="Vencidas" valor={indicadores.os_vencidas} />
                    <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">Base analisada: <strong className="text-slate-800">{formatarNumero(indicadores.os_total)} OS</strong></div>
                  </div>
                </div>
              </div>
            </Visual>
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <Visual title="Ranking de execuções por plano" subtitle="Clique em uma barra para abrir o histórico do plano">
              <div className="space-y-3 p-5">
                {!ranking.length ? <VisualVazio>Nenhum plano encontrado para o recorte.</VisualVazio> : ranking.map((plano) => {
                  const maximo = Math.max(1, ranking[0]?.os_realizadas ?? 1);
                  const largura = Math.max(2, (plano.os_realizadas / maximo) * 100);
                  const ativo = plano.id_plano_manutencao === planoSelecionado;
                  return <button type="button" key={plano.id_plano_manutencao} onClick={() => selecionarPlano(plano.id_plano_manutencao)} className="grid w-full grid-cols-[minmax(150px,240px)_minmax(150px,1fr)_54px] items-center gap-3 text-left">
                    <span className={`truncate text-xs ${ativo ? "font-bold text-blue-800" : "font-medium text-slate-700"}`} title={plano.plano}>#{plano.id_plano_manutencao} · {plano.plano}</span>
                    <span className="relative h-5 overflow-hidden rounded-sm bg-slate-100"><span className={`absolute inset-y-0 left-0 rounded-sm transition-all ${ativo ? "bg-blue-700" : "bg-blue-400 hover:bg-blue-500"}`} style={{ width: `${largura}%` }} /></span>
                    <strong className="text-right text-xs tabular-nums text-slate-800">{plano.os_realizadas}</strong>
                  </button>;
                })}
              </div>
            </Visual>

            <Visual title="Plano selecionado" subtitle={selecionado?.tipo_ativo || "Sem seleção"}>
              {!selecionado ? <VisualVazio>Selecione um plano no filtro ou no ranking.</VisualVazio> : (
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3"><div className="min-w-0"><Badge className="bg-blue-700">Plano #{selecionado.id_plano_manutencao}</Badge><h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-950">{selecionado.plano}</h3><p className="mt-1 text-xs text-slate-500">{selecionado.instalacoes.join(" · ") || "Sem instalação registrada"}</p></div><Button asChild variant="outline" size="sm"><Link to={`/planos-manutencao/${selecionado.id_plano_manutencao}/editar`} aria-label="Abrir cadastro do plano"><ExternalLink size={14} /></Link></Button></div>
                  <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-slate-200 bg-slate-200"><MiniIndicador label="Itens do plano" value={String(selecionado.total_itens)} /><MiniIndicador label="Cumprimento" value={percentual(selecionado.taxa_conclusao)} /><MiniIndicador label="Última OS realizada" value={formatarData(selecionado.ultima_execucao)} /><MiniIndicador label="Próxima OS prevista" value={formatarData(selecionado.proxima_execucao)} /></div>
                  {!filtros.instalacao && selecionado.instalacoes.length > 1 && <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">As datas consideram todas as instalações: a última OS e a próxima OS podem pertencer a ativos diferentes. Selecione uma instalação para comparar o mesmo recorte.</p>}
                  <div className="mt-4"><div className="mb-1 flex justify-between text-xs"><span className="text-slate-500">Progresso das OS</span><strong className="text-slate-800">{selecionado.os_realizadas} de {selecionado.total_os}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, selecionado.taxa_conclusao)}%` }} /></div></div>
                </div>
              )}
            </Visual>
          </div>

          <Visual title="Detalhamento das OS realizadas" subtitle={historico ? `${formatarNumero(historico.total)} registros · ordenação pela execução mais recente` : "Selecione um plano"} action={<Button type="button" variant="ghost" size="sm" onClick={() => planoSelecionado && carregarHistorico(planoSelecionado, pagina, filtros)} disabled={loadingHistorico || !planoSelecionado || !periodoValido}><RefreshCw className={loadingHistorico ? "animate-spin" : ""} size={15} /> Atualizar</Button>}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50"><TableRow><TableHead>Ordem de serviço</TableHead><TableHead>Execução real</TableHead><TableHead>Instalação / ativo</TableHead><TableHead>Item / responsável</TableHead><TableHead className="text-right">Duração</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {!loadingHistorico && !historico?.items.length && <TableRow><TableCell colSpan={6} className="h-28 text-center text-slate-500">Nenhuma OS realizada para este plano no período.</TableCell></TableRow>}
                  {historico?.items.map((ordem) => <TableRow key={ordem.id_os} className="hover:bg-blue-50/40">
                    <TableCell><Link to={`/os/${ordem.id_os}`} className="font-semibold text-blue-700 hover:underline">{ordem.numero_os}</Link>{ordem.atraso_dias > 0 && <p className="mt-1 text-[11px] font-medium text-red-600">{ordem.atraso_dias} dia{ordem.atraso_dias === 1 ? "" : "s"} após o previsto</p>}</TableCell>
                    <TableCell className="whitespace-nowrap"><strong className="block text-sm text-slate-800">{formatarData(ordem.data_execucao)}</strong><span className="text-xs text-slate-500">Início {formatarData(ordem.data_inicio_execucao, true)}</span></TableCell>
                    <TableCell><span className="block font-medium text-slate-800">{ordem.instalacao || "-"}</span><span className="text-xs text-slate-500">{ordem.codigo_ativo || ordem.tipo_ativo || "Ativo não informado"}</span></TableCell>
                    <TableCell className="max-w-[280px]"><span className="block truncate text-sm" title={ordem.item_plano || undefined}>{ordem.item_plano || "Item não vinculado"}</span><span className="block truncate text-xs text-slate-500" title={ordem.responsavel || undefined}>{ordem.responsavel || "Responsável não informado"}</span></TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">{ordem.duracao_horas == null ? "-" : `${ordem.duracao_horas.toLocaleString("pt-BR")} h`}</TableCell>
                    <TableCell><Badge variant="outline" className={statusClass(ordem.status)}>{ordem.status || "Realizada"}</Badge></TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            </div>
            {historico && historico.total_pages > 1 && <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500"><span>Página {historico.page} de {historico.total_pages}</span><div className="flex gap-1"><Button variant="outline" size="sm" disabled={pagina <= 1 || loadingHistorico} onClick={() => setPagina((atual) => atual - 1)}><ChevronLeft size={14} /> Anterior</Button><Button variant="outline" size="sm" disabled={pagina >= historico.total_pages || loadingHistorico} onClick={() => setPagina((atual) => atual + 1)}>Próxima <ChevronRight size={14} /></Button></div></div>}
          </Visual>
        </main>
      </div>
    </Container>
  );
}

function Slicer({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">{label}{children}</label>;
}

function Visual({ title, subtitle, action, children }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  return <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><header className="flex min-h-[68px] items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"><div className="min-w-0"><h2 className="truncate text-sm font-bold text-slate-900">{title}</h2><p className="mt-0.5 truncate text-xs text-slate-500" title={subtitle}>{subtitle}</p></div>{action}</header>{children}</section>;
}

function VisualVazio({ children }: { children: ReactNode }) {
  return <div className="grid min-h-40 place-items-center p-6 text-center text-sm text-slate-500">{children}</div>;
}

function LegendaComposicao({ cor, label, valor }: { cor: string; label: string; valor: number }) {
  return <div className="flex items-center justify-between gap-4 text-xs"><span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cor }} /> {label}</span><strong className="tabular-nums text-slate-900">{formatarNumero(valor)}</strong></div>;
}

function MiniIndicador({ label, value }: { label: string; value: string }) {
  return <div className="bg-white p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-slate-900">{value}</p></div>;
}
