import { useState } from "react";
import styled from "styled-components";
import api from "../api/api";
import type { Subestacao } from "../types/Subestacao";
import Container from "../components/Container";
import {SubestacaoPage1} from "./subestacao-table"

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

  input, select {
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

/* ================= COMPONENT ================= */

export default function SubestacaoPage() {
  const [form, setForm] = useState<Subestacao>({
    nome: "",
    tipo_instalacao: "SUBESTACAO",
    tensao_kv: 0,
    localizacao: "",
    concessionaria: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function salvar() {
    await api.post("/subestacao", {
      ...form,
      tensao_kv: Number(form.tensao_kv),
    });
    alert("Instalação cadastrada!");
  }

  return (
    <Container>
      <PageTitle>
        <h2>Cadastro de Instalação</h2>
        <p>Informações elétricas e administrativas da instalação</p>
      </PageTitle>

      <Card>
        <FormGrid>
          <FormGroup>
            <label>Tipo de instalação</label>
            <select name="tipo_instalacao" value={form.tipo_instalacao} onChange={handleChange}>
              <option value="SUBESTACAO">Subestação</option>
              <option value="LINHA_TRANSMISSAO">Linha de transmissão</option>
            </select>
          </FormGroup>
          <FormGroup>
            <label>Nome da instalação</label>
            <input
              name="nome"
              placeholder="Ex: SE Central"
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <label>Tensão Nominal (kV)</label>
            <input
              name="tensao_kv"
              type="number"
              placeholder="Ex: 138"
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <label>Localização</label>
            <input
              name="localizacao"
              placeholder="Cidade / UF"
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <label>Concessionária</label>
            <input
              name="concessionaria"
              placeholder="Ex: CEMIG"
              onChange={handleChange}
            />
          </FormGroup>
        </FormGrid>

        <Actions>
          <Button onClick={salvar}>Salvar Instalação</Button>
        </Actions>
      </Card>
      <SubestacaoPage1/>
    </Container>

  );
}
