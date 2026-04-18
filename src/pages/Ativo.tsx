import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import type { Ativo } from "../types/Ativo";
import type { Subestacao } from "../types/Subestacao";
import styled from "styled-components";
import Container from "../components/Container";
import { AtivoPage1 } from "./Ativos-table";
import type { TipoAtivo } from "../types/TipoAtivo";
import { OnlyAdmin } from "../components/onlyAdmin";

/* === styled-components === */

const PageTitle = styled.div`
  margin-bottom: 24px;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 500;
  }

  input, textarea, select {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #2563eb;
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
`;


const Actions = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
`;

const Button = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 26px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #1e40af;
  }
`;

const FilterCard = styled.div`
  background: white;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);

  display: flex;
  gap: 12px;
`;


const SearchInput = styled.input`
  flex: 1;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
`;

const Select = styled.select`
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
`;

export default function AtivoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [tipos, setTipos] = useState<TipoAtivo[]>([]);

  /* 🔥 filtros */
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [subestacaoFiltro, setSubestacaoFiltro] = useState("all");

  const [form, setForm] = useState<Ativo>({
    id_subestacao: 0,
    id_tipo_ativo: 0,
    codigo_ativo: "",
    fabricante: "",
    modelo: "",
    tensao_nominal_kv: undefined,
  });

  /* ================= LOAD ================= */

  useEffect(() => {
    api.get("/subestacao/ativas").then((res) => {
      setSubestacoes(res.data);
    });
  }, []);

  useEffect(() => {
    api.get("/tipo-ativo").then((res) => {
      setTipos(res.data);
    });
  }, []);

  useEffect(() => {
    if (isEdit) {
      api.get(`/ativos/${id}`).then((res) => {
        setForm(res.data);
      });
    }
  }, [id, isEdit]);

  /* ================= FORM ================= */

  function handleChange(
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]:
        name === "id_subestacao" || name === "id_tipo_ativo"
          ? Number(value)
          : name === "tensao_nominal_kv"
          ? Number(value)
          : value,
    });
  }

  async function salvar() {
    if (!form.id_tipo_ativo) {
      alert("Selecione um tipo de ativo");
      return;
    }

    const payload = {
      ...form,
      id_subestacao: Number(form.id_subestacao),
      id_tipo_ativo: Number(form.id_tipo_ativo),
      tensao_nominal_kv: form.tensao_nominal_kv
        ? Number(form.tensao_nominal_kv)
        : null,
    };

    if (isEdit) {
      await api.put(`/ativos/${id}`, payload);
      alert("Ativo editado com sucesso!");
    } else {
      await api.post("/ativo", payload);
      alert("Ativo cadastrado com sucesso!");
    }

    navigate("/ativos");
  }

  /* ================= RENDER ================= */

  return (
    <Container>
      
        <PageTitle>
          <h2>{isEdit ? "Editar Ativo" : "Cadastro de Ativo"}</h2>
        </PageTitle>

        <Card>
          <FormGrid>
            <FormGroup>
              <label>Subestação</label>
              <Select
                name="id_subestacao"
                value={form.id_subestacao}
                onChange={handleChange}
              >
                <option value={0}>Selecione</option>
                {subestacoes.map((s) => (
                  <option
                    key={s.id_subestacao}
                    value={s.id_subestacao}
                  >
                    {s.nome}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <label>Tipo de Ativo</label>
              <select
                name="id_tipo_ativo"
                value={form.id_tipo_ativo}
                onChange={handleChange}
              >
                <option value={0}>Selecione</option>
                {tipos.map((t) => (
                  <option
                    key={t.id_tipo_ativo}
                    value={t.id_tipo_ativo}
                  >
                    {t.nome}
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup>
              <label>Código do Ativo</label>
              <input
                name="codigo_ativo"
                value={form.codigo_ativo}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Fabricante</label>
              <input
                name="fabricante"
                value={form.fabricante}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Modelo</label>
              <input
                name="modelo"
                value={form.modelo}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Tensão Nominal (kV)</label>
              <input
                name="tensao_nominal_kv"
                type="number"
                value={form.tensao_nominal_kv ?? ""}
                onChange={handleChange}
              />
            </FormGroup>
          </FormGrid>

          <Actions>
            <Button onClick={salvar}>
              {isEdit ? "Editar Ativo" : "Salvar Ativo"}
            </Button>
          </Actions>
        </Card>
    

      {/* ================= LISTA + FILTROS ================= */}
      {!isEdit && (
        <>
          <FilterCard>
            <SearchInput
              placeholder="Buscar ativo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Todos Status</option>
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>

            <select
              value={subestacaoFiltro}
              onChange={(e) => setSubestacaoFiltro(e.target.value)}
            >
              <option value="all">Todas Subestações</option>

              {subestacoes.map((s) => (
                <option
                  key={s.id_subestacao}
                  value={s.id_subestacao}
                >
                  {s.nome}
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