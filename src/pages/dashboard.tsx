import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  RefreshCcw,
  Wrench,
  Zap,
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
}

interface SS {
  id_ss?: number;
  numero_ss: string;
  status?: string;
  prioridade?: string;
  descricao_problema?: string;
  instalacao?: string;
  data_hora_solicitacao?: string | null;
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
  id_ativo?: number | null;
  id_subestacao?: number | null;
  data_inspecao: string;
  codigo_ativo?: string;
  tipo_ativo?: string;
  status_geral?: string;
}

interface Subestacao {
  id_subestacao: number;
  nome: string;
  status?: string;
}

interface FotoInspecao {
  url: string;
  id_inspecao: number;
  id_ativo?: number | null;
  id_subestacao?: number | null;
  codigo_ativo?: string;
  tipo_ativo?: string;
  data_inspecao: string;
  item?: string | null;
  status?: string | null;
}

type WorkItem = {
  id: string;
  label: string;
  kind: "OS" | "SI" | "SS";
  status: string;
  description?: string;
  date?: string | null;
  path: string;
  priority?: string;
};

type AgendaItem = {
  id: string;
  kind: "OS" | "SI";
  label: string;
  status: string;
  description?: string;
  date: string;
  path: string;
};

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

const FeaturedCarousel = styled.section`
  position: relative;
  min-height: 420px;
  overflow: hidden;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
`;

const FeaturedImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const FeaturedOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 22px;
  padding: 28px;
  background: linear-gradient(90deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.52) 48%, rgba(15, 23, 42, 0.16));

  @media (max-width: 720px) {
    padding: 20px;
    background: linear-gradient(0deg, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.38));
  }
`;

const FeaturedContent = styled.div`
  max-width: 660px;

  span {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.14);
    color: #dbeafe;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0;
  }

  h2 {
    margin: 14px 0 8px;
    font-size: clamp(30px, 4vw, 56px);
    line-height: 1;
    letter-spacing: 0;
  }

  p {
    max-width: 560px;
    margin: 0;
    color: #dbe3ef;
    font-size: 15px;
    line-height: 1.5;
  }
`;

const FeaturedActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
`;

const FeaturedButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
  }
`;

const CarouselNav = styled.button<{ $side: "left" | "right" }>`
  position: absolute;
  top: 50%;
  ${({ $side }) => $side}: 18px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.56);
  color: #ffffff;
  cursor: pointer;

  &:hover {
    background: rgba(15, 23, 42, 0.78);
  }
`;

const PhotoStrip = styled.div`
  display: flex;
  gap: 10px;
  max-width: 100%;
  overflow-x: auto;
  padding-bottom: 2px;
`;

const PhotoThumb = styled.button<{ $active: boolean }>`
  width: 84px;
  height: 58px;
  flex: 0 0 auto;
  overflow: hidden;
  border: 2px solid ${({ $active }) => ($active ? "#ffffff" : "rgba(255, 255, 255, 0.28)")};
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CarouselEmpty = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 28px;
  text-align: center;

  svg {
    margin: 0 auto 12px;
  }

  h2 {
    margin: 0;
    font-size: 28px;
  }

  p {
    margin: 8px 0 0;
    color: #cbd5e1;
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

const List = styled.div`
  display: grid;
`;

const Row = styled.button`
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f8fafc;
  }

  &:last-child {
    border-bottom: 0;
  }

  @media (max-width: 620px) {
    grid-template-columns: 52px minmax(0, 1fr);

    > span:last-child {
      grid-column: 2;
      justify-self: start;
    }
  }
`;

const Kind = styled.span<{ $kind: WorkItem["kind"] }>`
  display: inline-flex;
  justify-content: center;
  border-radius: 8px;
  padding: 6px 8px;
  color: ${({ $kind }) => ($kind === "OS" ? "#1d4ed8" : $kind === "SI" ? "#047857" : "#b45309")};
  background: ${({ $kind }) => ($kind === "OS" ? "#dbeafe" : $kind === "SI" ? "#d1fae5" : "#fef3c7")};
  font-size: 12px;
  font-weight: 800;
`;

const RowTitle = styled.div`
  min-width: 0;

  strong {
    display: block;
    color: #0f172a;
    font-size: 14px;
  }

  small {
    display: block;
    margin-top: 3px;
    color: #64748b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const Status = styled.span<{ $status: string }>`
  border-radius: 8px;
  padding: 6px 9px;
  color: ${({ $status }) => statusStyle($status).color};
  background: ${({ $status }) => statusStyle($status).bg};
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
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

const AgendaList = styled.div`
  display: grid;
`;

const AgendaRow = styled.button`
  display: grid;
  grid-template-columns: 112px 54px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f8fafc;
  }

  &:last-child {
    border-bottom: 0;
  }

  @media (max-width: 760px) {
    grid-template-columns: 78px minmax(0, 1fr);

    > span:nth-child(2),
    > span:last-child {
      grid-column: 2;
      justify-self: start;
    }
  }
`;

const AgendaDate = styled.span`
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
`;

const Empty = styled.div`
  padding: 26px 16px;
  color: #64748b;
  text-align: center;
  font-size: 14px;
`;

function normalizedStatus(status?: string) {
  return (status || "SEM_STATUS").toUpperCase();
}

function isOpenStatus(status?: string) {
  if (!status) return false;
  const value = normalizedStatus(status);
  return !["CONCLUIDA", "CONCLUIDO", "ENCERRADA", "FINALIZADA", "CANCELADA", "INATIVO"].includes(value);
}

function isOperationalAsset(status?: string) {
  return ["ATIVO", "OPERANTE", "OPERACIONAL"].includes(normalizedStatus(status));
}

function statusStyle(status: string) {
  const value = normalizedStatus(status);

  if (["CONCLUIDA", "CONCLUIDO", "ENCERRADA", "FINALIZADA", "ATIVO"].includes(value)) {
    return { bg: "#dcfce7", color: "#166534" };
  }

  if (["CANCELADA", "INATIVO"].includes(value)) {
    return { bg: "#e2e8f0", color: "#475569" };
  }

  if (["ALTA", "URGENTE", "ATRASADA"].includes(value)) {
    return { bg: "#fee2e2", color: "#b91c1c" };
  }

  return { bg: "#fef3c7", color: "#92400e" };
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

function normalizePhotoUrl(url?: string | null) {
  const value = url?.trim();
  if (!value) return "";

  if (/^(data:image\/|blob:)/i.test(value)) return value;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("sharepoint.com") || host.includes("onedrive.live.com")) {
      parsed.searchParams.set("download", "1");
      return parsed.toString();
    }

    return value;
  } catch {
    return value;
  }
}

function sortByDateDesc<T>(items: T[], pickDate: (item: T) => string | null | undefined) {
  return [...items].sort((a, b) => {
    const dateA = new Date(pickDate(a) ?? "").getTime() || 0;
    const dateB = new Date(pickDate(b) ?? "").getTime() || 0;
    return dateB - dateA;
  });
}

function statusCounts(items: Array<{ status?: string }>) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = normalizedStatus(item.status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function priorityScore(priority?: string) {
  const value = normalizedStatus(priority);
  if (["NIVEL_1"].includes(value)) return 6;
  if (["NIVEL_2"].includes(value)) return 5;
  if (["NIVEL_3"].includes(value)) return 4;
  if (["NIVEL_4"].includes(value)) return 3;
  if (["NIVEL_5"].includes(value)) return 2;
  if (["ALTA", "URGENTE"].includes(value)) return 3;
  if (["MEDIA", "MEDIO"].includes(value)) return 2;
  return 1;
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

export function Dashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [os, setOS] = useState<OS[]>([]);
  const [ss, setSS] = useState<SS[]>([]);
  const [si, setSI] = useState<SI[]>([]);
  const [inspecoes, setInspecoes] = useState<Inspecao[]>([]);
  const [fotosInspecao, setFotosInspecao] = useState<FotoInspecao[]>([]);
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [filtroSubestacao, setFiltroSubestacao] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [photoLoadErrors, setPhotoLoadErrors] = useState<Record<string, boolean>>({});

  async function fetchData() {
    setLoading(true);
    setError("");
    setPhotoLoadErrors({});

    try {
      const [ativosRes, osRes, ssRes, siRes, subRes, inspecoesRes] = await Promise.all([
        api.get("/ativo"),
        api.get("/os"),
        api.get("/ss"),
        api.get("/si"),
        api.get("/subestacao"),
        api.get("/inspecoes"),
      ]);

      setAtivos(asArray<Ativo>(ativosRes.data));
      setOS(asArray<OS>(osRes.data));
      setSS(asArray<SS>(ssRes.data));
      setSI(asArray<SI>(siRes.data));
      setSubestacoes(asArray<Subestacao>(subRes.data));

      const inspecoesData = asArray<Inspecao>(inspecoesRes.data);
      setInspecoes(inspecoesData);

      const detalhes = await Promise.allSettled(
        sortByDateDesc(inspecoesData, (inspecao) => inspecao.data_inspecao)
          .slice(0, 18)
          .map((inspecao) => api.get(`/inspecoes/${inspecao.id_inspecao}`))
      );

      const fotos = detalhes.flatMap((detalhe) => {
        if (detalhe.status !== "fulfilled") return [];

        const inspecao = detalhe.value.data;
        return (inspecao.resultados ?? [])
          .filter((resultado: any) => Boolean(resultado.foto?.trim()))
          .map((resultado: any) => ({
            url: resultado.foto.trim(),
            id_inspecao: inspecao.id_inspecao,
            id_ativo: inspecao.id_ativo,
            id_subestacao: inspecao.id_subestacao,
            codigo_ativo: inspecao.codigo_ativo,
            tipo_ativo: inspecao.tipo_ativo,
            data_inspecao: inspecao.data_inspecao,
            item: resultado.nome_item,
            status: resultado.status_item,
          }));
      });

      setFotosInspecao(fotos);
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
      return Number(item.id_subestacao) === Number(filtroSubestacao) || item.instalacao === selected;
    };

    return {
      ativos: ativos.filter(bySub),
      os: os.filter(bySub),
      ss: ss.filter(bySub),
      si: si.filter(bySub),
      inspecoes: inspecoes.filter(bySub),
    };
  }, [ativos, os, ss, si, inspecoes, filtroSubestacao, subestacaoById]);

  const fotosFiltradas = useMemo(() => {
    if (!filtroSubestacao) return fotosInspecao;

    return fotosInspecao.filter((foto) => Number(foto.id_subestacao) === Number(filtroSubestacao));
  }, [filtroSubestacao, fotosInspecao]);

  useEffect(() => {
    setCurrentPhoto(0);
  }, [fotosFiltradas.length, filtroSubestacao]);

  const fotoAtual = fotosFiltradas[currentPhoto] ?? fotosFiltradas[0];
  const fotoAtualSrc = normalizePhotoUrl(fotoAtual?.url);
  const fotoAtualComErro = fotoAtual ? photoLoadErrors[fotoAtual.url] : false;

  const totals = useMemo(() => {
    const osAbertas = filtered.os.filter((item) => isOpenStatus(item.status)).length;
    const ssAbertas = filtered.ss.filter((item) => isOpenStatus(item.status)).length;
    const siPendentes = filtered.si.filter((item) => isOpenStatus(item.status_operacao) || isOpenStatus(item.status_manutencao)).length;
    const ativosAtivos = filtered.ativos.filter((item) => isOperationalAsset(item.status)).length;

    return { osAbertas, ssAbertas, siPendentes, ativosAtivos };
  }, [filtered]);

  const workQueue = useMemo<WorkItem[]>(() => {
    const osItems = filtered.os
      .filter((item) => isOpenStatus(item.status))
      .map((item) => ({
        id: `os-${item.id_os}`,
        kind: "OS" as const,
        label: item.numero_os,
        status: item.status || "ABERTA",
        description: item.descricao_servicos || item.esquema_servicos,
        date: item.data_inicio_programado,
        path: `/os/${item.id_os}`,
        priority: item.prioridade,
      }));

    const siItems = filtered.si
      .filter((item) => isOpenStatus(item.status_operacao) || isOpenStatus(item.status_manutencao))
      .map((item) => ({
        id: `si-${item.id_si}`,
        kind: "SI" as const,
        label: item.numero_si,
        status: item.status_operacao || item.status_manutencao || "PENDENTE",
        description: "Solicitacao de intervencao",
        date: item.data_inicio_preriodo_total,
        path: `/si/${item.id_si}`,
        priority: undefined,
      }));

    const ssItems = filtered.ss
      .filter((item) => isOpenStatus(item.status))
      .map((item) => ({
        id: `ss-${item.id_ss || item.numero_ss}`,
        kind: "SS" as const,
        label: item.numero_ss,
        status: item.status || "ABERTA",
        description: item.descricao_problema,
        date: item.data_hora_solicitacao,
        path: item.id_ss ? `/ss/${item.id_ss}` : "/ss",
        priority: item.prioridade,
      }));

    return [...osItems, ...ssItems, ...siItems]
      .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority))
      .slice(0, 8);
  }, [filtered]);

  const osStatus = useMemo(() => statusCounts(filtered.os), [filtered.os]);
  const maxOsStatus = Math.max(1, ...Object.values(osStatus));

  const subRanking = useMemo(() => {
    return subestacoes
      .map((sub) => {
        const count =
          os.filter((item) => item.id_subestacao === sub.id_subestacao && isOpenStatus(item.status)).length +
          si.filter((item) => item.id_subestacao === sub.id_subestacao && (isOpenStatus(item.status_operacao) || isOpenStatus(item.status_manutencao))).length +
          ss.filter((item) => item.instalacao === sub.nome && isOpenStatus(item.status)).length;

        return { ...sub, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [subestacoes, os, si, ss]);

  const agendaProxima = useMemo<AgendaItem[]>(() => {
    const osAgenda = filtered.os
      .filter((item) => item.data_inicio_programado)
      .map((item) => ({
        id: `agenda-os-${item.id_os}`,
        kind: "OS" as const,
        label: item.numero_os,
        status: item.status || "SEM_STATUS",
        description: item.descricao_servicos || item.esquema_servicos,
        date: item.data_inicio_programado as string,
        path: `/os/${item.id_os}`,
      }));

    const siAgenda = filtered.si
      .filter((item) => item.data_inicio_preriodo_total)
      .map((item) => ({
        id: `agenda-si-${item.id_si}`,
        kind: "SI" as const,
        label: item.numero_si,
        status: item.status_operacao || item.status_manutencao || "SEM_STATUS",
        description: "Solicitacao de intervencao",
        date: item.data_inicio_preriodo_total as string,
        path: `/si/${item.id_si}`,
      }));

    return [...osAgenda, ...siAgenda]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [filtered.os, filtered.si]);

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

      <FeaturedCarousel>
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
      </FeaturedCarousel>

      <StatsGrid>
        <StatsCard title="OS em aberto" value={totals.osAbertas} icon={ClipboardList} color="blue" subtitle={`${filtered.os.length} OS no recorte`} />
        <StatsCard title="SS em aberto" value={totals.ssAbertas} icon={AlertTriangle} color="amber" subtitle={`${filtered.ss.length} SS cadastradas`} />
        <StatsCard title="SI pendentes" value={totals.siPendentes} icon={CalendarDays} color="emerald" subtitle={`${filtered.si.length} SI cadastradas`} />
        <StatsCard title="Fotos de inspeção" value={fotosFiltradas.length} icon={ImageIcon} color="violet" subtitle={`${filtered.inspecoes.length} inspeções no recorte`} />
      </StatsGrid>

      <ContentGrid>
        <Panel>
          <PanelHeader>
            <h2>
              <Activity size={18} />
              Fila de atencao
            </h2>
            <span>{workQueue.length} itens</span>
          </PanelHeader>

          <List>
            {workQueue.length === 0 ? (
              <Empty>Nenhum item pendente neste recorte.</Empty>
            ) : (
              workQueue.map((item) => (
                <Row key={item.id} type="button" onClick={() => navigate(item.path)}>
                  <Kind $kind={item.kind}>{item.kind}</Kind>
                  <RowTitle>
                    <strong>{item.label}</strong>
                    <small>
                      {[item.description, formatDate(item.date)].filter(Boolean).join(" - ") || "Sem detalhes adicionais"}
                    </small>
                  </RowTitle>
                  <Status $status={item.status}>{item.status}</Status>
                </Row>
              ))
            )}
          </List>
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
      </ContentGrid>
    </Page>
  );
}
