import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Download, FileSpreadsheet, Filter, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import Container from "../components/Container";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

type Documento = "operacionais" | "os" | "si" | "ss" | "ativos";

interface Subestacao {
  id_subestacao: number;
  nome: string;
}

interface TipoAtivo {
  id_tipo_ativo: number;
  nome: string;
}

const documentos = [
  {
    id: "operacionais" as Documento,
    titulo: "Operacionais",
    descricao: "OS, SI e SS em abas separadas.",
  },
  { id: "os" as Documento, titulo: "OS", descricao: "Ordens de serviço." },
  { id: "si" as Documento, titulo: "SI", descricao: "Solicitações de intervenção." },
  { id: "ss" as Documento, titulo: "SS", descricao: "Solicitações de serviço." },
  { id: "ativos" as Documento, titulo: "Ativos", descricao: "Cadastro de ativos." },
];

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 18px;

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const Title = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  color: #64748b;
  font-size: 14px;
`;

const DocumentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const DocumentButton = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#2563eb" : "#e2e8f0")};
  border-radius: 8px;
  background: ${({ $active }) => ($active ? "#eff6ff" : "#ffffff")};
  color: ${({ $active }) => ($active ? "#1d4ed8" : "#0f172a")};
  padding: 14px;
  text-align: left;
  cursor: pointer;

  strong {
    display: block;
    font-size: 14px;
  }

  span {
    color: #64748b;
    display: block;
    font-size: 12px;
    margin-top: 3px;
  }
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 6px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
`;

const Select = styled.select`
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  padding: 0 10px;
`;

const Input = styled.input`
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  padding: 0 10px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const Summary = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 13px;
`;

const statusOperacional = ["ABERTA", "PROGRAMADA", "EM_EXECUCAO", "ENCERRADA"];
const statusAtivo = ["OPERANTE", "ATIVO", "INATIVO", "MANUTENCAO", "DESATIVADO"];

function nomeArquivo(documento: Documento) {
  const data = new Date().toISOString().slice(0, 10);
  return `${documento}_${data}.xlsx`;
}

export default function DownloadsPage() {
  const [documento, setDocumento] = useState<Documento>("operacionais");
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    status: "all",
    id_subestacao: "all",
    id_tipo_ativo: "all",
    data_inicio: "",
    data_fim: "",
  });

  useEffect(() => {
    api
      .get("/subestacao/ativas")
      .then((res) => setSubestacoes(res.data))
      .catch(() => toast.error("Erro ao carregar instalações"));

    api
      .get("/tipos-ativos")
      .then((res) => setTiposAtivo(res.data))
      .catch(() => {
        api
          .get("/tipo-ativo")
          .then((res) => setTiposAtivo(res.data))
          .catch(() => setTiposAtivo([]));
      });
  }, []);

  const opcoesStatus = useMemo(() => {
    return documento === "ativos" ? statusAtivo : statusOperacional;
  }, [documento]);

  function atualizarFiltro(campo: keyof typeof filtros, valor: string) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function limparFiltros() {
    setFiltros({
      status: "all",
      id_subestacao: "all",
      id_tipo_ativo: "all",
      data_inicio: "",
      data_fim: "",
    });
  }

  function paramsDownload() {
    const params: Record<string, string> = {};

    if (filtros.status !== "all") params.status = filtros.status;
    if (filtros.id_subestacao !== "all") params.id_subestacao = filtros.id_subestacao;
    if (filtros.data_inicio) params.data_inicio = `${filtros.data_inicio}T00:00:00`;
    if (filtros.data_fim) params.data_fim = `${filtros.data_fim}T23:59:59`;

    if (documento === "ativos") {
      if (filtros.id_tipo_ativo !== "all") {
        params.id_tipo_ativo = filtros.id_tipo_ativo;
      }
    } else if (documento !== "operacionais") {
      params.documento = documento;
    }

    return params;
  }

  async function baixarArquivo() {
    const endpoint = documento === "ativos" ? "/downloads/ativos" : "/downloads/operacionais";

    setLoading(true);
    try {
      const response = await api.get(endpoint, {
        params: paramsDownload(),
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", nomeArquivo(documento));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Download iniciado");
    } catch {
      toast.error("Erro ao baixar planilha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <Header>
        <div>
          <Title>Downloads</Title>
          <Subtitle>Baixe documentos separados por tipo e com filtros aplicados.</Subtitle>
        </div>
        <Summary>
          <Filter size={16} />
          Filtros aplicados diretamente na planilha
        </Summary>
      </Header>

      <DocumentGrid>
        {documentos.map((item) => (
          <DocumentButton
            key={item.id}
            type="button"
            $active={documento === item.id}
            onClick={() => setDocumento(item.id)}
          >
            <FileSpreadsheet size={18} />
            <strong>{item.titulo}</strong>
            <span>{item.descricao}</span>
          </DocumentButton>
        ))}
      </DocumentGrid>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterGrid>
            <Field>
              Status
              <Select
                value={filtros.status}
                onChange={(e) => atualizarFiltro("status", e.target.value)}
              >
                <option value="all">Todos</option>
                {opcoesStatus.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              Instalação
              <Select
                value={filtros.id_subestacao}
                onChange={(e) => atualizarFiltro("id_subestacao", e.target.value)}
              >
                <option value="all">Todas</option>
                {subestacoes.map((subestacao) => (
                  <option key={subestacao.id_subestacao} value={subestacao.id_subestacao}>
                    {subestacao.nome}
                  </option>
                ))}
              </Select>
            </Field>

            {documento === "ativos" && (
              <Field>
                Tipo de ativo
                <Select
                  value={filtros.id_tipo_ativo}
                  onChange={(e) => atualizarFiltro("id_tipo_ativo", e.target.value)}
                >
                  <option value="all">Todos</option>
                  {tiposAtivo.map((tipo) => (
                    <option key={tipo.id_tipo_ativo} value={tipo.id_tipo_ativo}>
                      {tipo.nome}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <Field>
              Data inicial
              <Input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => atualizarFiltro("data_inicio", e.target.value)}
              />
            </Field>

            <Field>
              Data final
              <Input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => atualizarFiltro("data_fim", e.target.value)}
              />
            </Field>
          </FilterGrid>

          <Actions>
            <Button variant="outline" type="button" onClick={limparFiltros}>
              <RotateCcw size={16} />
              Limpar filtros
            </Button>
            <Button type="button" onClick={baixarArquivo} disabled={loading}>
              <Download size={16} />
              {loading ? "Gerando..." : "Baixar planilha"}
            </Button>
          </Actions>
        </CardContent>
      </Card>
    </Container>
  );
}
