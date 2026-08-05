import { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../api/api";
import type { TipoAtivo } from "../types/TipoAtivo";
import type { ItemInspecao, Periodicidade } from "../types/ItemInspecao";
import Container from "../components/Container";

/* ================= STYLES ================= */

const PageTitle = styled.div`
  margin-bottom: 24px;

  h2 {
    font-family: "Poppins", sans-serif;
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }

  p {
    margin-top: 4px;
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
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    color: #374151;
    font-weight: 500;
  }

  input,
  select {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #2563eb;
    }
  }
`;

const Actions = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
`;

const Button = styled.button`
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 10px 26px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #1e40af;
  }
`;

/* ================= CONSTANTES ================= */

const periodicidades: Periodicidade[] = [
  "SEMANAL",
  "MENSAL",
  "BIMESTRAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "ANUAL",
  "3_ANOS",
  "5_ANOS",
  "6_ANOS",
];

/* ================= COMPONENT ================= */

export  function CreateItemInspecaoForm() {
  const [tipos, setTipos] = useState<TipoAtivo[]>([]);

  const [form, setForm] = useState<ItemInspecao>({
    id_tipo_ativo: 0,
    nome_item: "",
    periodicidade: "MENSAL",
    ativo: true,
  });

  useEffect(() => {
    carregarTipos();
  }, []);

  async function carregarTipos() {
    const response = await api.get("/tipo-ativo");
    setTipos(response.data);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]:
        name === "id_tipo_ativo"
          ? Number(value)
          : name === "ativo"
          ? value === "true"
          : value,
    });
  }

  async function salvar() {
    if (!form.id_tipo_ativo) {
      alert("Selecione um tipo de ativo");
      return;
    }

    await api.post("/item", form);

    alert("Item de inspeção cadastrado com sucesso!");

    setForm({
      id_tipo_ativo: 0,
      nome_item: "",
      periodicidade: "MENSAL",
      ativo: true,
    });
  }

  return (
    <Container>
      <PageTitle>
        <h2>Cadastro de Item de Inspeção</h2>
        <p>Configure os itens vinculados ao tipo de ativo</p>
      </PageTitle>

      <Card>
        <FormGrid>
          <FormGroup>
            <label>Tipo de Ativo</label>
            <select
              name="id_tipo_ativo"
              value={form.id_tipo_ativo}
              onChange={handleChange}
            >
              <option value={0}>Selecione...</option>
              {tipos.map((tipo) => (
                <option
                  key={tipo.id_tipo_ativo}
                  value={tipo.id_tipo_ativo}
                >
                  {tipo.nome}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label>Nome do Item</label>
            <input
              name="nome_item"
              placeholder="Ex: Contador de descarga"
              value={form.nome_item}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <label>Periodicidade</label>
            <select
              name="periodicidade"
              value={form.periodicidade}
              onChange={handleChange}
            >
              {periodicidades.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label>Ativo</label>
            <select
              name="ativo"
              value={String(form.ativo)}
              onChange={handleChange}
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </FormGroup>
        </FormGrid>

        <Actions>
          <Button onClick={salvar}>Salvar Item</Button>
        </Actions>
      </Card>
    </Container>
  );
}
