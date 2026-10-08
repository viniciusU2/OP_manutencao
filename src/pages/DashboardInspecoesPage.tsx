import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Filter,
  ListChecks,
  RefreshCw,
  RotateCcw,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
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
  ok: number;
  nok: number;
  na: number;
  taxa_conformidade: number;
  ativos_inspecionados: number;
  itens_avaliados: number;
  itens_nok: number;
  taxa_vinculo_os: number;
};

type SerieMensal = { mes: string; OK: number; NOK: number; NA: number };
type StatusResumo = { status: string; quantidade: number };
type PeriodicidadeResumo = { periodicidade: string; quantidade: number };
type GrupoResumo = { total: number; OK: number; NOK: number; NA: number };
type InstalacaoResumo = GrupoResumo & { instalacao: string };
type TipoAtivoResumo = GrupoResumo & { tipo_ativo: string };
type ItemNok = { item: string; quantidade: number };
type ResponsavelResumo = { responsavel: string; quantidade: number };
type TipoOpcao = { id: number; nome: string };

type InspecaoAtencao = {
  id_inspecao: number;
  id_os?: number | null;
  numero_os?: string | null;
  data_inspecao?: string | null;
  instalacao?: string | null;
  codigo_ativo?: string | null;
  tipo_ativo?: string | null;
  periodicidade: string;
  status: string;
  responsavel?: string | null;
  observacao?: string | null;
  itens_nok: string[];
  quantidade_itens_nok: number;
};

type DashboardInspecoes = {
  indicadores: Indicadores;
  serie_mensal: SerieMensal[];
  distribuicao_status: StatusResumo[];
  distribuicao_periodicidade: PeriodicidadeResumo[];
  ranking_instalacoes: InstalacaoResumo[];
  ranking_tipos_ativo: TipoAtivoResumo[];
  principais_itens_nok: ItemNok[];
  ranking_responsaveis: ResponsavelResumo[];
  inspecoes_atencao: InspecaoAtencao[];
  opcoes: {
    instalacoes: string[];
    periodicidades: string[];
    status: string[];
    tipos_ativo: TipoOpcao[];
  };
  atualizado_em: string;
};

type Filtros = {
  data_inicio: string;
  data_fim: string;
  instalacao: string;
  periodicidade: string;
  status: string;
  id_tipo_ativo: string;
};

function dataLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function filtrosIniciais(): Filtros {
  const hoje = new Date();
  return {
    data_inicio: `${hoje.getFullYear()}-01-01`,
    data_fim: dataLocal(hoje),
    instalacao: "",
    periodicidade: "",
    status: "",
    id_tipo_ativo: "",
  };
}

const DASHBOARD_VAZIO: DashboardInspecoes = {
  indicadores: {
    total: 0,
    ok: 0,
    nok: 0,
    na: 0,
    taxa_conformidade: 0,
    ativos_inspecionados: 0,
    itens_avaliados: 0,
    itens_nok: 0,
    taxa_vinculo_os: 0,
  },
  serie_mensal: [],
  distribuicao_status: [],
  distribuicao_periodicidade: [],
  ranking_instalacoes: [],
  ranking_tipos_ativo: [],
  principais_itens_nok: [],
  ranking_responsaveis: [],
  inspecoes_atencao: [],
  opcoes: { instalacoes: [], periodicidades: [], status: [], tipos_ativo: [] },
  atualizado_em: "",
};

const CORES_STATUS: Record<string, string> = { OK: "#10b981", NOK: "#ef4444", NA: "#94a3b8" };

function parametros(filtros: Filtros) {
  return Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor.trim()));
}

function numero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

function percentual(valor: number) {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
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

function rotuloPeriodicidade(valor: string) {
  const rotulos: Record<string, string> = {
    SEMANAL: "Semanal",
    MENSAL: "Mensal",
    BIMESTRAL: "Bimestral",
    TRIMESTRAL: "Trimestral",
    SEMESTRAL: "Semestral",
    ANUAL: "Anual",
    "3_ANOS": "A cada 3 anos",
    "5_ANOS": "A cada 5 anos",
    "6_ANOS": "A cada 6 anos",
  };
  return rotulos[valor] ?? valor.replaceAll("_", " ");
}

export default function DashboardInspecoesPage() {
  const [dados, setDados] = useState<DashboardInspecoes>(DASHBOARD_VAZIO);
  const [filtros, setFiltros] = useState<Filtros>(() => filtrosIniciais());
  const [loading, setLoading] = useState(true);

  const periodoValido = !(
    filtros.data_inicio && filtros.data_fim && filtros.data_inicio > filtros.data_fim
  );

  const carregar = useCallback(async (filtrosAtuais: Filtros) => {
    setLoading(true);
    try {
      const { data } = await api.get<DashboardInspecoes>("/inspecoes/dashboard", {
        params: parametros(filtrosAtuais),
      });
      setDados(data);
    } catch {
      toast.error("Erro ao carregar o dashboard de inspeções");
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

  const serie = useMemo(() => dados.serie_mensal.slice(-12), [dados.serie_mensal]);
  const maiorSerie = Math.max(1, ...serie.flatMap((item) => [item.OK, item.NOK, item.NA]));
  const maiorPeriodicidade = Math.max(1, ...dados.distribuicao_periodicidade.map((item) => item.quantidade));
  const maiorInstalacao = Math.max(1, ...dados.ranking_instalacoes.map((item) => item.total));
  const maiorItemNok = Math.max(1, ...dados.principais_itens_nok.map((item) => item.quantidade));
  const maiorResponsavel = Math.max(1, ...dados.ranking_responsaveis.map((item) => item.quantidade));
  const maiorTipo = Math.max(1, ...dados.ranking_tipos_ativo.map((item) => item.total));

  const donut = useMemo(() => {
    const total = Math.max(1, dados.distribuicao_status.reduce((soma, item) => soma + item.quantidade, 0));
    let inicio = 0;
    const partes = dados.distribuicao_status.map((item) => {
      const fim = inicio + (item.quantidade / total) * 100;
      const parte = `${CORES_STATUS[item.status] ?? "#64748b"} ${inicio}% ${fim}%`;
      inicio = fim;
      return parte;
    });
    return { background: partes.length ? `conic-gradient(${partes.join(", ")})` : "#e2e8f0" };
  }, [dados.distribuicao_status]);

  const kpis = [
    { label: "Inspeções realizadas", valor: numero(dados.indicadores.total), detalhe: `${dados.indicadores.ativos_inspecionados} ativos inspecionados`, icon: ClipboardCheck, cor: "#0f766e", classe: "bg-teal-50 text-teal-700" },
    { label: "Conformes", valor: numero(dados.indicadores.ok), detalhe: "resultado geral OK", icon: CheckCircle2, cor: "#059669", classe: "bg-emerald-50 text-emerald-700" },
    { label: "Não conformes", valor: numero(dados.indicadores.nok), detalhe: `${dados.indicadores.itens_nok} itens NOK`, icon: AlertTriangle, cor: "#dc2626", classe: "bg-red-50 text-red-700" },
    { label: "Não avaliadas", valor: numero(dados.indicadores.na), detalhe: "resultado geral NA", icon: SearchCheck, cor: "#64748b", classe: "bg-slate-100 text-slate-700" },
    { label: "Conformidade", valor: percentual(dados.indicadores.taxa_conformidade), detalhe: `${numero(dados.indicadores.itens_avaliados)} itens avaliados`, icon: ShieldCheck, cor: "#2563eb", classe: "bg-blue-50 text-blue-700" },
    { label: "Rastreabilidade", valor: percentual(dados.indicadores.taxa_vinculo_os), detalhe: "inspeções vinculadas a OS", icon: ListChecks, cor: "#7c3aed", classe: "bg-violet-50 text-violet-700" },
  ];

  return (
    <Container>
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-[#f3f5f8] shadow-sm">
        <header className="relative overflow-hidden bg-[#12302f] px-5 py-5 text-white md:px-7">
          <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-teal-500/30 to-transparent" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div><div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200"><ClipboardCheck size={15} /> Qualidade e conformidade</div><h1 className="m-0 text-2xl font-semibold tracking-tight md:text-3xl">Dashboard de inspeções</h1><p className="mt-1 text-sm text-slate-300">Resultados, não conformidades e rastreabilidade das inspeções técnicas.</p></div>
            <div className="flex flex-wrap items-center gap-2"><div className="mr-2 text-right text-xs text-slate-300"><span className="block uppercase tracking-wide">Atualização</span><strong className="text-white">{dados.atualizado_em ? formatarData(dados.atualizado_em, true) : "Carregando..."}</strong></div><Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Link to="/planos-manutencao/dashboard"><ArrowLeft size={16} /> Dash. Planos</Link></Button><Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Link to="/manutencao-corretiva/dashboard"><ShieldAlert size={16} /> Corretivas</Link></Button><Button asChild className="bg-teal-500 text-white hover:bg-teal-600"><Link to="/inspecoes"><ListChecks size={16} /> Lista</Link></Button></div>
          </div>
        </header>

        <section className="border-b border-slate-300 bg-white px-5 py-4 md:px-7" aria-label="Filtros das inspeções">
          <div className="mb-3 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700"><Filter size={16} className="text-teal-700" /> Filtros da inspeção</h2>{loading && <span className="flex items-center gap-1.5 text-xs font-medium text-teal-700"><RefreshCw size={14} className="animate-spin" /> Atualizando</span>}</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[190px_160px_160px_170px_150px_220px_auto] xl:items-end">
            <Slicer label="Instalação"><select value={filtros.instalacao} onChange={(event) => atualizarFiltro("instalacao", event.target.value)} className="h-10 rounded border border-slate-300 bg-white px-3 text-sm"><option value="">Todas</option>{dados.opcoes.instalacoes.map((item) => <option key={item}>{item}</option>)}</select></Slicer>
            <Slicer label="Data inicial"><Input type="date" value={filtros.data_inicio} onChange={(event) => atualizarFiltro("data_inicio", event.target.value)} className={periodoValido ? "border-slate-300" : "border-red-400"} /></Slicer>
            <Slicer label="Data final"><Input type="date" value={filtros.data_fim} onChange={(event) => atualizarFiltro("data_fim", event.target.value)} className={periodoValido ? "border-slate-300" : "border-red-400"} /></Slicer>
            <Slicer label="Periodicidade"><select value={filtros.periodicidade} onChange={(event) => atualizarFiltro("periodicidade", event.target.value)} className="h-10 rounded border border-slate-300 bg-white px-3 text-sm"><option value="">Todas</option>{dados.opcoes.periodicidades.map((item) => <option key={item} value={item}>{rotuloPeriodicidade(item)}</option>)}</select></Slicer>
            <Slicer label="Resultado"><select value={filtros.status} onChange={(event) => atualizarFiltro("status", event.target.value)} className="h-10 rounded border border-slate-300 bg-white px-3 text-sm"><option value="">Todos</option>{dados.opcoes.status.map((item) => <option key={item}>{item}</option>)}</select></Slicer>
            <Slicer label="Tipo de ativo"><select value={filtros.id_tipo_ativo} onChange={(event) => atualizarFiltro("id_tipo_ativo", event.target.value)} className="h-10 rounded border border-slate-300 bg-white px-3 text-sm"><option value="">Todos</option>{dados.opcoes.tipos_ativo.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></Slicer>
            <Button type="button" variant="outline" onClick={() => setFiltros(filtrosIniciais())} disabled={loading} title="Restaurar filtros"><RotateCcw size={16} /></Button>
          </div>
          {!periodoValido && <p className="mt-2 text-xs font-medium text-red-600">A data inicial não pode ser posterior à data final.</p>}
        </section>

        <main className="space-y-4 p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{kpis.map((kpi) => { const Icon = kpi.icon; return <section key={kpi.label} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm"><span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: kpi.cor }} /><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{loading ? "—" : kpi.valor}</p><p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{kpi.detalhe}</p></div><span className={`rounded-lg p-2 ${kpi.classe}`}><Icon size={18} /></span></div></section>; })}</div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
            <Visual title="Evolução das inspeções" subtitle="Resultados gerais por mês"><div className="overflow-x-auto p-5">{!serie.length ? <Vazio>Nenhuma inspeção encontrada.</Vazio> : <div className="min-w-[620px]"><div className="mb-4 flex justify-end gap-4 text-xs"><Legenda cor="#10b981" label="OK" /><Legenda cor="#ef4444" label="NOK" /><Legenda cor="#94a3b8" label="NA" /></div><div className="grid h-60 items-end gap-2 border-b border-slate-300" style={{ gridTemplateColumns: `repeat(${serie.length}, minmax(42px, 1fr))` }}>{serie.map((item) => <div key={item.mes} className="flex h-full flex-col justify-end"><div className="flex flex-1 items-end justify-center gap-1"><Barra valor={item.OK} maximo={maiorSerie} cor="#10b981" /><Barra valor={item.NOK} maximo={maiorSerie} cor="#ef4444" /><Barra valor={item.NA} maximo={maiorSerie} cor="#94a3b8" /></div><p className="mt-2 h-8 text-center text-[10px] text-slate-500">{formatarMes(item.mes)}</p></div>)}</div></div>}</div></Visual>
            <Visual title="Resultado geral" subtitle="Composição das inspeções do recorte"><div className="flex min-h-[320px] flex-col items-center justify-center gap-5 p-5 sm:flex-row xl:flex-col 2xl:flex-row"><div className="relative h-40 w-40 shrink-0 rounded-full" style={donut}><div className="absolute inset-[24px] grid place-items-center rounded-full bg-white text-center shadow-inner"><div><strong className="block text-2xl text-slate-950">{percentual(dados.indicadores.taxa_conformidade)}</strong><span className="text-[10px] font-semibold uppercase text-slate-500">conformidade</span></div></div></div><div className="w-full max-w-52 space-y-3">{dados.distribuicao_status.map((item) => <div key={item.status} className="flex justify-between text-xs"><span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CORES_STATUS[item.status] }} />{item.status}</span><strong>{item.quantidade}</strong></div>)}</div></div></Visual>
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <Visual title="Inspeções por periodicidade" subtitle="Frequência dos registros realizados"><div className="space-y-4 p-5">{dados.distribuicao_periodicidade.map((item) => <BarraHorizontal key={item.periodicidade} label={rotuloPeriodicidade(item.periodicidade)} valor={item.quantidade} maximo={maiorPeriodicidade} cor="#0f766e" />)}</div></Visual>
            <Visual title="Conformidade por instalação" subtitle="Comparativo entre resultados OK, NOK e NA"><div className="space-y-4 p-5">{dados.ranking_instalacoes.map((item) => <BarraComposta key={item.instalacao} label={item.instalacao} item={item} maximo={maiorInstalacao} />)}</div></Visual>
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
            <Visual title="Tipos de ativo inspecionados" subtitle="Volume e não conformidades por família"><div className="space-y-4 p-5">{dados.ranking_tipos_ativo.map((item) => <BarraComposta key={item.tipo_ativo} label={item.tipo_ativo} item={item} maximo={maiorTipo} />)}</div></Visual>
            <Visual title="Inspeções por responsável" subtitle="Profissionais com maior volume registrado"><div className="space-y-3 p-5">{dados.ranking_responsaveis.map((item) => <BarraHorizontal key={item.responsavel} label={item.responsavel} valor={item.quantidade} maximo={maiorResponsavel} cor="#2563eb" />)}</div></Visual>
          </div>

          <Visual title="Itens com não conformidade" subtitle="Pontos de inspeção que mais receberam resultado NOK"><div className="grid gap-3 p-5 md:grid-cols-2">{!dados.principais_itens_nok.length ? <Vazio>Nenhum item NOK encontrado no recorte.</Vazio> : dados.principais_itens_nok.map((item) => <BarraHorizontal key={item.item} label={item.item} valor={item.quantidade} maximo={maiorItemNok} cor="#dc2626" />)}</div></Visual>

          <Visual title="Inspeções que exigem atenção" subtitle={`${dados.inspecoes_atencao.length} registros NOK ou ainda não avaliados`} action={<Button type="button" variant="ghost" size="sm" onClick={() => carregar(filtros)} disabled={loading || !periodoValido}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Atualizar</Button>}>
            <div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Inspeção / OS</TableHead><TableHead>Data</TableHead><TableHead>Instalação / ativo</TableHead><TableHead>Periodicidade</TableHead><TableHead>Itens NOK</TableHead><TableHead>Responsável</TableHead><TableHead>Resultado</TableHead></TableRow></TableHeader><TableBody>{!dados.inspecoes_atencao.length && <TableRow><TableCell colSpan={7} className="h-28 text-center text-slate-500">Nenhuma inspeção requer atenção neste recorte.</TableCell></TableRow>}{dados.inspecoes_atencao.map((inspecao) => <TableRow key={inspecao.id_inspecao} className={inspecao.status === "NOK" ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-slate-50"}><TableCell><Link to={`/inspecoes/${inspecao.id_inspecao}`} className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline">Inspeção #{inspecao.id_inspecao}<ExternalLink size={12} /></Link><p className="mt-1 text-[11px] text-slate-500">{inspecao.numero_os || "Sem OS vinculada"}</p></TableCell><TableCell className="whitespace-nowrap">{formatarData(inspecao.data_inspecao, true)}</TableCell><TableCell><span className="block font-medium">{inspecao.instalacao || "—"}</span><span className="text-xs text-slate-500">{inspecao.codigo_ativo || inspecao.tipo_ativo || "Ativo não informado"}</span></TableCell><TableCell>{rotuloPeriodicidade(inspecao.periodicidade)}</TableCell><TableCell className="max-w-[280px]"><strong className={inspecao.quantidade_itens_nok ? "text-red-700" : "text-slate-500"}>{inspecao.quantidade_itens_nok}</strong>{inspecao.itens_nok.length > 0 && <p className="mt-1 line-clamp-2 text-xs text-slate-500" title={inspecao.itens_nok.join(" · ")}>{inspecao.itens_nok.join(" · ")}</p>}</TableCell><TableCell className="max-w-[180px]"><span className="block truncate" title={inspecao.responsavel || undefined}>{inspecao.responsavel || "Não informado"}</span></TableCell><TableCell><Badge variant="outline" className={inspecao.status === "NOK" ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-700"}>{inspecao.status}</Badge></TableCell></TableRow>)}</TableBody></Table></div>
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
  return <div className="col-span-full grid min-h-28 place-items-center p-5 text-center text-sm text-slate-500">{children}</div>;
}

function Legenda({ cor, label }: { cor: string; label: string }) {
  return <span className="flex items-center gap-1.5 text-slate-600"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cor }} />{label}</span>;
}

function Barra({ valor, maximo, cor }: { valor: number; maximo: number; cor: string }) {
  return <span className="relative block w-4 rounded-t-sm" style={{ height: `${Math.max(valor ? 5 : 0, (valor / maximo) * 100)}%`, backgroundColor: cor }} title={String(valor)}><span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-slate-600">{valor}</span></span>;
}

function BarraHorizontal({ label, valor, maximo, cor }: { label: string; valor: number; maximo: number; cor: string }) {
  return <div><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate font-medium text-slate-700" title={label}>{label}</span><strong>{valor}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.max(valor ? 2 : 0, (valor / maximo) * 100)}%`, backgroundColor: cor }} /></div></div>;
}

function BarraComposta({ label, item, maximo }: { label: string; item: GrupoResumo; maximo: number }) {
  return <div><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate font-medium text-slate-700" title={label}>{label}</span><strong>{item.total}</strong></div><div className="flex h-4 overflow-hidden rounded-sm bg-slate-100" style={{ width: `${Math.max(8, (item.total / maximo) * 100)}%` }}><span className="bg-emerald-500" style={{ width: `${item.total ? (item.OK / item.total) * 100 : 0}%` }} /><span className="bg-red-500" style={{ width: `${item.total ? (item.NOK / item.total) * 100 : 0}%` }} /><span className="bg-slate-400" style={{ width: `${item.total ? (item.NA / item.total) * 100 : 0}%` }} /></div><div className="mt-1 flex gap-3 text-[10px] text-slate-500"><span>{item.OK} OK</span>{item.NOK > 0 && <span className="font-semibold text-red-600">{item.NOK} NOK</span>}{item.NA > 0 && <span>{item.NA} NA</span>}</div></div>;
}
