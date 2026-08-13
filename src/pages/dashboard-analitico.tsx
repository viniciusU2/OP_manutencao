import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Database,
  Filter,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Wrench,
  X,
} from "lucide-react";

import api from "../api/api";
import "./dashboard-analitico.css";

type FilterOption = { id: number; nome?: string; descricao?: string };
type FiltersData = {
  subestacoes: FilterOption[];
  tipos_ativo: FilterOption[];
  planos: FilterOption[];
  periodicidades: string[];
};
type Summary = {
  total_os: number;
  encerradas: number;
  backlog: number;
  atrasadas: number;
  cumprimento_prazo_percentual: number | null;
  cobertura_prazo_percentual: number | null;
  classes: Record<string, number>;
};
type CountItem = { status?: string; faixa?: string; categoria?: string; quantidade: number };
type TimelineItem = { periodo: string; quantidade: number };
type InspectionSummary = {
  inspecoes: number;
  itens: number;
  status_itens: Record<string, number>;
  nok_percentual: number | null;
  cobertura_avaliada_percentual: number | null;
};
type PlanningSummary = {
  total_eventos: number;
  total_itens: number;
  serie: { data: string; eventos: number }[];
};
type Coverage = {
  eventos: number;
  duracao_percentual: number | null;
  hh_percentual: number | null;
  equipe_percentual: number | null;
  recursos_percentual: number | null;
};
type Quality = Record<string, number>;
type FilterState = { data_inicio: string; data_fim: string; id_subestacao: string; id_tipo_ativo: string };
type DetailItem = {
  id_os: number;
  numero_os: string;
  status: string;
  criado_em: string | null;
  data_fim_programado: string | null;
};

const COLORS = ["#0f766e", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#64748b"];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

function formatPercent(value?: number | null) {
  return value == null ? "Sem dados" : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").toLocaleLowerCase("pt-BR").replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function LineChart({ data }: { data: TimelineItem[] }) {
  const width = 820;
  const height = 250;
  const padding = { left: 44, right: 18, top: 22, bottom: 42 };
  const max = Math.max(1, ...data.map((item) => item.quantidade));
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const points = data.map((item, index) => ({
    ...item,
    x: padding.left + (data.length <= 1 ? usableWidth / 2 : (index / (data.length - 1)) * usableWidth),
    y: padding.top + usableHeight - (item.quantidade / max) * usableHeight,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length ? `M ${points[0].x} ${padding.top + usableHeight} L ${line.replaceAll(",", " ")} L ${points.at(-1)?.x} ${padding.top + usableHeight} Z` : "";
  const ticks = [0, .25, .5, .75, 1].map((ratio) => ({ value: Math.round(max * ratio), y: padding.top + usableHeight * (1 - ratio) }));

  if (!data.length) return <EmptyState text="Nenhuma OS encontrada no período." />;

  return (
    <div className="analytics-chart-scroll">
      <svg className="analytics-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução mensal das ordens de serviço">
        <defs>
          <linearGradient id="analytics-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity=".24" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => <g key={tick.y}><line x1={padding.left} x2={width - padding.right} y1={tick.y} y2={tick.y} className="analytics-grid-line" /><text x={padding.left - 10} y={tick.y + 4} textAnchor="end">{tick.value}</text></g>)}
        <path d={area} fill="url(#analytics-area)" />
        <polyline points={line} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => <g key={point.periodo}><circle cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#0f766e" strokeWidth="3"><title>{`${point.periodo}: ${point.quantidade}`}</title></circle>{(data.length <= 8 || index % Math.ceil(data.length / 8) === 0) && <text x={point.x} y={height - 15} textAnchor="middle">{point.periodo.slice(2)}</text>}</g>)}
      </svg>
    </div>
  );
}

function BarChart({ data, labelKey = "status" }: { data: CountItem[]; labelKey?: "status" | "faixa" | "categoria" }) {
  const max = Math.max(1, ...data.map((item) => item.quantidade));
  if (!data.length) return <EmptyState text="Nenhum dado disponível." />;
  return <div className="analytics-bars">{data.map((item, index) => {
    const label = String(item[labelKey] ?? "Não informado");
    return <div className="analytics-bar-row" key={label}><div className="analytics-bar-label"><span>{formatLabel(label)}</span><strong>{formatNumber(item.quantidade)}</strong></div><div className="analytics-bar-track"><span style={{ width: `${Math.max(2, item.quantidade / max * 100)}%`, background: COLORS[index % COLORS.length] }} /></div></div>;
  })}</div>;
}

function DonutChart({ values }: { values: { label: string; value: number; color: string }[] }) {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const stops = values.map((item) => {
    const start = cursor;
    cursor += total ? item.value / total * 360 : 0;
    return `${item.color} ${start}deg ${cursor}deg`;
  }).join(", ");
  return <div className="analytics-donut-wrap"><div className="analytics-donut" style={{ background: total ? `conic-gradient(${stops})` : "#e2e8f0" }}><div><strong>{formatNumber(total)}</strong><span>itens</span></div></div><div className="analytics-legend">{values.map((item) => <div key={item.label}><i style={{ background: item.color }} /><span>{item.label}</span><strong>{formatNumber(item.value)}</strong></div>)}</div></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="analytics-empty"><Database size={22} /><span>{text}</span></div>;
}

function Skeleton() {
  return <div className="analytics-skeleton"><span /><span /><span /></div>;
}

export function DashboardAnalitico() {
  const initialStart = new Date(new Date().getFullYear(), 0, 1);
  const [filtersData, setFiltersData] = useState<FiltersData>({ subestacoes: [], tipos_ativo: [], planos: [], periodicidades: [] });
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      return { data_inicio: isoDate(initialStart), data_fim: isoDate(new Date()), id_subestacao: "", id_tipo_ativo: "", ...JSON.parse(localStorage.getItem("analytics-filters") || "{}") };
    } catch { return { data_inicio: isoDate(initialStart), data_fim: isoDate(new Date()), id_subestacao: "", id_tipo_ativo: "" }; }
  });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [status, setStatus] = useState<CountItem[]>([]);
  const [aging, setAging] = useState<CountItem[]>([]);
  const [inspection, setInspection] = useState<InspectionSummary | null>(null);
  const [planning, setPlanning] = useState<PlanningSummary | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [quality, setQuality] = useState<Quality>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [details, setDetails] = useState<DetailItem[] | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const params = useMemo(() => ({
    data_inicio: filters.data_inicio || undefined,
    data_fim: filters.data_fim || undefined,
    id_subestacao: filters.id_subestacao || undefined,
    id_tipo_ativo: filters.id_tipo_ativo || undefined,
  }), [filters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const today = new Date();
    const future = new Date(today); future.setDate(future.getDate() + 90);
    const planningParams = { data_inicio: isoDate(today), data_fim: isoDate(future), id_subestacao: params.id_subestacao, id_tipo_ativo: params.id_tipo_ativo };
    try {
      const [filterRes, summaryRes, timelineRes, statusRes, agingRes, inspectionRes, planningRes, coverageRes, qualityRes] = await Promise.all([
        api.get("/analytics/filters"),
        api.get("/analytics/executive-summary", { params }),
        api.get("/analytics/os/timeline", { params: { ...params, granularidade: "mes" } }),
        api.get("/analytics/os/status", { params }),
        api.get("/analytics/os/backlog-aging", { params: { id_subestacao: params.id_subestacao, id_tipo_ativo: params.id_tipo_ativo } }),
        api.get("/analytics/inspections/summary", { params }),
        api.get("/analytics/planning/upcoming", { params: planningParams }),
        api.get("/analytics/planning/data-coverage", { params: planningParams }),
        api.get("/analytics/data-quality"),
      ]);
      setFiltersData(filterRes.data);
      setSummary(summaryRes.data);
      setTimeline(timelineRes.data);
      setStatus(statusRes.data);
      setAging(agingRes.data);
      setInspection(inspectionRes.data);
      setPlanning(planningRes.data);
      setCoverage(coverageRes.data);
      setQuality(qualityRes.data);
      setUpdatedAt(new Date());
    } catch {
      setError("Não foi possível carregar os indicadores analíticos. Verifique se o backend está atualizado e tente novamente.");
    } finally { setLoading(false); }
  }, [params]);

  useEffect(() => { const timer = window.setTimeout(loadData, 250); return () => window.clearTimeout(timer); }, [loadData]);
  useEffect(() => { localStorage.setItem("analytics-filters", JSON.stringify(filters)); }, [filters]);

  async function openBacklog() {
    setDetailsLoading(true); setDetails([]);
    try { setDetails((await api.get("/analytics/details/backlog", { params: { limite: 200 } })).data); }
    catch { setDetails(null); }
    finally { setDetailsLoading(false); }
  }

  const classData = Object.entries(summary?.classes ?? {}).map(([categoria, quantidade]) => ({ categoria, quantidade }));
  const qualityTotal = Object.values(quality).reduce((sum, value) => sum + Number(value || 0), 0);
  const inspectionValues = [
    { label: "OK", value: inspection?.status_itens?.OK ?? 0, color: "#0f766e" },
    { label: "NOK", value: inspection?.status_itens?.NOK ?? 0, color: "#dc2626" },
    { label: "N/A", value: inspection?.status_itens?.NA ?? 0, color: "#94a3b8" },
  ];

  return <main className="analytics-page">
    <section className="analytics-hero">
      <div><span className="analytics-eyebrow"><CircleGauge size={15} /> Inteligência de manutenção</span><h1>Dashboard analítico</h1><p>Desempenho operacional, qualidade dos dados e visão futura dos planos.</p></div>
      <div className="analytics-hero-meta"><span>{updatedAt ? `Atualizado às ${updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Aguardando atualização"}</span><button onClick={loadData} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} /> Atualizar</button></div>
    </section>

    <section className="analytics-filter-card">
      <div className="analytics-filter-title"><Filter size={17} /><div><strong>Filtros de análise</strong><span>Aplicados a todos os indicadores do período</span></div></div>
      <div className="analytics-filter-grid">
        <label>Data inicial<input type="date" value={filters.data_inicio} max={filters.data_fim} onChange={(e) => setFilters((f) => ({ ...f, data_inicio: e.target.value }))} /></label>
        <label>Data final<input type="date" value={filters.data_fim} min={filters.data_inicio} onChange={(e) => setFilters((f) => ({ ...f, data_fim: e.target.value }))} /></label>
        <label>Instalação<select value={filters.id_subestacao} onChange={(e) => setFilters((f) => ({ ...f, id_subestacao: e.target.value }))}><option value="">Todas as instalações</option>{filtersData.subestacoes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
        <label>Tipo de equipamento<select value={filters.id_tipo_ativo} onChange={(e) => setFilters((f) => ({ ...f, id_tipo_ativo: e.target.value }))}><option value="">Todos os tipos</option>{filtersData.tipos_ativo.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
      </div>
      <button className="analytics-clear" onClick={() => setFilters({ data_inicio: isoDate(initialStart), data_fim: isoDate(new Date()), id_subestacao: "", id_tipo_ativo: "" })}>Limpar filtros</button>
    </section>

    {error && <div className="analytics-error"><AlertCircle size={19} /><span>{error}</span><button onClick={loadData}>Tentar novamente</button></div>}

    <section className="analytics-kpis">
      <article><div className="analytics-kpi-icon teal"><Wrench size={21} /></div><span>Ordens no período</span>{loading ? <Skeleton /> : <><strong>{formatNumber(summary?.total_os)}</strong><small><ArrowUpRight size={14} /> {formatNumber(summary?.encerradas)} encerradas</small></>}</article>
      <button className="analytics-kpi-button" onClick={openBacklog}><div className="analytics-kpi-icon amber"><Clock3 size={21} /></div><span>Backlog atual</span>{loading ? <Skeleton /> : <><strong>{formatNumber(summary?.backlog)}</strong><small><ChevronRight size={14} /> Ver ordens pendentes</small></>}</button>
      <article><div className="analytics-kpi-icon red"><ShieldAlert size={21} /></div><span>Backlog vencido</span>{loading ? <Skeleton /> : <><strong>{formatNumber(summary?.atrasadas)}</strong><small><ArrowDownRight size={14} /> requer priorização</small></>}</article>
      <article><div className="analytics-kpi-icon blue"><CheckCircle2 size={21} /></div><span>Cumprimento de prazo</span>{loading ? <Skeleton /> : <><strong>{formatPercent(summary?.cumprimento_prazo_percentual)}</strong><small>{formatPercent(summary?.cobertura_prazo_percentual)} de cobertura</small></>}</article>
    </section>

    <section className="analytics-grid analytics-grid-wide">
      <article className="analytics-card analytics-span-2"><header><div><h2>Evolução das ordens</h2><p>Quantidade de OS abertas por mês no período selecionado</p></div><span className="analytics-chip"><CalendarDays size={14} /> Mensal</span></header>{loading ? <Skeleton /> : <LineChart data={timeline} />}</article>
      <article className="analytics-card"><header><div><h2>Status das OS</h2><p>Distribuição operacional atual</p></div></header>{loading ? <Skeleton /> : <BarChart data={status} />}</article>
    </section>

    <section className="analytics-grid">
      <article className="analytics-card"><header><div><h2>Idade do backlog</h2><p>Tempo desde a abertura</p></div></header>{loading ? <Skeleton /> : <BarChart data={aging} labelKey="faixa" />}</article>
      <article className="analytics-card"><header><div><h2>Mix de manutenção</h2><p>Classificação canônica das OS</p></div></header>{loading ? <Skeleton /> : <BarChart data={classData} labelKey="categoria" />}</article>
      <article className="analytics-card"><header><div><h2>Resultado das inspeções</h2><p>{formatNumber(inspection?.inspecoes)} inspeções · {formatPercent(inspection?.cobertura_avaliada_percentual)} avaliadas</p></div><span className={`analytics-chip ${(inspection?.nok_percentual ?? 0) > 5 ? "danger" : ""}`}>{formatPercent(inspection?.nok_percentual)} NOK</span></header>{loading ? <Skeleton /> : <DonutChart values={inspectionValues} />}</article>
    </section>

    <section className="analytics-section-title"><div><span>Planejamento</span><h2>Próximos 90 dias</h2></div><p>A previsão não inventa recursos: lacunas cadastrais aparecem como cobertura indisponível.</p></section>
    <section className="analytics-grid analytics-planning-grid">
      <article className="analytics-card analytics-plan-summary"><header><div><h2>Demanda futura</h2><p>Eventos consolidados por plano, ativo, data e periodicidade</p></div></header><div className="analytics-plan-numbers"><div><strong>{formatNumber(planning?.total_eventos)}</strong><span>eventos</span></div><div><strong>{formatNumber(planning?.total_itens)}</strong><span>itens de plano</span></div></div><div className="analytics-mini-timeline">{(planning?.serie ?? []).slice(0, 12).map((item) => <div key={item.data}><span style={{ height: `${Math.max(5, item.eventos / Math.max(1, ...(planning?.serie ?? []).map((x) => x.eventos)) * 100)}%` }} title={`${item.data}: ${item.eventos} eventos`} /><small>{item.data.slice(5)}</small></div>)}</div></article>
      <article className="analytics-card"><header><div><h2>Cobertura do planejamento</h2><p>Dados disponíveis para estimar capacidade</p></div></header><div className="analytics-coverage">{[["Duração", coverage?.duracao_percentual], ["Homem-hora", coverage?.hh_percentual], ["Equipe", coverage?.equipe_percentual], ["Recursos", coverage?.recursos_percentual]].map(([label, value]) => <div key={String(label)}><div><span>{label}</span><strong>{formatPercent(value as number | null)}</strong></div><div className="analytics-progress"><span style={{ width: `${value ?? 0}%` }} /></div></div>)}</div><p className="analytics-note"><AlertCircle size={15} /> Zero indica ausência de cadastro, não demanda zero.</p></article>
      <article className="analytics-card"><header><div><h2>Qualidade dos dados</h2><p>Pendências que afetam a confiabilidade dos indicadores</p></div><span className="analytics-chip danger">{formatNumber(qualityTotal)} ocorrências</span></header><div className="analytics-quality-list">{Object.entries(quality).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([key, value]) => <div key={key}><span>{formatLabel(key)}</span><strong>{formatNumber(value)}</strong></div>)}</div></article>
    </section>

    {details !== null && <div className="analytics-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDetails(null)}><section className="analytics-modal" role="dialog" aria-modal="true" aria-label="Detalhamento do backlog"><header><div><span>Drill-down</span><h2>Ordens pendentes</h2><p>Até 200 registros mais recentes do backlog.</p></div><button onClick={() => setDetails(null)} aria-label="Fechar"><X size={20} /></button></header>{detailsLoading ? <div className="analytics-modal-loading"><LoaderCircle className="spin" /> Carregando registros...</div> : <div className="analytics-table-wrap"><table><thead><tr><th>OS</th><th>Status</th><th>Abertura</th><th>Prazo</th></tr></thead><tbody>{details.map((item) => <tr key={item.id_os}><td><a href={`/os/${item.id_os}`}>{item.numero_os}</a></td><td><span>{formatLabel(item.status)}</span></td><td>{item.criado_em ? new Date(item.criado_em).toLocaleDateString("pt-BR") : "—"}</td><td>{item.data_fim_programado ? new Date(item.data_fim_programado).toLocaleDateString("pt-BR") : "Sem prazo"}</td></tr>)}</tbody></table></div>}</section></div>}
  </main>;
}
