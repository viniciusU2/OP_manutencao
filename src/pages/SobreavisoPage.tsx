import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileBarChart,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import {
  alterarStatusSobreaviso,
  avaliarSolicitacaoAjuste,
  calcularHoras,
  equipeNome,
  exportarFolhaPontoSobreaviso,
  listarSobreavisoDataSet,
  salvarColaborador,
  salvarSolicitacaoAjuste,
  salvarSobreaviso,
} from "../services/sobreavisoService";
import type {
  ColaboradorSobreaviso,
  Sobreaviso,
  SobreavisoDataSet,
  SobreavisoStatus,
} from "../types/Sobreaviso";

type Tab = "calendario" | "colaboradores" | "escala" | "aprovacao" | "relatorios";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "calendario", label: "Calendario" },
  { id: "colaboradores", label: "Colaboradores" },
  { id: "escala", label: "Escala" },
  { id: "aprovacao", label: "Aprovacao" },
  { id: "relatorios", label: "Relatorios" },
];

const initialData: SobreavisoDataSet = {
  equipes: [],
  subestacoes: [],
  colaboradores: [],
  sobreavisos: [],
  solicitacoes: [],
  historico: [],
};

const Page = styled.div`
  display: grid;
  gap: 20px;
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

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  min-height: 38px;
  flex: 0 0 auto;
  border: 1px solid ${({ $active }) => ($active ? "#2563eb" : "#cbd5e1")};
  border-radius: 8px;
  background: ${({ $active }) => ($active ? "#eff6ff" : "#ffffff")};
  color: ${({ $active }) => ($active ? "#1d4ed8" : "#475569")};
  padding: 0 13px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
`;

const Toolbar = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;

  @media (max-width: 860px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const FieldGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  > * {
    min-width: 180px;
  }

  @media (max-width: 640px) {
    > * {
      min-width: 0;
      width: 100%;
    }
  }
`;

const Input = styled.input`
  min-height: 38px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  padding: 0 11px;
  font-size: 13px;
`;

const Select = styled.select`
  min-height: 38px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  padding: 0 11px;
  font-size: 13px;
`;

const Textarea = styled.textarea`
  min-height: 84px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  padding: 10px 11px;
  font-size: 13px;
  resize: vertical;
`;

const Grid = styled.div<{ $columns?: string }>`
  display: grid;
  grid-template-columns: ${({ $columns }) => $columns ?? "minmax(0, 1fr) minmax(340px, 0.8fr)"};
  gap: 16px;

  @media (max-width: 1080px) {
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

const PanelBody = styled.div`
  display: grid;
  gap: 14px;
  padding: 16px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  label {
    display: grid;
    gap: 6px;
    color: #475569;
    font-size: 12px;
    font-weight: 700;
  }

  .full {
    grid-column: 1 / -1;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;

  th,
  td {
    border-bottom: 1px solid #f1f5f9;
    padding: 12px;
    text-align: left;
    vertical-align: top;
    font-size: 13px;
  }

  th {
    color: #475569;
    background: #f8fafc;
    font-weight: 800;
  }

  td {
    color: #0f172a;
  }
`;

const StatusPill = styled.span<{ $status: SobreavisoStatus | "PENDENTE_AJUSTE" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  border-radius: 8px;
  padding: 0 9px;
  color: ${({ $status }) => statusStyle($status).color};
  background: ${({ $status }) => statusStyle($status).bg};
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(120px, 1fr));
  border-top: 1px solid #e2e8f0;
  border-left: 1px solid #e2e8f0;
  overflow-x: auto;
`;

const DayCell = styled.div`
  min-height: 150px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 9px;
`;

const DayNumber = styled.div`
  margin-bottom: 8px;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
`;

const EventCard = styled.button`
  display: grid;
  gap: 3px;
  width: 100%;
  margin-bottom: 7px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
  padding: 7px;
  text-align: left;
  font-size: 12px;
  cursor: pointer;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const Empty = styled.div`
  padding: 24px 16px;
  color: #64748b;
  text-align: center;
  font-size: 14px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

function statusStyle(status: SobreavisoStatus | "PENDENTE_AJUSTE") {
  if (status === "APROVADO") return { bg: "#dcfce7", color: "#166534" };
  if (status === "REPROVADO" || status === "CANCELADO") return { bg: "#fee2e2", color: "#991b1b" };
  if (status === "PLANEJADO") return { bg: "#dbeafe", color: "#1d4ed8" };
  if (status === "PENDENTE_AJUSTE") return { bg: "#f3e8ff", color: "#6b21a8" };
  return { bg: "#fef3c7", color: "#92400e" };
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function monthInput(value: Date) {
  return value.toISOString().slice(0, 7);
}

function getUserName(nome?: string) {
  return nome?.trim() || "Usuario";
}

function fechamentoFolhaRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const inicio = new Date(year, monthNumber - 2, 21, 0, 0, 0);
  const fim = new Date(year, monthNumber - 1, 20, 23, 59, 59);

  return {
    inicio,
    fim,
    inicioApi: `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}-${String(inicio.getDate()).padStart(2, "0")}T00:00:00`,
    fimApi: `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, "0")}-${String(fim.getDate()).padStart(2, "0")}T23:59:59`,
    label: `${inicio.toLocaleDateString("pt-BR")} a ${fim.toLocaleDateString("pt-BR")}`,
  };
}

function inFechamentoRange(item: Sobreaviso, range: ReturnType<typeof fechamentoFolhaRange>) {
  const inicio = new Date(item.inicio).getTime();
  const fim = new Date(item.fim).getTime();
  return inicio <= range.fim.getTime() && fim >= range.inicio.getTime();
}

function dayBounds(day: Date) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function horasNoDia(item: Sobreaviso, day: Date) {
  const { start, end } = dayBounds(day);
  const inicio = new Date(item.inicio);
  const fim = new Date(item.fim);
  const trechoInicio = new Date(Math.max(inicio.getTime(), start.getTime()));
  const trechoFim = new Date(Math.min(fim.getTime(), end.getTime()));

  if (trechoFim <= trechoInicio) return 0;
  return calcularHoras(trechoInicio.toISOString(), trechoFim.toISOString());
}

function sobreavisoAtingeDia(item: Sobreaviso, day: Date) {
  return horasNoDia(item, day) > 0;
}

export default function SobreavisoPage() {
  const { usuario } = useAuth();
  const usuarioNome = getUserName(usuario?.nome);
  const [activeTab, setActiveTab] = useState<Tab>("calendario");
  const [data, setData] = useState<SobreavisoDataSet>(initialData);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(monthInput(new Date()));
  const [selectedEquipe, setSelectedEquipe] = useState("");
  const [selectedSubestacao, setSelectedSubestacao] = useState("");
  const [selectedColaborador, setSelectedColaborador] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [relatorioColaboradorId, setRelatorioColaboradorId] = useState("");
  const [editingColaborador, setEditingColaborador] = useState<ColaboradorSobreaviso | null>(null);
  const [editingSobreaviso, setEditingSobreaviso] = useState<Sobreaviso | null>(null);
  const [colaboradorForm, setColaboradorForm] = useState({
    nome: "",
    matricula: "",
    email: "",
    cargo: "",
    telefone: "",
    equipeId: "1",
    subestacaoId: "",
    usuarioId: "",
    ativo: "true",
  });
  const [sobreavisoForm, setSobreavisoForm] = useState({
    colaboradorId: "1",
    inicio: `${dateInput(new Date())}T18:00`,
    fim: `${dateInput(new Date(Date.now() + 86_400_000))}T06:00`,
    status: "PENDENTE" as SobreavisoStatus,
    origem: "GESTOR" as "ADMIN" | "GESTOR" | "COLABORADOR",
    justificativa: "",
  });
  const [ajusteForm, setAjusteForm] = useState({
    sobreavisoId: "",
    inicioSolicitado: "",
    fimSolicitado: "",
    justificativa: "",
  });

  async function carregar() {
    setLoading(true);
    try {
      setData(await listarSobreavisoDataSet());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (data.colaboradores[0] && sobreavisoForm.colaboradorId === "1") {
      setSobreavisoForm((prev) => ({ ...prev, colaboradorId: String(data.colaboradores[0].id) }));
    }
  }, [data.colaboradores, sobreavisoForm.colaboradorId]);

  const colaboradorById = useMemo(() => {
    return data.colaboradores.reduce<Record<number, ColaboradorSobreaviso>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [data.colaboradores]);

  const fechamentoRange = useMemo(() => fechamentoFolhaRange(selectedMonth), [selectedMonth]);

  useEffect(() => {
    if (!relatorioColaboradorId && data.colaboradores[0]) {
      setRelatorioColaboradorId(String(data.colaboradores[0].id));
    }
  }, [data.colaboradores, relatorioColaboradorId]);

  const filteredSobreavisos = useMemo(() => {
    return data.sobreavisos.filter((item) => {
      const colaborador = colaboradorById[item.colaboradorId];
      const equipeOk = !selectedEquipe || String(colaborador?.equipeId) === selectedEquipe;
      const subestacaoOk = !selectedSubestacao || String(colaborador?.subestacaoId ?? "") === selectedSubestacao;
      const colaboradorOk = !selectedColaborador || String(item.colaboradorId) === selectedColaborador;
      const statusOk = !selectedStatus || item.status === selectedStatus;
      return inFechamentoRange(item, fechamentoRange) && equipeOk && subestacaoOk && colaboradorOk && statusOk;
    });
  }, [colaboradorById, data.sobreavisos, fechamentoRange, selectedColaborador, selectedEquipe, selectedStatus, selectedSubestacao]);

  const calendarDays = useMemo(() => {
    const startOffset = fechamentoRange.inicio.getDay();
    const totalDays =
      Math.floor((fechamentoRange.fim.getTime() - fechamentoRange.inicio.getTime()) / 86_400_000) + 1;
    const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const offset = index - startOffset;
      if (offset < 0 || offset >= totalDays) return null;

      const date = new Date(fechamentoRange.inicio);
      date.setDate(fechamentoRange.inicio.getDate() + offset);
      return date;
    });
  }, [fechamentoRange]);

  function resetColaboradorForm() {
    setEditingColaborador(null);
    setColaboradorForm({
      nome: "",
      matricula: "",
      email: "",
      cargo: "",
      telefone: "",
      equipeId: String(data.equipes[0]?.id ?? 1),
      subestacaoId: String(data.subestacoes[0]?.id ?? ""),
      usuarioId: "",
      ativo: "true",
    });
  }

  function editColaborador(colaborador: ColaboradorSobreaviso) {
    setEditingColaborador(colaborador);
    setColaboradorForm({
      nome: colaborador.nome,
      matricula: colaborador.matricula,
      email: colaborador.email,
      cargo: colaborador.cargo,
      telefone: colaborador.telefone ?? "",
      equipeId: String(colaborador.equipeId),
      subestacaoId: colaborador.subestacaoId ? String(colaborador.subestacaoId) : "",
      usuarioId: colaborador.usuarioId ? String(colaborador.usuarioId) : "",
      ativo: String(colaborador.ativo),
    });
  }

  function editSobreaviso(sobreaviso: Sobreaviso) {
    setEditingSobreaviso(sobreaviso);
    setSobreavisoForm({
      colaboradorId: String(sobreaviso.colaboradorId),
      inicio: sobreaviso.inicio,
      fim: sobreaviso.fim,
      status: sobreaviso.status,
      origem: sobreaviso.origem,
      justificativa: sobreaviso.justificativa ?? "",
    });
    setActiveTab("escala");
  }

  function resetSobreavisoForm() {
    setEditingSobreaviso(null);
    setSobreavisoForm({
      colaboradorId: String(data.colaboradores[0]?.id ?? 1),
      inicio: `${dateInput(new Date())}T18:00`,
      fim: `${dateInput(new Date(Date.now() + 86_400_000))}T06:00`,
      status: "PENDENTE",
      origem: "GESTOR",
      justificativa: "",
    });
  }

  async function submitColaborador(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await salvarColaborador(
      {
        id: editingColaborador?.id,
        nome: colaboradorForm.nome,
        matricula: colaboradorForm.matricula,
        email: colaboradorForm.email,
        cargo: colaboradorForm.cargo,
        telefone: colaboradorForm.telefone,
        equipeId: Number(colaboradorForm.equipeId),
        subestacaoId: colaboradorForm.subestacaoId ? Number(colaboradorForm.subestacaoId) : null,
        usuarioId: colaboradorForm.usuarioId ? Number(colaboradorForm.usuarioId) : null,
        ativo: colaboradorForm.ativo === "true",
      },
      usuarioNome
    );
    setData(result);
    resetColaboradorForm();
    toast.success("Colaborador salvo.");
  }

  async function submitSobreaviso(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await salvarSobreaviso(
        {
          id: editingSobreaviso?.id,
          colaboradorId: Number(sobreavisoForm.colaboradorId),
          inicio: sobreavisoForm.inicio,
          fim: sobreavisoForm.fim,
          status: sobreavisoForm.status,
          origem: sobreavisoForm.origem,
          justificativa: sobreavisoForm.justificativa,
          atualizadoPor: usuarioNome,
          atualizadoEm: new Date().toISOString(),
        },
        usuarioNome
      );
      setData(result);
      resetSobreavisoForm();
      toast.success("Sobreaviso salvo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar.");
    }
  }

  async function changeStatus(id: number, status: SobreavisoStatus) {
    const result = await alterarStatusSobreaviso(id, status, usuarioNome, sobreavisoForm.justificativa);
    setData(result);
    toast.success(`Sobreaviso ${status.toLowerCase()}.`);
  }

  async function submitAjuste(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await salvarSolicitacaoAjuste(
        {
          sobreavisoId: Number(ajusteForm.sobreavisoId),
          solicitadoPor: usuarioNome,
          inicioSolicitado: ajusteForm.inicioSolicitado,
          fimSolicitado: ajusteForm.fimSolicitado,
          justificativa: ajusteForm.justificativa,
        },
        usuarioNome
      );
      setData(result);
      setAjusteForm({ sobreavisoId: "", inicioSolicitado: "", fimSolicitado: "", justificativa: "" });
      toast.success("Solicitacao registrada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel solicitar ajuste.");
    }
  }

  async function avaliarAjuste(id: number, status: "APROVADA" | "REPROVADA") {
    const result = await avaliarSolicitacaoAjuste(id, status, usuarioNome);
    setData(result);
    toast.success(`Solicitacao ${status.toLowerCase()}.`);
  }

  async function exportarRelatorioFolhaPonto() {
    if (!relatorioColaboradorId) {
      toast.error("Selecione um colaborador para exportar.");
      return;
    }

    try {
      await exportarFolhaPontoSobreaviso(
        Number(relatorioColaboradorId),
        fechamentoRange.inicioApi,
        fechamentoRange.fimApi
      );
      toast.success("Relatorio exportado.");
    } catch {
      toast.error("Nao foi possivel exportar o relatorio.");
    }
  }

  const renderFilters = () => (
    <Toolbar>
      <FieldGroup>
        <Input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} title="Competencia da folha" />
        <Select value={selectedEquipe} onChange={(event) => setSelectedEquipe(event.target.value)}>
          <option value="">Todas as equipes</option>
          {data.equipes.map((equipe) => (
            <option key={equipe.id} value={equipe.id}>
              {equipe.nome}
            </option>
          ))}
        </Select>
        <Select value={selectedSubestacao} onChange={(event) => setSelectedSubestacao(event.target.value)}>
          <option value="">Todas as subestacoes</option>
          {data.subestacoes.map((subestacao) => (
            <option key={subestacao.id} value={subestacao.id}>
              {subestacao.nome}
            </option>
          ))}
        </Select>
        <Select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
          <option value="">Todos os status</option>
          <option value="PLANEJADO">Planejado</option>
          <option value="PENDENTE">Pendente</option>
          <option value="APROVADO">Aprovado</option>
          <option value="REPROVADO">Reprovado</option>
          <option value="CANCELADO">Cancelado</option>
        </Select>
        <Select value={selectedColaborador} onChange={(event) => setSelectedColaborador(event.target.value)}>
          <option value="">Todos os colaboradores</option>
          {data.colaboradores.map((colaborador) => (
            <option key={colaborador.id} value={colaborador.id}>
              {colaborador.nome} - {colaborador.matricula}
            </option>
          ))}
        </Select>
      </FieldGroup>
      <span style={{ color: "#475569", fontSize: 13, fontWeight: 700 }}>
        Fechamento: {fechamentoRange.label}
      </span>
      <Button type="button" variant="outline" onClick={carregar}>
        <RefreshCcw />
        Atualizar
      </Button>
    </Toolbar>
  );

  const renderTabelaSobreavisos = (items: Sobreaviso[]) => (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <th>Colaborador</th>
            <th>Equipe</th>
            <th>Inicio</th>
            <th>Fim</th>
            <th>Horas</th>
            <th>Status</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const colaborador = colaboradorById[item.colaboradorId];
            return (
              <tr key={item.id}>
                <td>
                  <strong>{colaborador?.nome ?? "Colaborador removido"}</strong>
                  <br />
                  <small>{colaborador?.matricula}</small>
                </td>
                <td>{colaborador ? equipeNome(data.equipes, colaborador.equipeId) : "-"}</td>
                <td>{formatDateTime(item.inicio)}</td>
                <td>{formatDateTime(item.fim)}</td>
                <td>{item.totalHoras.toFixed(2)}h</td>
                <td>
                  <StatusPill $status={item.status}>{item.status}</StatusPill>
                </td>
                <td>
                  <Actions>
                    <Button type="button" size="sm" variant="outline" onClick={() => editSobreaviso(item)}>
                      Editar
                    </Button>
                    {item.status !== "APROVADO" && (
                      <Button type="button" size="sm" onClick={() => changeStatus(item.id, "APROVADO")}>
                        Aprovar
                      </Button>
                    )}
                    {item.status !== "CANCELADO" && (
                      <Button type="button" size="sm" variant="destructive" onClick={() => changeStatus(item.id, "CANCELADO")}>
                        Cancelar
                      </Button>
                    )}
                  </Actions>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableWrap>
  );

  const renderCalendario = () => (
    <>
      {renderFilters()}
      <Panel>
        <PanelHeader>
          <h2>
            <CalendarDays size={18} />
            Calendario da competencia
          </h2>
          <span>{fechamentoRange.label}</span>
        </PanelHeader>
        <CalendarGrid>
          {calendarDays.map((day, index) => {
            const dayKey = day ? dateInput(day) : "";
            const events = day ? filteredSobreavisos.filter((item) => sobreavisoAtingeDia(item, day)) : [];
            return (
              <DayCell key={`${dayKey}-${index}`}>
                <DayNumber>{day ? day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}</DayNumber>
                {events.map((item) => {
                  const colaborador = colaboradorById[item.colaboradorId];
                  const horasDia = day ? horasNoDia(item, day) : 0;
                  return (
                    <EventCard key={item.id} type="button" onClick={() => editSobreaviso(item)}>
                      <strong>{colaborador?.nome ?? "Sem colaborador"}</strong>
                      <small>{horasDia.toFixed(2)}h - {item.status}</small>
                    </EventCard>
                  );
                })}
              </DayCell>
            );
          })}
        </CalendarGrid>
      </Panel>
    </>
  );

  const renderColaboradores = () => (
    <Grid>
      <Panel>
        <PanelHeader>
          <h2>
            <Users size={18} />
            Colaboradores
          </h2>
          <span>{data.colaboradores.length} cadastrados</span>
        </PanelHeader>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Matricula</th>
                <th>Equipe</th>
                <th>Subestacao</th>
                <th>Cargo</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {data.colaboradores.map((colaborador) => (
                <tr key={colaborador.id}>
                  <td>
                    <strong>{colaborador.nome}</strong>
                    <br />
                    <small>{colaborador.email}</small>
                  </td>
                  <td>{colaborador.matricula}</td>
                  <td>{equipeNome(data.equipes, colaborador.equipeId)}</td>
                  <td>{data.subestacoes.find((sub) => sub.id === colaborador.subestacaoId)?.nome ?? "Sem preferencia"}</td>
                  <td>{colaborador.cargo}</td>
                  <td>{colaborador.ativo ? "Ativo" : "Inativo"}</td>
                  <td>
                    <Button type="button" size="sm" variant="outline" onClick={() => editColaborador(colaborador)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>
      <Panel>
        <PanelHeader>
          <h2>
            <UserRound size={18} />
            {editingColaborador ? "Editar colaborador" : "Novo colaborador"}
          </h2>
          <Button type="button" size="sm" variant="outline" onClick={resetColaboradorForm}>
            <Plus />
            Novo
          </Button>
        </PanelHeader>
        <PanelBody>
          <form onSubmit={submitColaborador}>
            <FormGrid>
              <label>
                Nome
                <Input required value={colaboradorForm.nome} onChange={(event) => setColaboradorForm((prev) => ({ ...prev, nome: event.target.value }))} />
              </label>
              <label>
                Matricula
                <Input required value={colaboradorForm.matricula} onChange={(event) => setColaboradorForm((prev) => ({ ...prev, matricula: event.target.value }))} />
              </label>
              <label>
                Email
                <Input required type="email" value={colaboradorForm.email} onChange={(event) => setColaboradorForm((prev) => ({ ...prev, email: event.target.value }))} />
              </label>
              <label>
                Cargo
                <Input required value={colaboradorForm.cargo} onChange={(event) => setColaboradorForm((prev) => ({ ...prev, cargo: event.target.value }))} />
              </label>
              <label>
                Telefone
                <Input value={colaboradorForm.telefone} onChange={(event) => setColaboradorForm((prev) => ({ ...prev, telefone: event.target.value }))} />
              </label>
              <label>
                Equipe
                <Select value={colaboradorForm.equipeId} onChange={(event) => setColaboradorForm((prev) => ({ ...prev, equipeId: event.target.value }))}>
                  {data.equipes.map((equipe) => (
                    <option key={equipe.id} value={equipe.id}>
                      {equipe.nome}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Subestacao preferencial
                <Select value={colaboradorForm.subestacaoId} onChange={(event) => setColaboradorForm((prev) => ({ ...prev, subestacaoId: event.target.value }))}>
                  <option value="">Sem preferencia</option>
                  {data.subestacoes.map((subestacao) => (
                    <option key={subestacao.id} value={subestacao.id}>
                      {subestacao.nome}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Status
                <Select value={colaboradorForm.ativo} onChange={(event) => setColaboradorForm((prev) => ({ ...prev, ativo: event.target.value }))}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </Select>
              </label>
              <div className="full">
                <Button type="submit">
                  <Save />
                  Salvar colaborador
                </Button>
              </div>
            </FormGrid>
          </form>
        </PanelBody>
      </Panel>
    </Grid>
  );

  const renderEscala = () => (
    <Grid>
      <Panel>
        <PanelHeader>
          <h2>
            <Clock3 size={18} />
            Escala de sobreaviso
          </h2>
          <span>{filteredSobreavisos.length} registros no filtro</span>
        </PanelHeader>
        {renderTabelaSobreavisos(filteredSobreavisos)}
      </Panel>
      <Panel>
        <PanelHeader>
          <h2>
            <ShieldCheck size={18} />
            {editingSobreaviso ? "Editar periodo" : "Novo periodo"}
          </h2>
          <Button type="button" size="sm" variant="outline" onClick={resetSobreavisoForm}>
            <Plus />
            Novo
          </Button>
        </PanelHeader>
        <PanelBody>
          <form onSubmit={submitSobreaviso}>
            <FormGrid>
              <label className="full">
                Colaborador
                <Select required value={sobreavisoForm.colaboradorId} onChange={(event) => setSobreavisoForm((prev) => ({ ...prev, colaboradorId: event.target.value }))}>
                  {data.colaboradores.filter((item) => item.ativo).map((colaborador) => (
                    <option key={colaborador.id} value={colaborador.id}>
                      {colaborador.nome} - {equipeNome(data.equipes, colaborador.equipeId)}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Inicio
                <Input required type="datetime-local" value={sobreavisoForm.inicio} onChange={(event) => setSobreavisoForm((prev) => ({ ...prev, inicio: event.target.value }))} />
              </label>
              <label>
                Fim
                <Input required type="datetime-local" value={sobreavisoForm.fim} onChange={(event) => setSobreavisoForm((prev) => ({ ...prev, fim: event.target.value }))} />
              </label>
              <label>
                Total calculado
                <Input readOnly value={`${calcularHoras(sobreavisoForm.inicio, sobreavisoForm.fim).toFixed(2)} horas`} />
              </label>
              <label>
                Status
                <Select value={sobreavisoForm.status} onChange={(event) => setSobreavisoForm((prev) => ({ ...prev, status: event.target.value as SobreavisoStatus }))}>
                  <option value="PLANEJADO">Planejado</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="APROVADO">Aprovado</option>
                  <option value="REPROVADO">Reprovado</option>
                  <option value="CANCELADO">Cancelado</option>
                </Select>
              </label>
              <label className="full">
                Justificativa
                <Textarea value={sobreavisoForm.justificativa} onChange={(event) => setSobreavisoForm((prev) => ({ ...prev, justificativa: event.target.value }))} />
              </label>
              <div className="full">
                <Button type="submit">
                  <Save />
                  Salvar sobreaviso
                </Button>
              </div>
            </FormGrid>
          </form>
        </PanelBody>
      </Panel>
    </Grid>
  );

  const renderAprovacao = () => {
    const pendentes = data.sobreavisos.filter((item) => item.status === "PENDENTE");
    const solicitacoesPendentes = data.solicitacoes.filter((item) => item.status === "PENDENTE");

    return (
      <Grid>
        <Panel>
          <PanelHeader>
            <h2>
              <ShieldCheck size={18} />
              Aprovacoes pendentes
            </h2>
            <span>{pendentes.length + solicitacoesPendentes.length} itens</span>
          </PanelHeader>
          {pendentes.length ? renderTabelaSobreavisos(pendentes) : <Empty>Nenhum sobreaviso pendente.</Empty>}
          <PanelBody>
            <h3 style={{ margin: 0, fontSize: 15, color: "#0f172a" }}>Solicitacoes de ajuste</h3>
            {solicitacoesPendentes.map((solicitacao) => {
              const sobreaviso = data.sobreavisos.find((item) => item.id === solicitacao.sobreavisoId);
              const colaborador = sobreaviso ? colaboradorById[sobreaviso.colaboradorId] : undefined;
              return (
                <div key={solicitacao.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
                  <strong>{colaborador?.nome ?? "Colaborador nao encontrado"}</strong>
                  <p style={{ margin: "6px 0", color: "#475569", fontSize: 13 }}>
                    {formatDateTime(solicitacao.inicioSolicitado)} ate {formatDateTime(solicitacao.fimSolicitado)}
                  </p>
                  <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 13 }}>{solicitacao.justificativa}</p>
                  <Actions>
                    <Button type="button" size="sm" onClick={() => avaliarAjuste(solicitacao.id, "APROVADA")}>
                      <CheckCircle2 />
                      Aprovar
                    </Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => avaliarAjuste(solicitacao.id, "REPROVADA")}>
                      <XCircle />
                      Reprovar
                    </Button>
                  </Actions>
                </div>
              );
            })}
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader>
            <h2>
              <RefreshCcw size={18} />
              Solicitar ajuste
            </h2>
          </PanelHeader>
          <PanelBody>
            <form onSubmit={submitAjuste}>
              <FormGrid>
                <label className="full">
                  Sobreaviso
                  <Select required value={ajusteForm.sobreavisoId} onChange={(event) => setAjusteForm((prev) => ({ ...prev, sobreavisoId: event.target.value }))}>
                    <option value="">Selecione</option>
                    {data.sobreavisos.map((item) => (
                      <option key={item.id} value={item.id}>
                        {colaboradorById[item.colaboradorId]?.nome} - {formatDateTime(item.inicio)}
                      </option>
                    ))}
                  </Select>
                </label>
                <label>
                  Novo inicio
                  <Input required type="datetime-local" value={ajusteForm.inicioSolicitado} onChange={(event) => setAjusteForm((prev) => ({ ...prev, inicioSolicitado: event.target.value }))} />
                </label>
                <label>
                  Novo fim
                  <Input required type="datetime-local" value={ajusteForm.fimSolicitado} onChange={(event) => setAjusteForm((prev) => ({ ...prev, fimSolicitado: event.target.value }))} />
                </label>
                <label className="full">
                  Justificativa
                  <Textarea required value={ajusteForm.justificativa} onChange={(event) => setAjusteForm((prev) => ({ ...prev, justificativa: event.target.value }))} />
                </label>
                <div className="full">
                  <Button type="submit">
                    <Save />
                    Registrar solicitacao
                  </Button>
                </div>
              </FormGrid>
            </form>
          </PanelBody>
        </Panel>
      </Grid>
    );
  };

  const renderRelatorios = () => (
    <Grid $columns="1fr">
      <Panel>
        <PanelHeader>
          <h2>
            <FileBarChart size={18} />
            Relatorio consolidado
          </h2>
          <Actions>
            <Select value={relatorioColaboradorId} onChange={(event) => setRelatorioColaboradorId(event.target.value)}>
              {data.colaboradores.map((colaborador) => (
                <option key={colaborador.id} value={colaborador.id}>
                  {colaborador.nome}
                </option>
              ))}
            </Select>
            <Button type="button" onClick={exportarRelatorioFolhaPonto}>
              <Download />
              Exportar folha
            </Button>
          </Actions>
        </PanelHeader>
        {renderFilters()}
        {renderTabelaSobreavisos(filteredSobreavisos)}
      </Panel>
    </Grid>
  );

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
          <h1>Gestao de Sobreaviso</h1>
          <p>Controle de escalas, horas, aprovacoes, ajustes e relatorios de colaboradores.</p>
        </div>
        <Button type="button" onClick={() => setActiveTab("escala")}>
          <Plus />
          Novo sobreaviso
        </Button>
      </Header>

      <Tabs>
        {tabs.map((tab) => (
          <TabButton key={tab.id} type="button" $active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </TabButton>
        ))}
      </Tabs>

      {activeTab === "calendario" && renderCalendario()}
      {activeTab === "colaboradores" && renderColaboradores()}
      {activeTab === "escala" && renderEscala()}
      {activeTab === "aprovacao" && renderAprovacao()}
      {activeTab === "relatorios" && renderRelatorios()}
    </Page>
  );
}
