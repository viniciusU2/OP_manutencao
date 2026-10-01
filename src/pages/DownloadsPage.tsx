import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Download, FileSpreadsheet, FileText, Filter, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import Container from "../components/Container";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

type Documento = "operacionais" | "os" | "si" | "ss" | "ativos" | "inspecoes" | "auditoria_semanal";

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
  { id: "inspecoes" as Documento, titulo: "Inspeções", descricao: "Inspeções e resultados detalhados por item." },
  {
    id: "auditoria_semanal" as Documento,
    titulo: "Auditoria semanal",
    descricao: "Indicadores, vencimentos e execução em PDF.",
  },
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
const statusInspecao = ["OK", "NOK", "NA"];

function nomeArquivo(documento: Documento) {
  const data = new Date().toISOString().slice(0, 10);
  return documento === "auditoria_semanal"
    ? `auditoria_semanal_${data}.pdf`
    : `${documento}_${data}.xlsx`;
}

function semanaAtual() {
  const hoje = new Date();
  const dia = hoje.getDay();
  const deslocamento = dia === 0 ? -6 : 1 - dia;
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() + deslocamento);
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  const dataInput = (valor: Date) => {
    const local = new Date(valor.getTime() - valor.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };
  return { inicio: dataInput(inicio), fim: dataInput(fim) };
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

  useEffect(() => {
    if (documento !== "auditoria_semanal") return;
    setFiltros((prev) => {
      if (prev.data_inicio || prev.data_fim) return prev;
      const semana = semanaAtual();
      return { ...prev, data_inicio: semana.inicio, data_fim: semana.fim };
    });
  }, [documento]);

  const opcoesStatus = useMemo(() => {
    if (documento === "ativos") return statusAtivo;
    if (documento === "inspecoes") return statusInspecao;
    return statusOperacional;
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

    if (documento !== "auditoria_semanal" && filtros.status !== "all") params.status = filtros.status;
    if (filtros.id_subestacao !== "all") params.id_subestacao = filtros.id_subestacao;
    if (filtros.data_inicio) params.data_inicio = documento === "auditoria_semanal" ? filtros.data_inicio : `${filtros.data_inicio}T00:00:00`;
    if (filtros.data_fim) params.data_fim = documento === "auditoria_semanal" ? filtros.data_fim : `${filtros.data_fim}T23:59:59`;

    if (documento === "ativos" || documento === "inspecoes") {
      if (filtros.id_tipo_ativo !== "all") {
        params.id_tipo_ativo = filtros.id_tipo_ativo;
      }
    } else if (documento !== "operacionais") {
      params.documento = documento;
    }

    return params;
  }

  async function baixarArquivo() {
    const endpoint = documento === "auditoria_semanal"
      ? "/downloads/auditoria-semanal"
      : documento === "ativos"
      ? "/downloads/ativos"
      : documento === "inspecoes"
        ? "/downloads/inspecoes"
        : "/downloads/operacionais";

    setLoading(true);
    try {
      const response = await api.get(endpoint, {
        params: paramsDownload(),
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: documento === "auditoria_semanal"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", nomeArquivo(documento));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(documento === "auditoria_semanal" ? "Relatório PDF gerado" : "Download iniciado");
    } catch {
      toast.error(documento === "auditoria_semanal" ? "Erro ao gerar relatório PDF" : "Erro ao baixar planilha");
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
          {documento === "auditoria_semanal" ? "Período aplicado ao relatório PDF" : "Filtros aplicados diretamente na planilha"}
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
            {item.id === "auditoria_semanal" ? <FileText size={18} /> : <FileSpreadsheet size={18} />}
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
            {documento !== "auditoria_semanal" && <Field>
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
            </Field>}

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

            {(documento === "ativos" || documento === "inspecoes") && (
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
              {loading ? "Gerando..." : documento === "auditoria_semanal" ? "Baixar relatório PDF" : "Baixar planilha"}
            </Button>
          </Actions>
        </CardContent>
      </Card>

    </Container>
  );
}
