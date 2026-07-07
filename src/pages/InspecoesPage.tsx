import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { toast } from "sonner";
import { Eye, Pencil, Trash2 } from "lucide-react";

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
  status_geral: "OK" | "NOK" | "NA";
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
  background:
    ${({ $status }) =>
      $status === "NOK" ? "#fee2e2" : $status === "OK" ? "#dcfce7" : "#e5e7eb"};
  color:
    ${({ $status }) =>
      $status === "NOK" ? "#991b1b" : $status === "OK" ? "#166534" : "#334155"};
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subestacao, setSubestacao] = useState("all");
  const [status, setStatus] = useState("all");
  const [periodicidade, setPeriodicidade] = useState("all");

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
  }, []);

  useEffect(() => {
    carregar();
  }, [subestacao, status, periodicidade]);

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
  }, [inspecoes, periodicidade, search, status, subestacao]);

  return (
    <Container>
      <Header>
        <h2>Inspeções</h2>
        <Button onClick={() => navigate("/inspecoes/nova")}>+ Nova Inspeção</Button>
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
    </Container>
  );
}
