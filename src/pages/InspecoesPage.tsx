import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { toast } from "sonner";
import { Eye, Pencil, Trash2, X, WandSparkles } from "lucide-react";

import api from "../api/api";
import Container from "../components/Container";
import { Button } from "../components/ui/button";

interface Inspecao {
  id_inspecao: number;
  id_ativo: number;
  id_subestacao?: number | null;
  data_inspecao: string;
  periodicidade: string;
  responsavel?: string;
  observacao_geral?: string;
  status_geral: "OK" | "NOK" | "NA" | "PENDENTE";
  id_os?: number | null;
  numero_os?: string | null;
  numero_apr?: string | null;
  codigo_ativo?: string;
  fase?: string;
  bay?: string;
  instalacao?: string;
  tipo_ativo?: string;
}

interface Subestacao {
  id_subestacao: number;
  nome: string;
}

interface TipoAtivo {
  id_tipo_ativo: number;
  nome: string;
}

interface PrepararResponse {
  id_subestacao: number;
  id_tipo_ativo: number;
  os_encontradas: number;
  inspecoes_criadas: unknown[];
  inspecoes_existentes: unknown[];
  os_sem_periodicidade: unknown[];
}

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;

  @media (max-width: 720px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 720px) {
    > * {
      flex: 1;
    }
  }
`;

const FilterCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 220px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
`;

const Select = styled.select`
  min-width: 170px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const Table = styled.table`
  width: 100%;
  min-width: 920px;
  border-collapse: collapse;

  th,
  td {
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
    font-size: 14px;
  }

  th {
    color: #475569;
    font-size: 12px;
    text-transform: uppercase;
    background: #f8fafc;
  }
`;

const Badge = styled.span<{ $status: string }>`
  display: inline-flex;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  background: ${({ $status }) =>
    $status === "NOK"
      ? "#fee2e2"
      : $status === "OK"
        ? "#dcfce7"
        : $status === "PENDENTE"
          ? "#fef3c7"
          : "#e5e7eb"};
  color: ${({ $status }) =>
    $status === "NOK"
      ? "#991b1b"
      : $status === "OK"
        ? "#166534"
        : $status === "PENDENTE"
          ? "#92400e"
          : "#334155"};
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #0f172a;
  background: white;
`;

const DeleteButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #b91c1c;
  background: #fff;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.48);
`;

const ModalCard = styled.div`
  width: min(100%, 480px);
  border-radius: 12px;
  background: white;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid #e5e7eb;

  h3 {
    margin: 0;
    font-size: 18px;
    color: #0f172a;
  }
`;

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #475569;
  cursor: pointer;

  &:hover {
    background: #f1f5f9;
  }
`;

const ModalBody = styled.div`
  display: grid;
  gap: 14px;
  padding: 20px;
`;

const Field = styled.label`
  display: grid;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;

  &:focus {
    border-color: #64748b;
  }
`;

const ModalSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  outline: none;

  &:focus {
    border-color: #64748b;
  }
`;

const ModalHint = styled.p`
  margin: -4px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: #64748b;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
`;

const SecondaryButton = styled.button`
  padding: 9px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  color: #334155;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

function formatarData(data?: string) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InspecoesPage() {
  const navigate = useNavigate();
  const [inspecoes, setInspecoes] = useState<Inspecao[]>([]);
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subestacao, setSubestacao] = useState("all");
  const [status, setStatus] = useState("all");
  const [periodicidade, setPeriodicidade] = useState("all");

  const [modalPrepararAberto, setModalPrepararAberto] = useState(false);
  const [preparando, setPreparando] = useState(false);
  const [prepararSubestacao, setPrepararSubestacao] = useState("");
  const [prepararTipoAtivo, setPrepararTipoAtivo] = useState("");
  const [prepararPeriodicidade, setPrepararPeriodicidade] = useState("");
  const [prepararResponsavel, setPrepararResponsavel] = useState("");

  async function carregar() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (subestacao !== "all") params.id_subestacao = subestacao;
      if (status !== "all") params.status = status;
      if (periodicidade !== "all") params.periodicidade = periodicidade;

      const { data } = await api.get("/inspecoes", { params });
      setInspecoes(data);
    } catch {
      toast.error("Erro ao carregar inspeções");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api
      .get("/subestacao/ativas")
      .then((res) => setSubestacoes(res.data))
      .catch(() => toast.error("Erro ao carregar subestações"));

    // Se o endpoint de tipos de ativo tiver outro nome no backend,
    // ajuste somente esta URL.
    api
      .get("/tipo-ativo")
      .then((res) => setTiposAtivo(res.data))
      .catch(() => toast.error("Erro ao carregar tipos de ativo"));
  }, []);

  useEffect(() => {
    carregar();
  }, [subestacao, status, periodicidade]);

  useEffect(() => {
    if (!modalPrepararAberto) return;

    if (!prepararSubestacao) {
      setPrepararSubestacao(
        subestacao !== "all"
          ? subestacao
          : subestacoes[0]
            ? String(subestacoes[0].id_subestacao)
            : ""
      );
    }
  }, [modalPrepararAberto, prepararSubestacao, subestacao, subestacoes]);

  async function prepararInspecoes() {
    if (!prepararSubestacao) {
      toast.error("Selecione a subestação");
      return;
    }

    if (!prepararTipoAtivo) {
      toast.error("Selecione o tipo de ativo");
      return;
    }

    setPreparando(true);

    try {
      const params: Record<string, string | number> = {
        id_subestacao: Number(prepararSubestacao),
        id_tipo_ativo: Number(prepararTipoAtivo),
      };

      if (prepararPeriodicidade) {
        params.periodicidade = prepararPeriodicidade;
      }

      if (prepararResponsavel.trim()) {
        params.responsavel = prepararResponsavel.trim();
      }

      const { data } = await api.post<PrepararResponse>(
        "/inspecoes/preparar-os-em-execucao",
        null,
        { params }
      );

      const criadas = data.inspecoes_criadas?.length ?? 0;
      const existentes = data.inspecoes_existentes?.length ?? 0;
      const semPeriodicidade = data.os_sem_periodicidade?.length ?? 0;

      if (data.os_encontradas === 0) {
        toast.info("Nenhuma OS em execução encontrada para os filtros informados");
      } else if (criadas > 0) {
        toast.success(
          `${criadas} inspeção(ões) criada(s). ${existentes} já existia(m).`
        );
      } else {
        toast.info(`${existentes} inspeção(ões) já existia(m). Nenhuma nova foi criada.`);
      }

      if (semPeriodicidade > 0) {
        toast.warning(
          `${semPeriodicidade} OS não pôde/puderam ser preparada(s) por falta de periodicidade.`
        );
      }

      setModalPrepararAberto(false);
      await carregar();
    } catch (error: any) {
      const detalhe = error?.response?.data?.detail;
      toast.error(
        typeof detalhe === "string"
          ? detalhe
          : "Erro ao preparar inspeções das OS em execução"
      );
    } finally {
      setPreparando(false);
    }
  }

  async function excluir(inspecao: Inspecao) {
    if (!confirm(`Deseja excluir a inspeção #${inspecao.id_inspecao}?`)) return;

    try {
      await api.delete(`/inspecoes/${inspecao.id_inspecao}`);
      setInspecoes((prev) =>
        prev.filter((item) => item.id_inspecao !== inspecao.id_inspecao)
      );
      toast.success("Inspeção excluída");
    } catch {
      toast.error("Erro ao excluir inspeção");
    }
  }

  const filtradas = useMemo(() => {
    const termo = search.trim().toLowerCase();
    return inspecoes.filter((inspecao) => {
      const matchSearch =
        !termo ||
        String(inspecao.id_inspecao).includes(termo) ||
        (inspecao.codigo_ativo ?? "").toLowerCase().includes(termo) ||
        (inspecao.numero_os ?? "").toLowerCase().includes(termo) ||
        (inspecao.numero_apr ?? "").toLowerCase().includes(termo) ||
        (inspecao.instalacao ?? "").toLowerCase().includes(termo) ||
        (inspecao.responsavel ?? "").toLowerCase().includes(termo);

      const matchStatus = status === "all" || inspecao.status_geral === status;
      const matchPeriodicidade =
        periodicidade === "all" || inspecao.periodicidade === periodicidade;
      return matchSearch && matchStatus && matchPeriodicidade;
    });
  }, [inspecoes, periodicidade, search, status]);

  return (
    <Container>
      <Header>
        <h2>Inspeções</h2>
        <HeaderActions>
          <Button type="button" onClick={() => setModalPrepararAberto(true)}>
            <WandSparkles size={16} />
            Preparar por OS
          </Button>
          <Button onClick={() => navigate("/inspecoes/nova")}>+ Nova Inspeção</Button>
        </HeaderActions>
      </Header>

      <FilterCard>
        <SearchInput
          placeholder="Buscar por ativo, instalação, responsável ou número..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={subestacao} onChange={(e) => setSubestacao(e.target.value)}>
          <option value="all">Todas subestações</option>
          {subestacoes.map((item) => (
            <option key={item.id_subestacao} value={String(item.id_subestacao)}>
              {item.nome}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Todos status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="OK">OK</option>
          <option value="NOK">NOK</option>
          <option value="NA">N/A</option>
        </Select>
        <Select
          value={periodicidade}
          onChange={(e) => setPeriodicidade(e.target.value)}
        >
          <option value="all">Todas periodicidades</option>
          <option value="SEMANAL">Semanal</option>
          <option value="MENSAL">Mensal</option>
          <option value="BIMESTRAL">Bimestral</option>
          <option value="TRIMESTRAL">Trimestral</option>
          <option value="SEMESTRAL">Semestral</option>
          <option value="ANUAL">Anual</option>
          <option value="3_ANOS">3 anos</option>
          <option value="5_ANOS">5 anos</option>
          <option value="6_ANOS">6 anos</option>
        </Select>
      </FilterCard>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <th>#</th>
              <th>Data</th>
              <th>Ativo</th>
              <th>OS</th>
              <th>Instalação</th>
              <th>Tipo</th>
              <th>Periodicidade</th>
              <th>Responsável</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10}>Carregando...</td>
              </tr>
            ) : filtradas.length === 0 ? (
              <tr>
                <td colSpan={10}>Nenhuma inspeção encontrada.</td>
              </tr>
            ) : (
              filtradas.map((inspecao) => (
                <tr key={inspecao.id_inspecao}>
                  <td>{inspecao.id_inspecao}</td>
                  <td>{formatarData(inspecao.data_inspecao)}</td>
                  <td>
                    {inspecao.codigo_ativo || "-"}
                    <br />
                    <small>{[inspecao.fase, inspecao.bay].filter(Boolean).join(" - ")}</small>
                  </td>
                  <td>
                    {inspecao.id_os && inspecao.numero_os ? (
                      <Link className="text-blue-700 underline" to={`/os/${inspecao.id_os}`}>
                        {inspecao.numero_os}
                      </Link>
                    ) : (
                      "-"
                    )}
                    {inspecao.numero_apr && (
                      <>
                        <br />
                        <small>{inspecao.numero_apr}</small>
                      </>
                    )}
                  </td>
                  <td>{inspecao.instalacao || "-"}</td>
                  <td>{inspecao.tipo_ativo || "-"}</td>
                  <td>{inspecao.periodicidade}</td>
                  <td>{inspecao.responsavel || "-"}</td>
                  <td>
                    <Badge $status={inspecao.status_geral}>{inspecao.status_geral}</Badge>
                  </td>
                  <td>
                    <Actions>
                      <IconButton to={`/inspecoes/${inspecao.id_inspecao}`} title="Ver">
                        <Eye size={16} />
                      </IconButton>
                      <IconButton
                        to={`/inspecoes/${inspecao.id_inspecao}/editar`}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <DeleteButton
                        type="button"
                        title="Excluir"
                        onClick={() => excluir(inspecao)}
                      >
                        <Trash2 size={16} />
                      </DeleteButton>
                    </Actions>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableWrap>

      {modalPrepararAberto && (
        <ModalOverlay
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !preparando) {
              setModalPrepararAberto(false);
            }
          }}
        >
          <ModalCard role="dialog" aria-modal="true" aria-labelledby="titulo-preparar-os">
            <ModalHeader>
              <h3 id="titulo-preparar-os">Preparar inspeções por OS</h3>
              <CloseButton
                type="button"
                title="Fechar"
                disabled={preparando}
                onClick={() => setModalPrepararAberto(false)}
              >
                <X size={18} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <ModalHint>
                Serão consideradas apenas OS em execução. Inspeções que já existirem para a OS não serão duplicadas.
              </ModalHint>

              <Field>
                Subestação
                <ModalSelect
                  value={prepararSubestacao}
                  onChange={(e) => setPrepararSubestacao(e.target.value)}
                  disabled={preparando}
                >
                  <option value="">Selecione...</option>
                  {subestacoes.map((item) => (
                    <option key={item.id_subestacao} value={String(item.id_subestacao)}>
                      {item.nome}
                    </option>
                  ))}
                </ModalSelect>
              </Field>

              <Field>
                Tipo de ativo
                <ModalSelect
                  value={prepararTipoAtivo}
                  onChange={(e) => setPrepararTipoAtivo(e.target.value)}
                  disabled={preparando}
                >
                  <option value="">Selecione...</option>
                  {tiposAtivo.map((item) => (
                    <option key={item.id_tipo_ativo} value={String(item.id_tipo_ativo)}>
                      {item.nome}
                    </option>
                  ))}
                </ModalSelect>
              </Field>

              <Field>
                Periodicidade
                <ModalSelect
                  value={prepararPeriodicidade}
                  onChange={(e) => setPrepararPeriodicidade(e.target.value)}
                  disabled={preparando}
                >
                  <option value="">Automática pela OS</option>
                  <option value="SEMANAL">Semanal</option>
                  <option value="MENSAL">Mensal</option>
                  <option value="BIMESTRAL">Bimestral</option>
                  <option value="TRIMESTRAL">Trimestral</option>
                  <option value="SEMESTRAL">Semestral</option>
                  <option value="ANUAL">Anual</option>
                  <option value="3_ANOS">3 anos</option>
                  <option value="5_ANOS">5 anos</option>
                  <option value="6_ANOS">6 anos</option>
                </ModalSelect>
              </Field>

              <Field>
                Responsável
                <ModalInput
                  type="text"
                  placeholder="Opcional — usa o responsável da OS se vazio"
                  value={prepararResponsavel}
                  onChange={(e) => setPrepararResponsavel(e.target.value)}
                  disabled={preparando}
                />
              </Field>
            </ModalBody>

            <ModalFooter>
              <SecondaryButton
                type="button"
                disabled={preparando}
                onClick={() => setModalPrepararAberto(false)}
              >
                Cancelar
              </SecondaryButton>
              <Button
                type="button"
                disabled={preparando || !prepararSubestacao || !prepararTipoAtivo}
                onClick={prepararInspecoes}
              >
                {preparando ? "Preparando..." : "Preparar inspeções"}
              </Button>
            </ModalFooter>
          </ModalCard>
        </ModalOverlay>
      )}
    </Container>
  );
}