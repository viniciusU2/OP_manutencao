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

      setAtivos(asArray<Ativo>(ativosRes.data));
      setOS(asArray<OS>(osRes.data));
      setSS(asArray<SS>(ssRes.data));
      setSI(asArray<SI>(siRes.data));
      setSubestacoes(asArray<Subestacao>(subRes.data));

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
    };
  }, [ativos, os, ss, si, filtroSubestacao, subestacaoById]);

  const totals = useMemo(() => {
    const osAbertas = filtered.os.filter((item) => isOpenStatus(item.status)).length;
    const ssAbertas = filtered.ss.filter((item) => isOpenStatus(item.status)).length;
    const siPendentes = filtered.si.filter((item) => isOpenStatus(item.status_operacao) || isOpenStatus(item.status_manutencao)).length;
    const ativosAtivos = filtered.ativos.filter((item) => isOperationalAsset(item.status)).length;

    return { osAbertas, ssAbertas, siPendentes, ativosAtivos };
  }, [filtered]);

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
