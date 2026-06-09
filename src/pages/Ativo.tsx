import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { toast } from "sonner";

import api from "../api/api";
import type { Ativo } from "../types/Ativo";
import type { Subestacao } from "../types/Subestacao";
import type { TipoAtivo } from "../types/TipoAtivo";
import Container from "../components/Container";
import { AtivoPage1 } from "./Ativos-table";
import { useAuth } from "../context/AuthContext";
import { filtroInicialInstalacao } from "../lib/instalacaoPreferida";

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

  @media (max-width: 560px) {
    margin-bottom: 16px;

    h2 {
      font-size: 22px;
    }
  }
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);

  @media (max-width: 560px) {
    padding: 16px;
  }
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
  select {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid ${({ $invalid }) => ($invalid ? "#ef4444" : "#d1d5db")};
    font-size: 14px;
    background: #ffffff;
    color: #111827;

    &:focus {
      outline: none;
      border-color: ${({ $invalid }) => ($invalid ? "#ef4444" : "#2563eb")};
      box-shadow: 0 0 0 3px
        ${({ $invalid }) =>
          $invalid ? "rgba(239, 68, 68, 0.12)" : "rgba(37, 99, 235, 0.12)"};
    }
  }
`;

const ErrorText = styled.span`
  color: #dc2626;
  font-size: 12px;
`;

const Actions = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;

  @media (max-width: 560px) {
    button {
      width: 100%;
    }
  }
`;

const Button = styled.button`
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 10px 26px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #1e40af;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const FilterCard = styled.div`
  background: #ffffff;
  border-radius: 10px;
  padding: 16px;
  margin: 24px 0 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  select {
    min-width: 180px;
  }

  input,
  select {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
  }

  @media (max-width: 720px) {
    flex-direction: column;

    input,
    select {
      width: 100%;
      min-width: 0;
    }
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 220px;
`;

type FieldErrors = Partial<Record<keyof Ativo, string>>;

const initialForm: Ativo = {
  id_subestacao: 0,
  id_tipo_ativo: 0,
  codigo_ativo: "",
  fabricante: "",
  modelo: "",
  especie: "",
  numero_serie: "",
  tensao_nominal_kv: undefined,
  data_instalacao: null,
  status: "ATIVO",
  vao: "",
  fase: "",
};

export default function AtivoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const isEdit = Boolean(id);

  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [tipos, setTipos] = useState<TipoAtivo[]>([]);
  const [form, setForm] = useState<Ativo>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [subestacaoFiltro, setSubestacaoFiltro] = useState("all");

  useEffect(() => {
    api
      .get("/subestacao/ativas")
      .then((res) => setSubestacoes(res.data))
      .catch(() => toast.error("Erro ao carregar subestacoes"));
  }, []);

  useEffect(() => {
    setSubestacaoFiltro(filtroInicialInstalacao(usuario, subestacoes));
  }, [subestacoes, usuario]);

  useEffect(() => {
    api
      .get("/tipo-ativo")
      .then((res) => setTipos(res.data))
      .catch(() => toast.error("Erro ao carregar tipos de ativo"));
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    api
      .get(`/ativo/${id}`)
      .then((res) => {
        setForm({
          ...initialForm,
          ...res.data,
          fabricante: res.data.fabricante ?? "",
          modelo: res.data.modelo ?? "",
          especie: res.data.especie ?? "",
          numero_serie: res.data.numero_serie ?? "",
          data_instalacao: res.data.data_instalacao ?? null,
          status: res.data.status ?? "ATIVO",
          vao: res.data.vao ?? "",
          fase: res.data.fase ?? "",
        });
      })
      .catch(() => toast.error("Erro ao carregar ativo"));
  }, [id, isEdit]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: undefined }));

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "id_subestacao" || name === "id_tipo_ativo"
          ? Number(value)
          : name === "tensao_nominal_kv"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    }));
  }

  function validateForm() {
    const nextErrors: FieldErrors = {};

    if (!form.id_subestacao) {
      nextErrors.id_subestacao = "Selecione a subestacao.";
    }

    if (!form.id_tipo_ativo) {
      nextErrors.id_tipo_ativo = "Selecione o tipo de ativo.";
    }

    if (!form.codigo_ativo?.trim()) {
      nextErrors.codigo_ativo = "Informe o codigo do ativo.";
    }

    if (!form.status) {
      nextErrors.status = "Selecione o status.";
    }

    if (
      form.tensao_nominal_kv !== undefined &&
      Number(form.tensao_nominal_kv) < 0
    ) {
      nextErrors.tensao_nominal_kv = "A tensao deve ser maior ou igual a zero.";
    }

    setErrors(nextErrors);
    return nextErrors;
  }

  function nullableText(value?: string | null) {
    return value && value.trim() ? value.trim() : null;
  }

  async function salvar() {
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Revise os campos obrigatorios do ativo.");
      return;
    }

    const payload = {
      ...form,
      id_subestacao: Number(form.id_subestacao),
      id_tipo_ativo: Number(form.id_tipo_ativo),
      fabricante: nullableText(form.fabricante),
      modelo: nullableText(form.modelo),
      especie: nullableText(form.especie),
      numero_serie: nullableText(form.numero_serie),
      vao: nullableText(form.vao),
      fase: nullableText(form.fase),
      data_instalacao: form.data_instalacao || null,
      tensao_nominal_kv:
        form.tensao_nominal_kv === undefined ? null : Number(form.tensao_nominal_kv),
    };

    setSaving(true);

    try {
      if (isEdit) {
        await api.put(`/ativos/${id}`, payload);
        toast.success("Ativo editado com sucesso!");
      } else {
        await api.post("/ativo", payload);
        toast.success("Ativo cadastrado com sucesso!");
      }

      navigate("/ativo");
    } catch (error) {
      console.error("Erro ao salvar ativo:", error);
      toast.error("Erro ao salvar ativo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container>
      <PageTitle>
        <h2>{isEdit ? "Editar Ativo" : "Cadastro de Ativo"}</h2>
        <p>Dados tecnicos e administrativos conforme o cadastro do backend.</p>
      </PageTitle>

      <Card>
        <FormGrid>
          <FormGroup $invalid={!!errors.id_subestacao}>
            <label>Subestacao</label>
            <select
              name="id_subestacao"
              value={form.id_subestacao}
              onChange={handleChange}
            >
              <option value={0}>Selecione</option>
              {subestacoes.map((subestacao) => (
                <option
                  key={subestacao.id_subestacao}
                  value={String(subestacao.id_subestacao ?? "")}
                >
                  {subestacao.nome}
                </option>
              ))}
            </select>
            {errors.id_subestacao && <ErrorText>{errors.id_subestacao}</ErrorText>}
          </FormGroup>

          <FormGroup $invalid={!!errors.id_tipo_ativo}>
            <label>Tipo de ativo</label>
            <select
              name="id_tipo_ativo"
              value={form.id_tipo_ativo}
              onChange={handleChange}
            >
              <option value={0}>Selecione</option>
              {tipos.map((tipo) => (
                <option
                  key={tipo.id_tipo_ativo}
                  value={String(tipo.id_tipo_ativo ?? "")}
                >
                  {tipo.nome}
                </option>
              ))}
            </select>
            {errors.id_tipo_ativo && <ErrorText>{errors.id_tipo_ativo}</ErrorText>}
          </FormGroup>

          <FormGroup $invalid={!!errors.codigo_ativo}>
            <label>Codigo do ativo</label>
            <input
              name="codigo_ativo"
              value={form.codigo_ativo}
              onChange={handleChange}
              placeholder="Ex: 15C2"
            />
            {errors.codigo_ativo && <ErrorText>{errors.codigo_ativo}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <label>Especie</label>
            <select
              name="especie"
              value={form.especie ?? ""}
              onChange={handleChange}
            >
              <option value="">Selecione</option>
              <option value="EAT">EAT</option>
              <option value="SPCS">SPCS</option>
              <option value="TELECON">TELECON</option>
              <option value="SERVICO AUXILIAR">SERVICO AUXILIAR</option>
              <option value="GERAL">GERAL</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Fabricante</label>
            <input
              name="fabricante"
              value={form.fabricante ?? ""}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <label>Modelo</label>
            <input name="modelo" value={form.modelo ?? ""} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Numero de serie</label>
            <input
              name="numero_serie"
              value={form.numero_serie ?? ""}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup $invalid={!!errors.tensao_nominal_kv}>
            <label>Tensao nominal (kV)</label>
            <input
              name="tensao_nominal_kv"
              type="number"
              min="0"
              step="0.01"
              value={form.tensao_nominal_kv ?? ""}
              onChange={handleChange}
            />
            {errors.tensao_nominal_kv && (
              <ErrorText>{errors.tensao_nominal_kv}</ErrorText>
            )}
          </FormGroup>

          <FormGroup>
            <label>Data de instalacao</label>
            <input
              name="data_instalacao"
              type="date"
              value={form.data_instalacao ?? ""}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <label>Vao</label>
            <input name="vao" value={form.vao ?? ""} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Fase</label>
            <select name="fase" value={form.fase ?? ""} onChange={handleChange}>
              <option value="">Selecione</option>
              <option value="AZ">AZ</option>
              <option value="BR">BR</option>
              <option value="VM">VM</option>
              <option value="RES">RES</option>
              <option value="N">N</option>
              <option value="TRIFASICO">TRIFASICO</option>
              <option value="NA">N/A</option>
            </select>
          </FormGroup>

          <FormGroup $invalid={!!errors.status}>
            <label>Status</label>
            <select name="status" value={form.status ?? "ATIVO"} onChange={handleChange}>
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
            {errors.status && <ErrorText>{errors.status}</ErrorText>}
          </FormGroup>
        </FormGrid>

        <Actions>
          <Button onClick={salvar} disabled={saving}>
            {saving ? "Salvando..." : isEdit ? "Editar Ativo" : "Salvar Ativo"}
          </Button>
        </Actions>
      </Card>

      {!isEdit && (
        <>
          <FilterCard>
            <SearchInput
              placeholder="Buscar por codigo, modelo, serie, fase ou vao..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Todos status</option>
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>

            <select
              value={subestacaoFiltro}
              onChange={(event) => setSubestacaoFiltro(event.target.value)}
            >
              <option value="all">Todas subestacoes</option>
              {subestacoes.map((subestacao) => (
                <option
                  key={subestacao.id_subestacao}
                  value={String(subestacao.id_subestacao ?? "")}
                >
                  {subestacao.nome}
                </option>
              ))}
            </select>
          </FilterCard>

          <AtivoPage1
            search={search}
            status={status}
            subestacao={subestacaoFiltro}
          />
        </>
      )}
    </Container>
  );
}
