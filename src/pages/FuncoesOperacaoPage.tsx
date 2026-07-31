import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import Container from "../components/Container";
import {
  atualizarFuncaoOperacao,
  criarFuncaoOperacao,
  excluirFuncaoOperacao,
  listarAtivosDaFuncaoOperacao,
  listarFuncoesOperacao,
} from "../services/funcaoOperacaoService";
import type {
  FuncaoOperacao,
  FuncaoOperacaoAtivo,
  FuncaoOperacaoPayload,
} from "../types/FuncaoOperacao";
import type { Subestacao } from "../types/Subestacao";

const PageTitle = styled.div`
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  p {
    margin-top: 6px;
    color: #6b7280;
    font-size: 14px;
  }
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 18px;
`;

const FormGroup = styled.div<{ $invalid?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid ${({ $invalid }) => ($invalid ? "#ef4444" : "#d1d5db")};
    font-size: 14px;
    background: #ffffff;
    color: #111827;
  }

  textarea {
    min-height: 42px;
    resize: vertical;
  }
`;

const ErrorText = styled.span`
  color: #dc2626;
  font-size: 12px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" | "danger" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $variant }) =>
    $variant === "secondary"
      ? "#e5e7eb"
      : $variant === "danger"
      ? "#dc2626"
      : "#2563eb"};
  color: ${({ $variant }) => ($variant === "secondary" ? "#111827" : "#ffffff")};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 24px 0 16px;

  select {
    min-width: 260px;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
  }
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
    vertical-align: top;
    font-size: 14px;
  }

  th {
    color: #475569;
    font-weight: 700;
    background: #f8fafc;
  }
`;

const IconButton = styled.button<{ $tone?: "danger" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-right: 6px;
  border: 1px solid ${({ $tone }) => ($tone === "danger" ? "#fecaca" : "#cbd5e1")};
  border-radius: 6px;
  background: #ffffff;
  color: ${({ $tone }) => ($tone === "danger" ? "#dc2626" : "#1e40af")};
  cursor: pointer;
`;

const EmptyState = styled.div`
  padding: 22px;
  color: #64748b;
  text-align: center;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
`;

const Modal = styled.div`
  width: min(820px, 100%);
  max-height: 86vh;
  overflow: auto;
  background: #ffffff;
  border-radius: 10px;
  padding: 20px;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 18px;
  }
`;

type FormErrors = Partial<Record<keyof FuncaoOperacaoPayload, string>>;

const initialForm: FuncaoOperacaoPayload = {
  id_subestacao: 0,
  codigo: "",
  descricao: "",
};

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: unknown } } }).response;
    const detail = response?.data?.detail;

    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((item) => String(item)).join("; ");
    }
  }

  if (error instanceof Error) return error.message;
  return "Erro ao processar funcao de operacao.";
}

export default function FuncoesOperacaoPage() {
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [funcoes, setFuncoes] = useState<FuncaoOperacao[]>([]);
  const [form, setForm] = useState<FuncaoOperacaoPayload>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editing, setEditing] = useState<FuncaoOperacao | null>(null);
  const [filterSubestacao, setFilterSubestacao] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ativosModal, setAtivosModal] = useState<FuncaoOperacaoAtivo[] | null>(null);
  const [modalTitle, setModalTitle] = useState("");

  const selectedFilter = useMemo(() => {
    return filterSubestacao === "all" ? null : Number(filterSubestacao);
  }, [filterSubestacao]);

  async function carregarSubestacoes() {
    try {
      const response = await api.get<Subestacao[]>("/subestacao/ativas");
      setSubestacoes(response.data);
    } catch {
      toast.error("Erro ao carregar subestacoes.");
    }
  }

  const carregarFuncoes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarFuncoesOperacao(selectedFilter);
      setFuncoes(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    carregarSubestacoes();
  }, []);

  useEffect(() => {
    carregarFuncoes();
  }, [carregarFuncoes]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setForm((prev) => ({
      ...prev,
      [name]: name === "id_subestacao" ? Number(value) : value,
    }));
  }

  function validar() {
    const nextErrors: FormErrors = {};

    if (!form.id_subestacao) nextErrors.id_subestacao = "Selecione a subestacao.";
    if (!form.codigo.trim()) nextErrors.codigo = "Informe o codigo da FO.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function cancelarEdicao() {
    setEditing(null);
    setForm(initialForm);
    setErrors({});
  }

  async function salvar() {
    if (!validar()) {
      toast.error("Revise os campos obrigatorios.");
      return;
    }

    const payload: FuncaoOperacaoPayload = {
      id_subestacao: Number(form.id_subestacao),
      codigo: form.codigo.trim(),
      descricao: form.descricao?.trim() || null,
    };

    setSaving(true);
    try {
      if (editing) {
        await atualizarFuncaoOperacao(editing.id_funcao_operacao, payload);
        toast.success("Funcao de operacao atualizada com sucesso.");
      } else {
        await criarFuncaoOperacao(payload);
        toast.success("Funcao de operacao cadastrada com sucesso.");
      }
      cancelarEdicao();
      await carregarFuncoes();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function editar(funcaoOperacao: FuncaoOperacao) {
    setEditing(funcaoOperacao);
    setForm({
      id_subestacao: funcaoOperacao.id_subestacao,
      codigo: funcaoOperacao.codigo,
      descricao: funcaoOperacao.descricao ?? "",
    });
  }

  async function excluir(funcaoOperacao: FuncaoOperacao) {
    const confirmado = window.confirm(
      `Excluir a FO ${funcaoOperacao.codigo}? Esta acao nao pode ser desfeita.`
    );
    if (!confirmado) return;

    try {
      await excluirFuncaoOperacao(funcaoOperacao.id_funcao_operacao);
      toast.success("Funcao de operacao excluida com sucesso.");
      await carregarFuncoes();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function visualizarAtivos(funcaoOperacao: FuncaoOperacao) {
    try {
      const ativos = await listarAtivosDaFuncaoOperacao(funcaoOperacao.id_funcao_operacao);
      setAtivosModal(ativos);
      setModalTitle(`Ativos associados a ${funcaoOperacao.codigo}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Container>
      <PageTitle>
        <h2>Funções de Operação</h2>
        <p>Cadastro das FOs por subestações e vínculo com os ativos.</p>
      </PageTitle>

      <Card>
        <FormGrid>
          <FormGroup $invalid={!!errors.id_subestacao}>
            <label>Subestacao</label>
            <select name="id_subestacao" value={form.id_subestacao} onChange={handleChange}>
              <option value={0}>Selecione</option>
              {subestacoes.map((subestacao) => (
                <option key={subestacao.id_subestacao} value={subestacao.id_subestacao}>
                  {subestacao.nome}
                </option>
              ))}
            </select>
            {errors.id_subestacao && <ErrorText>{errors.id_subestacao}</ErrorText>}
          </FormGroup>

          <FormGroup $invalid={!!errors.codigo}>
            <label>Codigo da FO</label>
            <input
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              placeholder="Ex: 11P1"
            />
            {errors.codigo && <ErrorText>{errors.codigo}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <label>Descricao</label>
            <textarea
              name="descricao"
              value={form.descricao ?? ""}
              onChange={handleChange}
              placeholder="Descricao operacional"
            />
          </FormGroup>
        </FormGrid>

        <Actions>
          {editing && (
            <Button $variant="secondary" onClick={cancelarEdicao} disabled={saving}>
              Cancelar
            </Button>
          )}
          <Button onClick={salvar} disabled={saving}>
            <Plus size={16} />
            {saving ? "Salvando..." : editing ? "Salvar alteracoes" : "Salvar"}
          </Button>
        </Actions>
      </Card>

      <Toolbar>
        <strong>{loading ? "Carregando..." : `${funcoes.length} FO(s) cadastrada(s)`}</strong>
        <select value={filterSubestacao} onChange={(event) => setFilterSubestacao(event.target.value)}>
          <option value="all">Todas as subestacoes</option>
          {subestacoes.map((subestacao) => (
            <option key={subestacao.id_subestacao} value={subestacao.id_subestacao}>
              {subestacao.nome}
            </option>
          ))}
        </select>
      </Toolbar>

      <Card>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Descricao</th>
                <th>Subestacao</th>
                <th>Quantidade de ativos associados</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {funcoes.map((funcaoOperacao) => (
                <tr key={funcaoOperacao.id_funcao_operacao}>
                  <td>{funcaoOperacao.codigo}</td>
                  <td>{funcaoOperacao.descricao || "-"}</td>
                  <td>{funcaoOperacao.subestacao_nome || "-"}</td>
                  <td>{funcaoOperacao.quantidade_ativos ?? 0}</td>
                  <td>
                    <IconButton title="Editar" onClick={() => editar(funcaoOperacao)}>
                      <Pencil size={16} />
                    </IconButton>
                    <IconButton title="Excluir" $tone="danger" onClick={() => excluir(funcaoOperacao)}>
                      <Trash2 size={16} />
                    </IconButton>
                    <IconButton title="Visualizar ativos associados" onClick={() => visualizarAtivos(funcaoOperacao)}>
                      <Eye size={16} />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>

        {!loading && funcoes.length === 0 && <EmptyState>Nenhuma FO encontrada.</EmptyState>}
      </Card>

      {ativosModal && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>
              <h3>{modalTitle}</h3>
              <IconButton title="Fechar" onClick={() => setAtivosModal(null)}>
                <X size={16} />
              </IconButton>
            </ModalHeader>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Fabricante</th>
                    <th>Modelo</th>
                    <th>Bay</th>
                    <th>Fase</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ativosModal.map((ativo) => (
                    <tr key={ativo.id_ativo}>
                      <td>{ativo.codigo_ativo}</td>
                      <td>{ativo.fabricante || "-"}</td>
                      <td>{ativo.modelo || "-"}</td>
                      <td>{ativo.bay || "-"}</td>
                      <td>{ativo.fase || "-"}</td>
                      <td>{ativo.status || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
            {ativosModal.length === 0 && <EmptyState>Nenhum ativo associado.</EmptyState>}
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
}
