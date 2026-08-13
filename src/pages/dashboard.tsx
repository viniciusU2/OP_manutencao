import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  FileText,
  Loader2,
  RefreshCcw,
  Wrench,
} from "lucide-react";
import api from "../api/api";
import { StatsCard } from "../components/StatsCard";
import { useAuth } from "../context/AuthContext";
import { filtroInicialInstalacao } from "../lib/instalacaoPreferida";

interface Ativo {
  id_ativo: number;
  codigo_ativo?: string;
  status?: string;
  id_subestacao?: number;
}

interface OS {
  id_os: number;
  numero_os: string;
  status?: string;
  prioridade?: string;
  esquema_servicos?: string;
  descricao_servicos?: string;
  id_subestacao?: number;
  data_inicio_programado?: string | null;
  data_fim_programado?: string | null;
  criado_em?: string | null;
  emissor?: string | null;
  editado_por?: string | null;
}

interface SS {
  id_ss?: number;
  numero_ss: string;
  status?: string;
  prioridade?: string;
  descricao_problema?: string;
  id_subestacao?: number | null;
  instalacao?: string;
  data_hora_solicitacao?: string | null;
  data_hora_limite?: string | null;
}

interface SI {
  id_si: number;
  numero_si: string;
  status_operacao?: string;
  status_manutencao?: string;
  id_subestacao?: number | null;
  data_inicio_preriodo_total?: string | null;
}

interface Inspecao {
  id_inspecao: number;
  id_ativo: number;
  id_subestacao?: number | null;
  instalacao?: string;
  data_inspecao: string;
  status_geral?: string;
}

interface Subestacao {
  id_subestacao: number;
  nome: string;
  status?: string;
}

const Page = styled.div`
  display: grid;
  gap: 22px;
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  h1 {
    margin: 0;
    color: #0f172a;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0;
  }

  p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 14px;
  }

  @media (max-width: 720px) {
    flex-direction: column;

    h1 {
      font-size: 24px;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 560px) {
    width: 100%;

    button {
      flex: 1 1 140px;
    }
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #f8fafc;
  }
`;

const FilterBand = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;

  @media (max-width: 900px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const Chips = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Chip = styled.button<{ $active: boolean }>`
  min-height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => ($active ? "#2563eb" : "#cbd5e1")};
  background: ${({ $active }) => ($active ? "#eff6ff" : "#ffffff")};
  color: ${({ $active }) => ($active ? "#1d4ed8" : "#475569")};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`;

const Select = styled.select`
  min-height: 36px;
  min-width: 240px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  padding: 0 10px;

  @media (max-width: 640px) {
    width: 100%;
    min-width: 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1180px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  gap: 18px;

  @media (max-width: 1050px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: #0f172a;
    font-size: 16px;
    font-weight: 700;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Bars = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
`;

const BarRow = styled.div`
  display: grid;
  gap: 7px;
`;

const BarMeta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #475569;
  font-size: 13px;
`;

const Track = styled.div`
  height: 9px;
  border-radius: 8px;
  background: #e2e8f0;
  overflow: hidden;
`;

const Fill = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}%;
  height: 100%;
  background: #2563eb;
`;

const PreventiveChart = styled.div`display:grid;grid-template-columns:repeat(2,minmax(120px,220px));justify-content:center;align-items:end;gap:clamp(24px,8vw,90px);min-height:260px;padding:28px 20px 20px;`;
const PreventiveColumn = styled.div`display:grid;grid-template-rows:28px 190px auto;gap:8px;text-align:center;strong{color:#0f172a;font-size:22px;}span{color:#475569;font-size:13px;font-weight:600;}`;
const PreventiveTrack = styled.div`display:flex;align-items:flex-end;height:190px;border-radius:10px 10px 4px 4px;background:#f1f5f9;overflow:hidden;`;
const PreventiveBar = styled.div<{ $height:number; $variant:"done"|"pending" }>`width:100%;height:${({$height})=>$height}%;min-height:${({$height})=>$height>0?"8px":"0"};border-radius:10px 10px 0 0;background:${({$variant})=>$variant==="done"?"linear-gradient(180deg,#22c55e,#15803d)":"linear-gradient(180deg,#f59e0b,#d97706)"};transition:height .3s ease;`;
const PreventiveLegend = styled.div`display:flex;justify-content:center;gap:18px;padding:0 16px 18px;color:#64748b;font-size:12px;span{display:flex;align-items:center;gap:6px;}i{width:9px;height:9px;border-radius:999px;}`;

const Empty = styled.div`
  padding: 26px 16px;
  color: #64748b;
  text-align: center;
  font-size: 14px;
`;

const DeadlineChart = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(72px, 1fr));
  align-items: end;
  gap: 14px;
  min-height: 260px;
  padding: 24px 20px 18px;
  overflow-x: auto;

  @media (max-width: 720px) {
    grid-template-columns: repeat(6, minmax(82px, 1fr));
  }
`;

const DeadlineColumn = styled.div`
  display: grid;
  grid-template-rows: 24px 170px auto;
  gap: 8px;
  min-width: 72px;
  text-align: center;
`;

const DeadlineValue = styled.strong`
  color: #0f172a;
  font-size: 15px;
`;

const DeadlineTrack = styled.div`
  display: flex;
  align-items: flex-end;
  height: 170px;
  border-radius: 8px 8px 4px 4px;
  background: linear-gradient(to top, #f1f5f9, #f8fafc);
  overflow: hidden;
`;

const DeadlineBar = styled.div<{ $height: number; $color: string }>`
  width: 100%;
  min-height: ${({ $height }) => ($height > 0 ? 6 : 0)}px;
  height: ${({ $height }) => $height}%;
  border-radius: 8px 8px 0 0;
  background: ${({ $color }) => $color};
  transition: height 220ms ease;
`;

const DeadlineLabel = styled.span`
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
`;

const InspectionContent = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(260px, 1.2fr);
  align-items: center;
  gap: 28px;
  padding: 22px;

  @media (max-width: 720px) { grid-template-columns: 1fr; }
`;

const PieArea = styled.div`
  display: grid;
  place-items: center;
  gap: 14px;
`;

const Pie = styled.div<{ $gradient: string }>`
  position: relative;
  width: 190px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: ${({ $gradient }) => $gradient};
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);

  &::after {
    content: "";
    position: absolute;
    inset: 31%;
    border-radius: 50%;
    background: #fff;
  }
`;

const Legend = styled.div`
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
`;

const LegendItem = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;

  &::before { content: ""; width: 9px; height: 9px; border-radius: 50%; background: ${({ $color }) => $color}; }
`;

const DateSlider = styled.div`
  display: grid;
  gap: 14px;

  label { color: #0f172a; font-size: 15px; font-weight: 700; }
  p { margin: 0; color: #64748b; font-size: 13px; }
  input { width: 100%; accent-color: #2563eb; cursor: pointer; }
`;

const SliderMarks = styled.div`
  display: flex;
  justify-content: space-between;
  color: #64748b;
  font-size: 11px;
`;

const ChartSelect = styled.select`
  min-height: 34px;
  min-width: 150px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  background: #fff;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
`;

const LineChartWrap = styled.div`
  padding: 20px 18px 12px;
  overflow-x: auto;
`;

const LineChartSvg = styled.svg`
  display: block;
  width: 100%;
  min-width: 620px;
  height: auto;

  .grid { stroke: #e2e8f0; stroke-width: 1; }
  .axis-label { fill: #64748b; font-size: 11px; }
  .value-label { fill: #0f172a; font-size: 11px; font-weight: 700; }
  .line { fill: none; stroke: #2563eb; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .area { fill: url(#lineAreaGradient); }
  .point { fill: #fff; stroke: #2563eb; stroke-width: 3; cursor: pointer; }
  .point:hover { fill: #2563eb; }
`;

const AnnualIndicatorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  padding: 16px;
`;

const AnnualIndicatorCard = styled.div`
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;

  h3 { margin: 0; color: #0f172a; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

const AnnualRate = styled.div`
  display: flex;
  align-items: baseline;
  gap: 5px;
  color: #1d4ed8;

  strong { font-size: 27px; line-height: 1; }
  span { font-size: 12px; font-weight: 600; }
`;

const AnnualDetails = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
`;

const InspectionKpis = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 520px) { grid-template-columns: 1fr; }
`;

const InspectionKpi = styled.div`
  padding: 9px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #e2e8f0;

  strong { display: block; color: #0f172a; font-size: 17px; }
  span { display: block; margin-top: 2px; color: #64748b; font-size: 10px; line-height: 1.2; }
`;

const IssuerChartContent = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.5fr);
  gap: 26px;
  padding: 18px;

  @media (max-width: 850px) { grid-template-columns: 1fr; }
`;

const IssuerBars = styled.div`
  display: grid;
  gap: 11px;
  max-height: 390px;
  padding-right: 4px;
  overflow-y: auto;
`;

const IssuerRow = styled.div`
  display: grid;
  grid-template-columns: minmax(100px, 180px) minmax(100px, 1fr) 36px;
  align-items: center;
  gap: 10px;
  color: #475569;
  font-size: 12px;

  > span:first-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

const IssuerTrack = styled.div`
  height: 18px;
  border-radius: 5px;
  background: #e2e8f0;
  overflow: hidden;
`;

const IssuerFill = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}%;
  min-width: ${({ $width }) => ($width > 0 ? 4 : 0)}px;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #60a5fa);
  transition: width 220ms ease;
`;

function normalizedStatus(status?: string) {
  return (status || "SEM_STATUS").toUpperCase();
}

function normalizarInstalacao(valor?: string | null) {
  return (valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function isOpenStatus(status?: string) {
  if (!status) return false;
  const value = normalizedStatus(status);
  return !["CONCLUIDA", "CONCLUIDO", "ENCERRADA", "FINALIZADA", "CANCELADA", "INATIVO"].includes(value);
}

function isOperationalAsset(status?: string) {
  return ["ATIVO", "OPERANTE", "OPERACIONAL"].includes(normalizedStatus(status));
}

function statusCounts(items: Array<{ status?: string }>) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = normalizedStatus(item.status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["data", "items", "results", "rows"]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }

  return [];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const INSPECTION_PERIODS = [30, 60, 90, 180, 365];
const EXIBIR_INDICADORES_ANUAIS_INSPECAO = false;

function daysUntil(value?: string | null) {
  if (!value) return null;
  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return Math.round((deadline.getTime() - today.getTime()) / DAY_MS);
}

export function Dashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [os, setOS] = useState<OS[]>([]);
  const [ss, setSS] = useState<SS[]>([]);
  const [si, setSI] = useState<SI[]>([]);
  const [inspecoes, setInspecoes] = useState<Inspecao[]>([]);
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [filtroSubestacao, setFiltroSubestacao] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodoInspecoes, setPeriodoInspecoes] = useState(3);
  const [periodoEmissores, setPeriodoEmissores] = useState(3);
  const [responsavelGraficoOS, setResponsavelGraficoOS] = useState<"emissor" | "editor">("emissor");
  const [documentoGrafico, setDocumentoGrafico] = useState<"ss" | "os" | "si">("ss");
  const [esquemaPreventiva, setEsquemaPreventiva] = useState("PREVENTIVA SEMANAL");

  async function fetchData() {
    setLoading(true);
    setError("");

    try {
      const [ativosRes, osRes, ssRes, siRes, subRes, inspecoesRes] = await Promise.all([
        api.get("/ativo"),
        api.get("/os"),
        api.get("/ss"),
        api.get("/si"),
        api.get("/subestacao"),
        api.get("/inspecoes", { params: { limit: 5000 } }),
      ]);

      setAtivos(asArray<Ativo>(ativosRes.data));
      setOS(asArray<OS>(osRes.data));
      setSS(asArray<SS>(ssRes.data));
      setSI(asArray<SI>(siRes.data));
      setSubestacoes(asArray<Subestacao>(subRes.data));
      setInspecoes(asArray<Inspecao>(inspecoesRes.data));

    } catch {
      setError("Nao foi possivel carregar todos os indicadores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtroInicial = filtroInicialInstalacao(usuario, subestacoes);
    setFiltroSubestacao(filtroInicial === "all" ? "" : filtroInicial);
  }, [subestacoes, usuario]);

  const subestacaoById = useMemo(() => {
    return subestacoes.reduce<Record<number, Subestacao>>((acc, sub) => {
      acc[sub.id_subestacao] = sub;
      return acc;
    }, {});
  }, [subestacoes]);

  const filtered = useMemo(() => {
    const bySub = (item: { id_subestacao?: number | null; instalacao?: string }) => {
      if (!filtroSubestacao) return true;
      const selected = subestacaoById[Number(filtroSubestacao)]?.nome;
      const instalacaoItem = normalizarInstalacao(item.instalacao);
      const instalacaoSelecionada = normalizarInstalacao(selected);
      return Number(item.id_subestacao) === Number(filtroSubestacao)
        || (Boolean(instalacaoItem) && instalacaoItem === instalacaoSelecionada);
    };

    return {
      ativos: ativos.filter(bySub),
      os: os.filter(bySub),
      ss: ss.filter(bySub),
      si: si.filter(bySub),
      inspecoes: inspecoes.filter(bySub),
    };
  }, [ativos, os, ss, si, inspecoes, filtroSubestacao, subestacaoById]);

  const totals = useMemo(() => {
    const osAbertas = filtered.os.filter((item) => isOpenStatus(item.status)).length;
    const ssAbertas = filtered.ss.filter((item) => isOpenStatus(item.status)).length;
    const siPendentes = filtered.si.filter((item) => isOpenStatus(item.status_operacao) || isOpenStatus(item.status_manutencao)).length;
    const ativosAtivos = filtered.ativos.filter((item) => isOperationalAsset(item.status)).length;

    return { osAbertas, ssAbertas, siPendentes, ativosAtivos };
  }, [filtered]);

  const comparativoPreventivas = useMemo(() => {
    const ordens = filtered.os.filter(item => (item.esquema_servicos || "").trim().toLocaleUpperCase("pt-BR") === esquemaPreventiva);
    const encerradas = ordens.filter(item => ["ENCERRADA", "CONCLUIDA", "CONCLUÍDA"].includes((item.status || "").toLocaleUpperCase("pt-BR"))).length;
    const pendentes = ordens.filter(item => ["ABERTA", "PROGRAMADA", "EM_EXECUCAO", "EM EXECUÇÃO", "EM_EXECUÇÃO"].includes((item.status || "").toLocaleUpperCase("pt-BR"))).length;
    const maximo = Math.max(encerradas, pendentes, 1);
    return { encerradas, pendentes, maximo, total: encerradas + pendentes };
  }, [filtered.os, esquemaPreventiva]);

  const osStatus = useMemo(() => statusCounts(filtered.os), [filtered.os]);
  const maxOsStatus = Math.max(1, ...Object.values(osStatus));
  const ssStatus = useMemo(() => statusCounts(filtered.ss), [filtered.ss]);
  const maxSsStatus = Math.max(1, ...Object.values(ssStatus));

  const ssDeadlines = useMemo(() => {
    const buckets = [
      { label: "Vencidas", count: 0, color: "#dc2626" },
      { label: "Hoje", count: 0, color: "#f59e0b" },
      { label: "1–7 dias", count: 0, color: "#f97316" },
      { label: "8–30 dias", count: 0, color: "#eab308" },
      { label: "31–60 dias", count: 0, color: "#3b82f6" },
      { label: "61–180 dias", count: 0, color: "#10b981" },
    ];

    filtered.ss.filter((item) => isOpenStatus(item.status)).forEach((item) => {
      const days = daysUntil(item.data_hora_limite);
      if (days === null || days > 180) return;
      if (days < 0) buckets[0].count += 1;
      else if (days === 0) buckets[1].count += 1;
      else if (days <= 7) buckets[2].count += 1;
      else if (days <= 30) buckets[3].count += 1;
      else if (days <= 60) buckets[4].count += 1;
      else buckets[5].count += 1;
    });

    return buckets;
  }, [filtered.ss]);

  const maxSsDeadline = Math.max(1, ...ssDeadlines.map((item) => item.count));

  const inspectionStatus = useMemo(() => {
    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setDate(limite.getDate() - INSPECTION_PERIODS[periodoInspecoes]);
    const contagens = { OK: 0, NOK: 0, NA: 0 };

    filtered.inspecoes.forEach((item) => {
      const data = new Date(item.data_inspecao);
      if (Number.isNaN(data.getTime()) || data < limite) return;
      const status = normalizedStatus(item.status_geral);
      if (status in contagens) contagens[status as keyof typeof contagens] += 1;
    });
    return contagens;
  }, [filtered.inspecoes, periodoInspecoes]);

  const totalInspecoesPeriodo = inspectionStatus.OK + inspectionStatus.NOK + inspectionStatus.NA;
  const okAngle = totalInspecoesPeriodo ? (inspectionStatus.OK / totalInspecoesPeriodo) * 360 : 0;
  const nokAngle = totalInspecoesPeriodo ? okAngle + (inspectionStatus.NOK / totalInspecoesPeriodo) * 360 : 0;
  const inspectionGradient = totalInspecoesPeriodo
    ? `conic-gradient(#10b981 0deg ${okAngle}deg, #ef4444 ${okAngle}deg ${nokAngle}deg, #94a3b8 ${nokAngle}deg 360deg)`
    : "#e2e8f0";

  const documentosPorSubestacao = useMemo(() => {
    const documentos = documentoGrafico === "ss" ? ss : documentoGrafico === "os" ? os : si;
    return subestacoes.map((subestacao) => ({
      id: subestacao.id_subestacao,
      nome: subestacao.nome,
      quantidade: documentos.filter((item) => Number(item.id_subestacao) === subestacao.id_subestacao).length,
    }));
  }, [documentoGrafico, ss, os, si, subestacoes]);

  const lineChart = useMemo(() => {
    const width = 900;
    const height = 300;
    const left = 55;
    const right = 28;
    const top = 28;
    const bottom = 62;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const maxValue = Math.max(1, ...documentosPorSubestacao.map((item) => item.quantidade));
    const scaleMax = Math.max(5, Math.ceil(maxValue / 5) * 5);
    const points = documentosPorSubestacao.map((item, index) => ({
      ...item,
      x: left + (documentosPorSubestacao.length <= 1 ? plotWidth / 2 : (index * plotWidth) / (documentosPorSubestacao.length - 1)),
      y: top + plotHeight - (item.quantidade / scaleMax) * plotHeight,
    }));
    const line = points.map((point) => `${point.x},${point.y}`).join(" ");
    const area = points.length
      ? `M ${points[0].x} ${top + plotHeight} L ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points[points.length - 1].x} ${top + plotHeight} Z`
      : "";
    const ticks = Array.from({ length: 6 }, (_, index) => ({
      value: (scaleMax / 5) * index,
      y: top + plotHeight - (plotHeight / 5) * index,
    }));
    return { width, height, left, right, top, bottom, plotWidth, plotHeight, points, line, area, ticks };
  }, [documentosPorSubestacao]);

  const anoIndicador = new Date().getFullYear();
  const osPorAtivoAnual = useMemo(() => {
    return subestacoes.map((subestacao) => {
      const quantidadeAtivos = ativos.filter(
        (ativo) => ativo.id_subestacao === subestacao.id_subestacao
      ).length;
      const quantidadeOS = os.filter((ordem) => {
        if (ordem.id_subestacao !== subestacao.id_subestacao) return false;
        const data = ordem.criado_em || ordem.data_inicio_programado;
        if (!data) return false;
        const dataOrdem = new Date(data);
        return !Number.isNaN(dataOrdem.getTime()) && dataOrdem.getFullYear() === anoIndicador;
      }).length;

      return {
        id: subestacao.id_subestacao,
        nome: subestacao.nome,
        quantidadeAtivos,
        quantidadeOS,
        indice: quantidadeAtivos ? quantidadeOS / quantidadeAtivos : 0,
      };
    });
  }, [subestacoes, ativos, os, anoIndicador]);

  const indicadoresInspecaoAnual = useMemo(() => {
    return subestacoes.map((subestacao) => {
      const ativosDaSubestacao = ativos.filter(
        (ativo) => ativo.id_subestacao === subestacao.id_subestacao
      );
      const idsAtivos = new Set(ativosDaSubestacao.map((ativo) => ativo.id_ativo));
      const inspecoesDoAno = inspecoes.filter((inspecao) => {
        if (!idsAtivos.has(inspecao.id_ativo)) return false;
        const data = new Date(inspecao.data_inspecao);
        return !Number.isNaN(data.getTime()) && data.getFullYear() === anoIndicador;
      });
      const inspecoesNok = inspecoesDoAno.filter(
        (inspecao) => normalizedStatus(inspecao.status_geral) === "NOK"
      );
      const ativosInspecionados = new Set(inspecoesDoAno.map((inspecao) => inspecao.id_ativo)).size;
      const ativosComNok = new Set(inspecoesNok.map((inspecao) => inspecao.id_ativo)).size;
      const totalAtivos = ativosDaSubestacao.length;

      return {
        id: subestacao.id_subestacao,
        nome: subestacao.nome,
        totalAtivos,
        inspecoesNok: inspecoesNok.length,
        totalInspecoes: inspecoesDoAno.length,
        percentualInspecoesNok: inspecoesDoAno.length
          ? (inspecoesNok.length / inspecoesDoAno.length) * 100
          : 0,
        percentualAtivosNok: totalAtivos ? (ativosComNok / totalAtivos) * 100 : 0,
        cobertura: totalAtivos ? (ativosInspecionados / totalAtivos) * 100 : 0,
      };
    });
  }, [subestacoes, ativos, inspecoes, anoIndicador]);

  const osPorEmissor = useMemo(() => {
    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setDate(limite.getDate() - INSPECTION_PERIODS[periodoEmissores]);
    const contagens = new Map<string, number>();

    filtered.os.forEach((ordem) => {
      const dataTexto = ordem.criado_em || ordem.data_inicio_programado;
      if (!dataTexto) return;
      const data = new Date(dataTexto);
      if (Number.isNaN(data.getTime()) || data < limite) return;
      const responsavel = responsavelGraficoOS === "emissor"
        ? ordem.emissor?.trim() || "Não informado"
        : ordem.editado_por?.trim() || "Não editada";
      contagens.set(responsavel, (contagens.get(responsavel) || 0) + 1);
    });

    return Array.from(contagens, ([emissor, quantidade]) => ({ emissor, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [filtered.os, periodoEmissores, responsavelGraficoOS]);

  const maxOsPorEmissor = Math.max(1, ...osPorEmissor.map((item) => item.quantidade));

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "#334155" }}>
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <Page>
      <Header>
        <div>
          <h1>Dashboard de Manutencao</h1>
          <p>Visao consolidada de ativos, servicos e solicitacoes em andamento.</p>
          {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
        </div>

        <HeaderActions>
          <ActionButton type="button" onClick={fetchData}>
            <RefreshCcw size={15} />
            Atualizar
          </ActionButton>
          <ActionButton type="button" onClick={() => navigate("/downloads")}>
            <FileText size={15} />
            Downloads
          </ActionButton>
        </HeaderActions>
      </Header>

      <FilterBand>
        <Chips>
          <Chip $active={!filtroSubestacao} onClick={() => setFiltroSubestacao("")}>
            Todas
          </Chip>
          {subestacoes.slice(0, 5).map((sub) => (
            <Chip
              key={sub.id_subestacao}
              $active={Number(filtroSubestacao) === sub.id_subestacao}
              onClick={() => setFiltroSubestacao(String(sub.id_subestacao))}
            >
              {sub.nome}
            </Chip>
          ))}
        </Chips>

        <Select value={filtroSubestacao} onChange={(event) => setFiltroSubestacao(event.target.value)}>
          <option value="">Todas as subestacoes</option>
          {subestacoes.map((sub) => (
            <option key={sub.id_subestacao} value={sub.id_subestacao}>
              {sub.nome}
            </option>
          ))}
        </Select>
      </FilterBand>

      {/* Galeria de fotos de inspeção removida do dashboard.
        {fotoAtual && !fotoAtualComErro ? (
          <FeaturedImage
            src={fotoAtualSrc}
            alt={`Foto da inspeção ${fotoAtual.id_inspecao}`}
            referrerPolicy="no-referrer"
            onError={() =>
              setPhotoLoadErrors((prev) => ({
                ...prev,
                [fotoAtual.url]: true,
              }))
            }
          />
        ) : (
          <CarouselEmpty>
            <div>
              <ImageIcon size={44} />
              <h2>{fotoAtualComErro ? "Previa bloqueada pelo SharePoint" : "Fotos das inspeções"}</h2>
              <p>
                {fotoAtualComErro
                  ? "Abra o link da foto ou ajuste o compartilhamento para permitir visualização direta."
                  : "As fotos enviadas nas inspeções aparecerão aqui em destaque."}
              </p>
              {fotoAtual?.url && (
                <FeaturedActions style={{ justifyContent: "center" }}>
                  <FeaturedButton type="button" onClick={() => window.open(fotoAtual.url, "_blank", "noreferrer")}>
                    <ExternalLink size={16} />
                    Abrir foto
                  </FeaturedButton>
                </FeaturedActions>
              )}
            </div>
          </CarouselEmpty>
        )}

        {fotoAtual && (
          <FeaturedOverlay>
            <FeaturedContent>
              <span>Galeria de inspeções</span>
              <h2>{fotoAtual.codigo_ativo || "Ativo inspecionado"}</h2>
              <p>
                {[fotoAtual.tipo_ativo, fotoAtual.item, formatDate(fotoAtual.data_inspecao)]
                  .filter(Boolean)
                  .join(" - ") || "Foto registrada durante inspeção de campo."}
              </p>
              <FeaturedActions>
                <FeaturedButton type="button" onClick={() => navigate(`/inspecoes/${fotoAtual.id_inspecao}`)}>
                  <ClipboardList size={16} />
                  Abrir inspeção
                </FeaturedButton>
                <FeaturedButton type="button" onClick={() => navigate(`/ativo/${fotoAtual.id_ativo}`)}>
                  <Zap size={16} />
                  Ver ativo
                </FeaturedButton>
                <FeaturedButton type="button" onClick={() => window.open(fotoAtual.url, "_blank", "noreferrer")}>
                  <ExternalLink size={16} />
                  Abrir foto
                </FeaturedButton>
              </FeaturedActions>
            </FeaturedContent>

            {fotosFiltradas.length > 1 && (
              <PhotoStrip>
                {fotosFiltradas.map((foto, index) => (
                  <PhotoThumb
                    key={`${foto.id_inspecao}-${foto.url}-${index}`}
                    type="button"
                    $active={index === currentPhoto}
                    onClick={() => setCurrentPhoto(index)}
                  >
                    <img
                      src={normalizePhotoUrl(foto.url)}
                      alt={foto.item ?? `Foto ${index + 1}`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setPhotoLoadErrors((prev) => ({
                          ...prev,
                          [foto.url]: true,
                        }))
                      }
                    />
                  </PhotoThumb>
                ))}
              </PhotoStrip>
            )}
          </FeaturedOverlay>
        )}

        {fotosFiltradas.length > 1 && (
          <>
            <CarouselNav
              type="button"
              $side="left"
              onClick={() => setCurrentPhoto((prev) => (prev === 0 ? fotosFiltradas.length - 1 : prev - 1))}
            >
              <ChevronLeft size={22} />
            </CarouselNav>
            <CarouselNav
              type="button"
              $side="right"
              onClick={() => setCurrentPhoto((prev) => (prev >= fotosFiltradas.length - 1 ? 0 : prev + 1))}
            >
              <ChevronRight size={22} />
            </CarouselNav>
          </>
        )}
      </FeaturedCarousel> */}

      <StatsGrid>
        <StatsCard title="OS em aberto" value={totals.osAbertas} icon={ClipboardList} color="blue" subtitle={`${filtered.os.length} OS no recorte`} />
        <StatsCard title="SS em aberto" value={totals.ssAbertas} icon={AlertTriangle} color="amber" subtitle={`${filtered.ss.length} SS cadastradas`} />
        <StatsCard title="SI pendentes" value={totals.siPendentes} icon={CalendarDays} color="emerald" subtitle={`${filtered.si.length} SI cadastradas`} />
      </StatsGrid>

      <Panel>
        <PanelHeader>
          <h2>
            <CalendarDays size={18} />
            Vencimentos das SS
          </h2>
          <span>SS em aberto por faixa de vencimento</span>
        </PanelHeader>

        <DeadlineChart>
          {ssDeadlines.map((item) => (
            <DeadlineColumn key={item.label} title={`${item.label}: ${item.count} SS`}>
              <DeadlineValue>{item.count}</DeadlineValue>
              <DeadlineTrack>
                <DeadlineBar
                  $height={(item.count / maxSsDeadline) * 100}
                  $color={item.color}
                />
              </DeadlineTrack>
              <DeadlineLabel>{item.label}</DeadlineLabel>
            </DeadlineColumn>
          ))}
        </DeadlineChart>
      </Panel>

      <Panel>
        <PanelHeader>
          <h2>
            <ClipboardList size={18} />
            Resultados das inspeções
          </h2>
          <span>{totalInspecoesPeriodo} inspeções no período</span>
        </PanelHeader>

        <InspectionContent>
          <PieArea>
            <Pie
              $gradient={inspectionGradient}
              title={`OK: ${inspectionStatus.OK} | NOK: ${inspectionStatus.NOK} | NA: ${inspectionStatus.NA}`}
            />
            <Legend>
              <LegendItem $color="#10b981">OK: {inspectionStatus.OK}</LegendItem>
              <LegendItem $color="#ef4444">NOK: {inspectionStatus.NOK}</LegendItem>
              <LegendItem $color="#94a3b8">NA: {inspectionStatus.NA}</LegendItem>
            </Legend>
          </PieArea>

          <DateSlider>
            <label htmlFor="periodo-inspecoes">
              Últimos {INSPECTION_PERIODS[periodoInspecoes]} dias
            </label>
            <p>Deslize para ampliar ou reduzir o período analisado no gráfico.</p>
            <input
              id="periodo-inspecoes"
              type="range"
              min="0"
              max={INSPECTION_PERIODS.length - 1}
              step="1"
              value={periodoInspecoes}
              onChange={(event) => setPeriodoInspecoes(Number(event.target.value))}
              aria-label="Período das inspeções"
            />
            <SliderMarks>
              {INSPECTION_PERIODS.map((dias) => <span key={dias}>{dias}d</span>)}
            </SliderMarks>
          </DateSlider>
        </InspectionContent>
      </Panel>

      <Panel>
        <PanelHeader>
          <h2>
            <FileText size={18} />
            Documentos por subestação
          </h2>
          <ChartSelect
            value={documentoGrafico}
            onChange={(event) => setDocumentoGrafico(event.target.value as "ss" | "os" | "si")}
            aria-label="Documento do gráfico"
          >
            <option value="ss">SS</option>
            <option value="os">OS</option>
            <option value="si">SI</option>
          </ChartSelect>
        </PanelHeader>

        {lineChart.points.length === 0 ? (
          <Empty>Nenhuma subestação encontrada.</Empty>
        ) : (
          <LineChartWrap>
            <LineChartSvg viewBox={`0 0 ${lineChart.width} ${lineChart.height}`} role="img" aria-label={`Quantidade de ${documentoGrafico.toUpperCase()} por subestação`}>
              <defs>
                <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {lineChart.ticks.map((tick) => (
                <g key={tick.value}>
                  <line className="grid" x1={lineChart.left} x2={lineChart.width - lineChart.right} y1={tick.y} y2={tick.y} />
                  <text className="axis-label" x={lineChart.left - 10} y={tick.y + 4} textAnchor="end">{Math.round(tick.value)}</text>
                </g>
              ))}

              <path className="area" d={lineChart.area} />
              <polyline className="line" points={lineChart.line} />

              {lineChart.points.map((point) => (
                <g key={point.id}>
                  <circle className="point" cx={point.x} cy={point.y} r="6">
                    <title>{`${point.nome}: ${point.quantidade} ${documentoGrafico.toUpperCase()}`}</title>
                  </circle>
                  <text className="value-label" x={point.x} y={point.y - 13} textAnchor="middle">{point.quantidade}</text>
                  <text className="axis-label" x={point.x} y={lineChart.height - 28} textAnchor="middle">
                    {point.nome.length > 18 ? `${point.nome.slice(0, 16)}…` : point.nome}
                  </text>
                </g>
              ))}
            </LineChartSvg>
          </LineChartWrap>
        )}
      </Panel>

      <Panel>
        <PanelHeader>
          <h2>
            <Wrench size={18} />
            Índice anual de OS por ativo
          </h2>
          <span>{anoIndicador}</span>
        </PanelHeader>

        <AnnualIndicatorGrid>
          {osPorAtivoAnual.map((item) => (
            <AnnualIndicatorCard key={item.id} title={item.nome}>
              <h3>{item.nome}</h3>
              <AnnualRate>
                <strong>{item.indice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                <span>OS/ativo</span>
              </AnnualRate>
              <AnnualDetails>
                <span>{item.quantidadeOS} OS no ano</span>
                <span>{item.quantidadeAtivos} ativos</span>
              </AnnualDetails>
            </AnnualIndicatorCard>
          ))}
        </AnnualIndicatorGrid>
      </Panel>

      {EXIBIR_INDICADORES_ANUAIS_INSPECAO && (
      <Panel>
        <PanelHeader>
          <h2>
            <ClipboardList size={18} />
            Indicadores anuais de inspeção
          </h2>
          <span>{anoIndicador}</span>
        </PanelHeader>

        <AnnualIndicatorGrid>
          {indicadoresInspecaoAnual.map((item) => (
            <AnnualIndicatorCard key={item.id} title={item.nome}>
              <h3>{item.nome}</h3>
              <InspectionKpis>
                <InspectionKpi>
                  <strong>{item.percentualInspecoesNok.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong>
                  <span>inspeções com resultado NOK</span>
                </InspectionKpi>
                <InspectionKpi>
                  <strong>{item.percentualAtivosNok.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong>
                  <span>ativos com NOK</span>
                </InspectionKpi>
                <InspectionKpi>
                  <strong>{item.cobertura.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong>
                  <span>cobertura de inspeção</span>
                </InspectionKpi>
              </InspectionKpis>
              <AnnualDetails>
                <span>{item.inspecoesNok} NOK de {item.totalInspecoes} inspeções</span>
                <span>{item.totalAtivos} ativos</span>
              </AnnualDetails>
            </AnnualIndicatorCard>
          ))}
        </AnnualIndicatorGrid>
      </Panel>
      )}

      <Panel>
        <PanelHeader>
          <h2>
            <FileText size={18} />
            {responsavelGraficoOS === "emissor" ? "Emissores das OS" : "Editores das OS"}
          </h2>
          <HeaderActions>
            <span>{osPorEmissor.reduce((total, item) => total + item.quantidade, 0)} OS no período</span>
            <ChartSelect
              value={responsavelGraficoOS}
              onChange={(event) => setResponsavelGraficoOS(event.target.value as "emissor" | "editor")}
              aria-label="Responsável considerado no gráfico de OS"
            >
              <option value="emissor">Emissores</option>
              <option value="editor">Editores</option>
            </ChartSelect>
          </HeaderActions>
        </PanelHeader>

        <IssuerChartContent>
          {osPorEmissor.length === 0 ? (
            <Empty>Nenhuma OS encontrada no período.</Empty>
          ) : (
            <IssuerBars>
              {osPorEmissor.map((item) => (
                <IssuerRow key={item.emissor} title={`${item.emissor}: ${item.quantidade} OS`}>
                  <span>{item.emissor}</span>
                  <IssuerTrack>
                    <IssuerFill $width={(item.quantidade / maxOsPorEmissor) * 100} />
                  </IssuerTrack>
                  <strong>{item.quantidade}</strong>
                </IssuerRow>
              ))}
            </IssuerBars>
          )}

          <DateSlider>
            <label htmlFor="periodo-emissores">
              Últimos {INSPECTION_PERIODS[periodoEmissores]} dias
            </label>
            <p>
              Deslize para alterar o período considerado na quantidade de OS por {responsavelGraficoOS === "emissor" ? "emissor" : "editor"}.
            </p>
            <input
              id="periodo-emissores"
              type="range"
              min="0"
              max={INSPECTION_PERIODS.length - 1}
              step="1"
              value={periodoEmissores}
              onChange={(event) => setPeriodoEmissores(Number(event.target.value))}
              aria-label={`Período das OS por ${responsavelGraficoOS === "emissor" ? "emissor" : "editor"}`}
            />
            <SliderMarks>
              {INSPECTION_PERIODS.map((dias) => <span key={dias}>{dias}d</span>)}
            </SliderMarks>
          </DateSlider>
        </IssuerChartContent>
      </Panel>

      <Panel>
        <PanelHeader>
          <h2><Wrench size={18} />Execução das preventivas</h2>
          <HeaderActions>
            <span>{comparativoPreventivas.total} OS no comparativo</span>
            <ChartSelect value={esquemaPreventiva} onChange={event => setEsquemaPreventiva(event.target.value)} aria-label="Periodicidade da preventiva">
              <option value="PREVENTIVA SEMANAL">Semanal</option>
              <option value="PREVENTIVA MENSAL">Mensal</option>
              <option value="PREVENTIVA BIMESTRAL">Bimestral</option>
              <option value="PREVENTIVA TRIMESTRAL">Trimestral</option>
              <option value="PREVENTIVA SEMESTRAL">Semestral</option>
              <option value="PREVENTIVA ANUAL">Anual</option>
            </ChartSelect>
          </HeaderActions>
        </PanelHeader>
        {comparativoPreventivas.total === 0 ? <Empty>Nenhuma OS encontrada para essa periodicidade.</Empty> : <>
          <PreventiveChart>
            <PreventiveColumn><strong>{comparativoPreventivas.encerradas}</strong><PreventiveTrack><PreventiveBar $variant="done" $height={(comparativoPreventivas.encerradas/comparativoPreventivas.maximo)*100}/></PreventiveTrack><span>Encerradas</span></PreventiveColumn>
            <PreventiveColumn><strong>{comparativoPreventivas.pendentes}</strong><PreventiveTrack><PreventiveBar $variant="pending" $height={(comparativoPreventivas.pendentes/comparativoPreventivas.maximo)*100}/></PreventiveTrack><span>Abertas / programadas / em execução</span></PreventiveColumn>
          </PreventiveChart>
          <PreventiveLegend><span><i style={{background:"#16a34a"}}/>Concluídas</span><span><i style={{background:"#d97706"}}/>Pendentes</span></PreventiveLegend>
        </>}
      </Panel>

      <ContentGrid>
        <Panel>
          <PanelHeader>
            <h2>
              <AlertTriangle size={18} />
              Status das SS
            </h2>
            <span>{filtered.ss.length} registros</span>
          </PanelHeader>

          <Bars>
            {Object.entries(ssStatus).length === 0 ? (
              <Empty>Nenhuma SS encontrada.</Empty>
            ) : (
              Object.entries(ssStatus).map(([status, count]) => (
                <BarRow key={status}>
                  <BarMeta>
                    <span>{status}</span>
                    <strong>{count}</strong>
                  </BarMeta>
                  <Track>
                    <Fill $width={(count / maxSsStatus) * 100} />
                  </Track>
                </BarRow>
              ))
            )}
          </Bars>
        </Panel>

        <Panel>
          <PanelHeader>
            <h2>
              <Wrench size={18} />
              Status das OS
            </h2>
            <span>{filtered.os.length} registros</span>
          </PanelHeader>

          <Bars>
            {Object.entries(osStatus).length === 0 ? (
              <Empty>Nenhuma OS encontrada.</Empty>
            ) : (
              Object.entries(osStatus).map(([status, count]) => (
                <BarRow key={status}>
                  <BarMeta>
                    <span>{status}</span>
                    <strong>{count}</strong>
                  </BarMeta>
                  <Track>
                    <Fill $width={(count / maxOsStatus) * 100} />
                  </Track>
                </BarRow>
              ))
            )}
          </Bars>
        </Panel>
      </ContentGrid>

      {/* Painéis Agenda próxima e Subestações em foco removidos.
      <ContentGrid>
        <Panel>
          <PanelHeader>
            <h2>
              <CalendarDays size={18} />
              Agenda proxima
            </h2>
            <span>{agendaProxima.length} eventos</span>
          </PanelHeader>

          <AgendaList>
            {agendaProxima.length === 0 ? (
              <Empty>Nenhuma OS ou SI programada neste recorte.</Empty>
            ) : (
              agendaProxima.map((item) => (
                <AgendaRow key={item.id} type="button" onClick={() => navigate(item.path)}>
                  <AgendaDate>{formatDate(item.date)}</AgendaDate>
                  <Kind $kind={item.kind}>{item.kind}</Kind>
                  <RowTitle>
                    <strong>{item.label}</strong>
                    <small>{item.description || "Sem detalhes adicionais"}</small>
                  </RowTitle>
                  <Status $status={item.status}>{item.status}</Status>
                </AgendaRow>
              ))
            )}
          </AgendaList>
        </Panel>

        <Panel>
          <PanelHeader>
            <h2>
              <Building2 size={18} />
              Subestacoes em foco
            </h2>
            <span>itens abertos</span>
          </PanelHeader>

          <List>
            {subRanking.length === 0 ? (
              <Empty>Nenhuma subestacao cadastrada.</Empty>
            ) : (
              subRanking.map((sub) => (
                <Row key={sub.id_subestacao} type="button" onClick={() => setFiltroSubestacao(String(sub.id_subestacao))}>
                  <Kind $kind="SI">{sub.count}</Kind>
                  <RowTitle>
                    <strong>{sub.nome}</strong>
                    <small>{sub.status || "Sem status informado"}</small>
                  </RowTitle>
                  <Status $status={sub.count > 0 ? "PENDENTE" : "OK"}>{sub.count > 0 ? "ATENCAO" : "OK"}</Status>
                </Row>
              ))
            )}
          </List>
        </Panel>
      </ContentGrid> */}
    </Page>
  );
}
