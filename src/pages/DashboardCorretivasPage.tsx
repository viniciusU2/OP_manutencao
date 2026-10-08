import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CircleGauge,
  Clock3,
  ClipboardCheck,
  ExternalLink,
  Filter,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Siren,
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

type Indicadores = {
  total: number;
  encerradas: number;
  abertas: number;
  vencidas: number;
  taxa_encerramento: number;
  tempo_medio_atendimento_horas: number | null;
  idade_media_backlog_dias: number | null;
};

type Quantidade = { label: string; quantidade: number };
type SerieMensal = { mes: string; abertas: number; encerradas: number };
type InstalacaoResumo = {
  instalacao: string;
  total: number;
  encerradas: number;
  abertas: number;
  vencidas: number;
};
type FaixaBacklog = { faixa: string; quantidade: number };
type Causa = { causa: string; quantidade: number };

type OrdemBacklog = {
  id_os: number;
  numero_os: string;
  instalacao?: string | null;
  codigo_ativo?: string | null;
  tipo_ativo?: string | null;
  prioridade?: string | null;
  status?: string | null;
  defeito?: string | null;
  causa_primaria?: string | null;
  data_abertura?: string | null;
  data_limite?: string | null;
  idade_dias: number;
  atraso_dias: number;
  responsavel?: string | null;
};

type DashboardCorretivas = {
  indicadores: Indicadores;
  serie_mensal: SerieMensal[];
  distribuicao_status: Quantidade[];
  distribuicao_prioridade: Quantidade[];
  ranking_instalacoes: InstalacaoResumo[];
  faixas_backlog: FaixaBacklog[];
  principais_causas: Causa[];
  backlog: OrdemBacklog[];
  opcoes: { instalacoes: string[]; prioridades: string[]; status: string[] };
  atualizado_em: string;
};

type Filtros = {
  data_inicio: string;
  data_fim: string;
  instalacao: string;
  prioridade: string;
  status: string;
};

function dataLocal(date: Date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function filtrosIniciais(): Filtros {
  const hoje = new Date();
  return {
    data_inicio: `${hoje.getFullYear()}-01-01`,
    data_fim: dataLocal(hoje),
    instalacao: "",
    prioridade: "",
    status: "",
  };
}

const INDICADORES_VAZIOS: Indicadores = {
  total: 0,
  encerradas: 0,
  abertas: 0,
  vencidas: 0,
  taxa_encerramento: 0,
  tempo_medio_atendimento_horas: null,
  idade_media_backlog_dias: null,
};

const DASHBOARD_VAZIO: DashboardCorretivas = {
  indicadores: INDICADORES_VAZIOS,
  serie_mensal: [],
  distribuicao_status: [],
  distribuicao_prioridade: [],
  ranking_instalacoes: [],
  faixas_backlog: [],
  principais_causas: [],
  backlog: [],
  opcoes: { instalacoes: [], prioridades: [], status: [] },
  atualizado_em: "",
};

function parametros(filtros: Filtros) {
  return Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor.trim()));
}

function numero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

function percentual(valor: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(valor)}%`;
}

function formatarData(valor?: string | null, comHora = false) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    ...(comHora ? { timeStyle: "short" as const } : {}),
  }).format(data);
}

function formatarMes(valor: string) {
  const [ano, mes] = valor.split("-").map(Number);
  if (!ano || !mes) return valor;
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(
    new Date(ano, mes - 1, 1)
  );
}

function formatarTempo(horas: number | null) {
  if (horas == null) return "—";
  if (horas < 24) return `${horas.toLocaleString("pt-BR")} h`;
  return `${(horas / 24).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`;
}

function rotuloPrioridade(valor?: string | null) {
  return valor?.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letra) => letra.toUpperCase()) || "Não informada";
}

function classeStatus(valor?: string | null) {
  const status = valor?.toUpperCase() ?? "";
  if (status.includes("EXECUCAO") || status.includes("EXECUÇÃO")) return "border-blue-200 bg-blue-50 text-blue-700";
  if (status.includes("PROGRAM")) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-red-200 bg-red-50 text-red-700";
}

const CORES_STATUS: Record<string, string> = {
  Encerrada: "#10b981",
  Aberta: "#f97316",
  "Em execução": "#2563eb",
  Programada: "#f59e0b",
  Cancelada: "#94a3b8",
};

export default function DashboardCorretivasPage() {
  const [dados, setDados] = useState<DashboardCorretivas>(DASHBOARD_VAZIO);
  const [filtros, setFiltros] = useState<Filtros>(() => filtrosIniciais());
  const [loading, setLoading] = useState(true);

  const periodoValido = !(
    filtros.data_inicio && filtros.data_fim && filtros.data_inicio > filtros.data_fim
  );

  const carregar = useCallback(async (filtrosAtuais: Filtros) => {
    setLoading(true);
    try {
      const { data } = await api.get<DashboardCorretivas>("/os/dashboard-corretivas", {
        params: parametros(filtrosAtuais),
      });
      setDados(data);
    } catch {
      toast.error("Erro ao carregar o dashboard de manutenção corretiva");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (periodoValido) void carregar(filtros);
  }, [carregar, filtros, periodoValido]);

  function atualizarFiltro(campo: keyof Filtros, valor: string) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  }

  function limparFiltros() {
    setFiltros(filtrosIniciais());
  }

  const serie = useMemo(() => dados.serie_mensal.slice(-12), [dados.serie_mensal]);
  const maiorSerie = Math.max(1, ...serie.flatMap((item) => [item.abertas, item.encerradas]));
  const maiorInstalacao = Math.max(1, ...dados.ranking_instalacoes.map((item) => item.total));
  const maiorFaixa = Math.max(1, ...dados.faixas_backlog.map((item) => item.quantidade));
  const maiorCausa = Math.max(1, ...dados.principais_causas.map((item) => item.quantidade));
  const maiorPrioridade = Math.max(1, ...dados.distribuicao_prioridade.map((item) => item.quantidade));

  const donutStatus = useMemo(() => {
    const total = Math.max(1, dados.distribuicao_status.reduce((soma, item) => soma + item.quantidade, 0));
    let inicio = 0;
    const segmentos = dados.distribuicao_status.map((item) => {
      const fim = inicio + (item.quantidade / total) * 100;
      const segmento = `${CORES_STATUS[item.label] ?? "#64748b"} ${inicio}% ${fim}%`;
      inicio = fim;
      return segmento;
    });
    return { background: segmentos.length ? `conic-gradient(${segmentos.join(", ")})` : "#e2e8f0" };
  }, [dados.distribuicao_status]);

  const kpis = [
    { label: "OS corretivas", valor: numero(dados.indicadores.total), detalhe: "registradas no período", icon: Wrench, cor: "#ea580c", classe: "bg-orange-50 text-orange-700" },
    { label: "Backlog aberto", valor: numero(dados.indicadores.abertas), detalhe: dados.indicadores.idade_media_backlog_dias == null ? "sem pendências" : `idade média ${dados.indicadores.idade_media_backlog_dias.toLocaleString("pt-BR")} dias`, icon: Siren, cor: "#dc2626", classe: "bg-red-50 text-red-700" },
    { label: "OS vencidas", valor: numero(dados.indicadores.vencidas), detalhe: "prazo programado excedido", icon: ShieldAlert, cor: "#b91c1c", classe: "bg-rose-50 text-rose-700" },
    { label: "Encerradas", valor: numero(dados.indicadores.encerradas), detalhe: "corretivas concluídas", icon: CheckCircle2, cor: "#059669", classe: "bg-emerald-50 text-emerald-700" },
    { label: "Taxa de encerramento", valor: percentual(dados.indicadores.taxa_encerramento), detalhe: "sobre o recorte selecionado", icon: CircleGauge, cor: "#2563eb", classe: "bg-blue-50 text-blue-700" },
    { label: "Tempo médio", valor: formatarTempo(dados.indicadores.tempo_medio_atendimento_horas), detalhe: "da abertura até a baixa", icon: Clock3, cor: "#7c3aed", classe: "bg-violet-50 text-violet-700" },
  ];

  return (
    <Container>
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-[#f3f5f8] shadow-sm">
        <header className="relative overflow-hidden bg-[#1b2033] px-5 py-5 text-white md:px-7">
          <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-orange-600/35 to-transparent" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-200"><ShieldAlert size={15} /> Controle de falhas e pendências</div>
              <h1 className="m-0 text-2xl font-semibold tracking-tight md:text-3xl">Manutenção corretiva</h1>
              <p className="mt-1 text-sm text-slate-300">Backlog, prazo, atendimento e concentração das OS corretivas.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-2 text-right text-xs text-slate-300"><span className="block uppercase tracking-wide">Atualização</span><strong className="text-white">{dados.atualizado_em ? formatarData(dados.atualizado_em, true) : "Carregando..."}</strong></div>
              <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Link to="/planos-manutencao/dashboard"><ArrowLeft size={16} /> Dash. Planos</Link></Button>
              <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Link to="/inspecoes/dashboard"><ClipboardCheck size={16} /> Inspeções</Link></Button>
              <Button asChild className="bg-orange-500 text-white hover:bg-orange-600"><Link to="/controle"><Wrench size={16} /> Consultar OS</Link></Button>
            </div>
          </div>
        </header>

        <section className="border-b border-slate-300 bg-white px-5 py-4 md:px-7" aria-label="Filtros do dashboard corretivo">
          <div className="mb-3 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700"><Filter size={16} className="text-orange-600" /> Filtros de abertura</h2>{loading && <span className="flex items-center gap-1.5 text-xs font-medium text-orange-700"><RefreshCw size={14} className="animate-spin" /> Atualizando</span>}</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[220px_170px_170px_180px_180px_auto] xl:items-end">
            <Slicer label="Instalação"><select value={filtros.instalacao} onChange={(event) => atualizarFiltro("instalacao", event.target.value)} className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm"><option value="">Todas as instalações</option>{dados.opcoes.instalacoes.map((item) => <option key={item}>{item}</option>)}</select></Slicer>
            <Slicer label="Abertura inicial"><Input type="date" value={filtros.data_inicio} onChange={(event) => atualizarFiltro("data_inicio", event.target.value)} className={periodoValido ? "border-slate-300" : "border-red-400"} /></Slicer>
            <Slicer label="Abertura final"><Input type="date" value={filtros.data_fim} onChange={(event) => atualizarFiltro("data_fim", event.target.value)} className={periodoValido ? "border-slate-300" : "border-red-400"} /></Slicer>
            <Slicer label="Prioridade"><select value={filtros.prioridade} onChange={(event) => atualizarFiltro("prioridade", event.target.value)} className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm"><option value="">Todas</option>{dados.opcoes.prioridades.map((item) => <option key={item} value={item}>{rotuloPrioridade(item)}</option>)}</select></Slicer>
            <Slicer label="Situação"><select value={filtros.status} onChange={(event) => atualizarFiltro("status", event.target.value)} className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm"><option value="">Todas</option><option value="ABERTAS">Somente abertas</option><option value="VENCIDAS">Somente vencidas</option><option value="ENCERRADAS">Somente encerradas</option></select></Slicer>
            <Button type="button" variant="outline" onClick={limparFiltros} disabled={loading} title="Restaurar filtros"><RotateCcw size={16} /></Button>
          </div>
          {!periodoValido && <p className="mt-2 text-xs font-medium text-red-600">A data inicial não pode ser posterior à data final.</p>}
        </section>

        <main className="space-y-4 p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {kpis.map((kpi) => { const Icon = kpi.icon; return <section key={kpi.label} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm"><span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: kpi.cor }} /><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{loading ? "—" : kpi.valor}</p><p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{kpi.detalhe}</p></div><span className={`rounded-lg p-2 ${kpi.classe}`}><Icon size={18} /></span></div></section>; })}
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
            <Visual title="Fluxo mensal de corretivas" subtitle="OS abertas versus OS encerradas no recorte">
              <div className="overflow-x-auto p-5">
                {!serie.length ? <Vazio>Nenhuma OS corretiva encontrada.</Vazio> : <div className="min-w-[620px]"><div className="mb-4 flex items-center justify-end gap-4 text-xs"><Legenda cor="#f97316" label="Abertas" /><Legenda cor="#10b981" label="Encerradas" /></div><div className="grid h-60 items-end gap-2 border-b border-slate-300" style={{ gridTemplateColumns: `repeat(${serie.length}, minmax(38px, 1fr))` }}>{serie.map((item) => <div key={item.mes} className="flex h-full flex-col justify-end"><div className="flex flex-1 items-end justify-center gap-1"><Barra valor={item.abertas} maximo={maiorSerie} cor="#f97316" /><Barra valor={item.encerradas} maximo={maiorSerie} cor="#10b981" /></div><p className="mt-2 h-8 text-center text-[10px] text-slate-500">{formatarMes(item.mes)}</p></div>)}</div></div>}
              </div>
            </Visual>

            <Visual title="Situação das OS" subtitle="Composição do recorte selecionado">
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-5 p-5 sm:flex-row xl:flex-col 2xl:flex-row">
                <div className="relative h-40 w-40 shrink-0 rounded-full" style={donutStatus}><div className="absolute inset-[24px] grid place-items-center rounded-full bg-white text-center shadow-inner"><div><strong className="block text-2xl text-slate-950">{numero(dados.indicadores.total)}</strong><span className="text-[10px] font-semibold uppercase text-slate-500">corretivas</span></div></div></div>
                <div className="w-full max-w-56 space-y-3">{dados.distribuicao_status.map((item) => <div key={item.label} className="flex items-center justify-between gap-4 text-xs"><span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CORES_STATUS[item.label] ?? "#64748b" }} />{item.label}</span><strong className="tabular-nums">{item.quantidade}</strong></div>)}</div>
              </div>
            </Visual>
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <Visual title="Envelhecimento do backlog" subtitle="Há quanto tempo as OS pendentes estão abertas">
              <div className="space-y-4 p-5">{dados.faixas_backlog.map((item, indice) => <BarraHorizontal key={item.faixa} label={item.faixa} valor={item.quantidade} maximo={maiorFaixa} cor={["#fbbf24", "#f97316", "#ef4444", "#991b1b"][indice]} />)}</div>
            </Visual>
            <Visual title="Concentração por instalação" subtitle="Volume concluído e backlog corretivo">
              <div className="space-y-4 p-5">{!dados.ranking_instalacoes.length ? <Vazio>Sem dados por instalação.</Vazio> : dados.ranking_instalacoes.map((item) => <div key={item.instalacao}><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium text-slate-700">{item.instalacao}</span><strong>{item.total}</strong></div><div className="flex h-4 overflow-hidden rounded-sm bg-slate-100" style={{ width: `${Math.max(8, (item.total / maiorInstalacao) * 100)}%` }}><span className="h-full bg-emerald-500" style={{ width: `${item.total ? (item.encerradas / item.total) * 100 : 0}%` }} /><span className="h-full bg-orange-500" style={{ width: `${item.total ? (item.abertas / item.total) * 100 : 0}%` }} /></div><div className="mt-1 flex gap-3 text-[10px] text-slate-500"><span>{item.encerradas} encerradas</span><span>{item.abertas} abertas</span>{item.vencidas > 0 && <span className="font-semibold text-red-600">{item.vencidas} vencidas</span>}</div></div>)}</div>
            </Visual>
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
            <Visual title="Distribuição por prioridade" subtitle="Perfil de criticidade informado nas OS">
              <div className="space-y-3 p-5">{dados.distribuicao_prioridade.map((item) => <BarraHorizontal key={item.label} label={item.label} valor={item.quantidade} maximo={maiorPrioridade} cor="#7c3aed" />)}</div>
            </Visual>
            <Visual title="Principais causas registradas" subtitle="Causas primárias com maior recorrência">
              <div className="space-y-3 p-5">{!dados.principais_causas.length ? <Vazio>As OS do recorte ainda não possuem causas registradas.</Vazio> : dados.principais_causas.map((item) => <BarraHorizontal key={item.causa} label={item.causa} valor={item.quantidade} maximo={maiorCausa} cor="#2563eb" />)}</div>
            </Visual>
          </div>

          <Visual title="Backlog corretivo para ação" subtitle={`${dados.backlog.length} OS pendentes, com vencidas e mais antigas primeiro`} action={<Button type="button" variant="ghost" size="sm" onClick={() => carregar(filtros)} disabled={loading || !periodoValido}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Atualizar</Button>}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50"><TableRow><TableHead>Ordem de serviço</TableHead><TableHead>Instalação / ativo</TableHead><TableHead>Defeito</TableHead><TableHead>Abertura / prazo</TableHead><TableHead>Responsável</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
                <TableBody>
                  {!dados.backlog.length && <TableRow><TableCell colSpan={6} className="h-28 text-center text-slate-500">Nenhuma OS corretiva pendente neste recorte.</TableCell></TableRow>}
                  {dados.backlog.map((ordem) => <TableRow key={ordem.id_os} className={ordem.atraso_dias > 0 ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-orange-50/40"}><TableCell><div className="flex items-center gap-2"><Link to={`/os/${ordem.id_os}`} className="font-semibold text-blue-700 hover:underline">{ordem.numero_os}</Link><ExternalLink size={12} className="text-slate-400" /></div><p className="mt-1 text-[11px] text-slate-500">{rotuloPrioridade(ordem.prioridade)}</p></TableCell><TableCell><span className="block font-medium text-slate-800">{ordem.instalacao || "—"}</span><span className="text-xs text-slate-500">{ordem.codigo_ativo || ordem.tipo_ativo || "Ativo não informado"}</span></TableCell><TableCell className="max-w-[320px]"><p className="line-clamp-2 text-sm" title={ordem.defeito || undefined}>{ordem.defeito || "Defeito não informado"}</p>{ordem.causa_primaria && <p className="mt-1 truncate text-xs text-slate-500" title={ordem.causa_primaria}>Causa: {ordem.causa_primaria}</p>}</TableCell><TableCell className="whitespace-nowrap"><strong className="block text-sm">{formatarData(ordem.data_abertura)}</strong><span className={ordem.atraso_dias > 0 ? "text-xs font-semibold text-red-600" : "text-xs text-slate-500"}>{ordem.atraso_dias > 0 ? `${ordem.atraso_dias} dias vencida` : ordem.data_limite ? `Prazo ${formatarData(ordem.data_limite)}` : `${ordem.idade_dias} dias em aberto`}</span></TableCell><TableCell className="max-w-[180px]"><span className="block truncate text-sm" title={ordem.responsavel || undefined}>{ordem.responsavel || "Não informado"}</span></TableCell><TableCell><Badge variant="outline" className={classeStatus(ordem.status)}>{ordem.status?.replaceAll("_", " ") || "ABERTA"}</Badge></TableCell></TableRow>)}
                </TableBody>
              </Table>
            </div>
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

function Vazio({ children }: { children: ReactNode }) {
  return <div className="grid min-h-32 place-items-center p-5 text-center text-sm text-slate-500">{children}</div>;
}

function Legenda({ cor, label }: { cor: string; label: string }) {
  return <span className="flex items-center gap-1.5 text-slate-600"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cor }} />{label}</span>;
}

function Barra({ valor, maximo, cor }: { valor: number; maximo: number; cor: string }) {
  return <span className="relative block w-4 rounded-t-sm" style={{ height: `${Math.max(valor ? 5 : 0, (valor / maximo) * 100)}%`, backgroundColor: cor }} title={String(valor)}><span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-slate-600">{valor}</span></span>;
}

function BarraHorizontal({ label, valor, maximo, cor }: { label: string; valor: number; maximo: number; cor: string }) {
  return <div><div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium text-slate-700" title={label}>{label}</span><strong className="tabular-nums">{valor}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.max(valor ? 2 : 0, (valor / maximo) * 100)}%`, backgroundColor: cor }} /></div></div>;
}
