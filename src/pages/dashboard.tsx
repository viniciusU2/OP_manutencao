import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  Loader2,
  RefreshCcw,
  Wrench,
  Zap,
} from "lucide-react";
import api from "../api/api";
import { StatsCard } from "../components/StatsCard";
import { CalendarioOSSI } from "../components/calendar";

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

interface Subestacao {
  id_subestacao: number;
  nome: string;
  status?: string;
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
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

const CalendarWrap = styled.div`
  padding: 12px;
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
  const value = normalizedStatus(status);
  return !["CONCLUIDA", "CONCLUIDO", "ENCERRADA", "FINALIZADA", "CANCELADA", "INATIVO"].includes(value);
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

function statusCounts(items: Array<{ status?: string }>) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = normalizedStatus(item.status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function priorityScore(priority?: string) {
  const value = normalizedStatus(priority);
  if (["ALTA", "URGENTE"].includes(value)) return 3;
  if (["MEDIA", "MEDIO"].includes(value)) return 2;
  return 1;
}

export function Dashboard() {
  const navigate = useNavigate();

  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [os, setOS] = useState<OS[]>([]);
  const [ss, setSS] = useState<SS[]>([]);
  const [si, setSI] = useState<SI[]>([]);
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [filtroSubestacao, setFiltroSubestacao] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchData() {
    setLoading(true);
    setError("");

    try {
      const [ativosRes, osRes, ssRes, siRes, subRes] = await Promise.all([
        api.get("/ativo"),
        api.get("/os"),
        api.get("/ss"),
        api.get("/si"),
        api.get("/subestacao"),
      ]);

      setAtivos(ativosRes.data || []);
      setOS(osRes.data || []);
      setSS(ssRes.data || []);
      setSI(siRes.data || []);
      setSubestacoes(subRes.data || []);
    } catch {
      setError("Nao foi possivel carregar todos os indicadores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

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
    };
  }, [ativos, os, ss, si, filtroSubestacao, subestacaoById]);

  const totals = useMemo(() => {
    const osAbertas = filtered.os.filter((item) => isOpenStatus(item.status)).length;
    const ssAbertas = filtered.ss.filter((item) => isOpenStatus(item.status)).length;
    const siPendentes = filtered.si.filter((item) => isOpenStatus(item.status_operacao) || isOpenStatus(item.status_manutencao)).length;
    const ativosAtivos = filtered.ativos.filter((item) => normalizedStatus(item.status) !== "INATIVO").length;

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

      <StatsGrid>
        <StatsCard title="OS abertas" value={totals.osAbertas} icon={ClipboardList} color="blue" subtitle={`${filtered.os.length} OS no recorte`} />
        <StatsCard title="SS abertas" value={totals.ssAbertas} icon={AlertTriangle} color="amber" subtitle={`${filtered.ss.length} SS cadastradas`} />
        <StatsCard title="SI pendentes" value={totals.siPendentes} icon={CalendarDays} color="emerald" subtitle={`${filtered.si.length} SI cadastradas`} />
        <StatsCard title="Ativos operacionais" value={totals.ativosAtivos} icon={Zap} color="violet" subtitle={`${filtered.ativos.length} ativos no total`} />
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
              Calendario
            </h2>
            <span>OS e SI programadas</span>
          </PanelHeader>
          <CalendarWrap>
            <CalendarioOSSI />
          </CalendarWrap>
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
