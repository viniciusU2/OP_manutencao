import { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../api/api";
import Container from "../components/Container";
import { useParams, useNavigate } from "react-router-dom";

import type { SolicitacaoServico } from "../types/solicitacaoServico";
import type { Ativo } from "../types/Ativo";
import type { Subestacao } from "../types/Subestacao";


/* ================= STYLES ================= */

const PageTitle = styled.div`
  margin-bottom: 24px;

  h2 { margin: 0; font-weight: 600; }
  p { color: #6b7280; margin-top: 6px; }
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
`;

const SectionTitle = styled.h3`
  margin: 32px 0 16px;
  font-size: 16px;
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

const ReadOnlyValue = styled.div`
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #f8fafc;
  color: #475569;
  font-size: 14px;
`;

const Actions = styled.div`
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
`;

const Button = styled.button`
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 12px 28px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #1e40af;
  }
`;


/* ================= COMPONENT ================= */

export function SSForm() {

  const { id } = useParams();
  const navigate = useNavigate();
  const isEdicao = Boolean(id);

  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);

  const [form, setForm] = useState<SolicitacaoServico>({
    numero_ss: "",

    id_subestacao: null,
    id_ativo: null,

    solicitante: "",
    matricula: "",
    funcao: "",

    telefone: "",
    email: "",
    orgao: "",

    instalacao: "",
    localizacao: "",
    complemento: "",

    descricao_problema: "",

    prioridade: "MEDIA",
    esquema_servico: "",
    centro_custo: "",

    causa: "",
    causa_secundaria: "",

    equipe: "",

    data_hora_solicitacao: "",
    data_hora_limite: "",

    status: "ABERTA"
  });


  /* ===============================
     CARREGAR SUBESTAÇÕES
  =============================== */
  useEffect(() => {
    api.get("/subestacao/ativas")
      .then(res => setSubestacoes(res.data));
  }, []);


  /* ===============================
     CARREGAR ATIVOS
  =============================== */
  useEffect(() => {
    if (form.id_subestacao) {
      api.get(`/ativos/${form.id_subestacao}`)
        .then(res => setAtivos(res.data));
    }
  }, [form.id_subestacao]);


  /* ===============================
     CARREGAR SS (EDIÇÃO)
  =============================== */
  useEffect(() => {
    if (isEdicao) {
      api.get(`/ss/${id}`).then(res => {
        setForm(res.data);
      });
    }
  }, [id, isEdicao]);


  /* ===============================
     HANDLE CHANGE
  =============================== */
  function handleChange(
  e: React.ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >
) {

  const { name, value } = e.target;

  setForm(prev => ({
    ...prev,
    [name]: name === "id_ativo" || name === "id_subestacao"
      ? value === "" ? null : Number(value)
      : value
  }));

}


  /* ===============================
     SALVAR SS
  =============================== */
async function salvarOuEditar() {

  try {

    const { numero_ss: _numeroSs, ...dadosEnvio } = form;
    void _numeroSs;

    const payload = {
      ...dadosEnvio,
      id_ativo: dadosEnvio.id_ativo ? Number(dadosEnvio.id_ativo) : null
    };

    if (isEdicao) {
      await api.put(`/ss/${id}`, payload);
    } else {
      await api.post("/ss", payload);
    }

    alert("SS cadastrada com sucesso!");
    navigate("/ss");

  } catch (err) {
    console.error(err);
  }

}
  return (
    <Container>

      <PageTitle>
        <h2>
          {isEdicao ? "Editar Solicitação de Serviço" : "Nova Solicitação de Serviço"}
        </h2>
        <p>Registro de solicitação de manutenção</p>
      </PageTitle>

      <Card>

        {/* IDENTIFICAÇÃO */}
        <SectionTitle>Identificação</SectionTitle>

        <FormGrid>

          <FormGroup>
            <label>Nº SS</label>
            <ReadOnlyValue>
              {form.numero_ss || "Gerado automaticamente ao salvar"}
            </ReadOnlyValue>
          </FormGroup>

          <FormGroup>
            <label>Solicitante</label>
            <input
              name="solicitante"
              value={form.solicitante}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <label>Matrícula</label>
            <input
              name="matricula"
              value={form.matricula}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <label>Função</label>
            <input
              name="funcao"
              value={form.funcao}
              onChange={handleChange}
            />
          </FormGroup>

        </FormGrid>


        {/* LOCALIZAÇÃO */}
        <SectionTitle>Localização</SectionTitle>

        <FormGrid>

          <FormGroup>
            <label>Subestação</label>

            <select
              name="id_subestacao"
              value={form.id_subestacao ?? ""}
              onChange={handleChange}
            >

              <option value="">Selecione</option>

              {subestacoes.map(s => (
                <option key={s.id_subestacao} value={String(s.id_subestacao ?? "")}>
                  {s.nome}
                </option>
              ))}

            </select>

          </FormGroup>


          <FormGroup>
            <label>Ativo</label>

            <select
              name="id_ativo"
              value={form.id_ativo ?? ""}
              onChange={handleChange}
              disabled={!form.id_subestacao}
            >

              <option value="">Selecione</option>

              {ativos.map(a => (
                <option key={a.id_ativo} value={String(a.id_ativo ?? "")}>
                  {a.codigo_ativo}
                </option>
              ))}

            </select>

          </FormGroup>


          <FormGroup>
            <label>Localização Física</label>
            <input
              name="localizacao"
              value={form.localizacao}
              onChange={handleChange}
            />
          </FormGroup>


          <FormGroup>
            <label>Complemento</label>
            <input
              name="complemento"
              value={form.complemento}
              onChange={handleChange}
            />
          </FormGroup>

        </FormGrid>


        {/* DESCRIÇÃO */}
        <SectionTitle>Problema</SectionTitle>

        <FormGrid>

          <FormGroup>
            <label>Descrição do Problema</label>
            <textarea
              name="descricao_problema"
              value={form.descricao_problema}
              onChange={handleChange}
            />
          </FormGroup>

        </FormGrid>


        {/* CLASSIFICAÇÃO */}
        <SectionTitle>Classificação</SectionTitle>

        <FormGrid>

          <FormGroup>
            <label>Prioridade</label>

            <select
              name="prioridade"
              value={form.prioridade}
              onChange={handleChange}
            >

              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>

            </select>

          </FormGroup>


          <FormGroup>
            <label>Esquema de Serviço</label>

            <select
              name="esquema_servico"
              value={form.esquema_servico}
              onChange={handleChange}
            >

              <option value="">Selecione</option>
              <option value="MANUTENÇÃO PREVENTIVA">Manutenção Preventiva</option>
              <option value="MANUTENÇÃO CORRETIVA">Manutenção Corretiva</option>
              <option value="Monitoramento">Monitoramento</option>
              <option value="Atendimento Recomendação">Atendimento Recomendação</option>

            </select>

          </FormGroup>


          <FormGroup>
            <label>Equipe</label>
            <input
              name="equipe"
              value={form.equipe}
              onChange={handleChange}
            />
          </FormGroup>


          <FormGroup>
            <label>Centro de Custo</label>
            <input
              name="centro_custo"
              value={form.centro_custo}
              onChange={handleChange}
            />
          </FormGroup>

        </FormGrid>


        {/* PRAZOS */}
        <SectionTitle>Prazos</SectionTitle>

        <FormGrid>

         <FormGroup>
            <label>Data Solicitação</label>
            <input
              type="datetime-local"
              name="data_hora_solicitacao"
              value={form.data_hora_solicitacao}
              onChange={handleChange}
            />
          </FormGroup>




          <FormGroup>
            <label>Data Limite</label>
            <input
              type="datetime-local"
              name="data_hora_limite"
              value={form.data_hora_limite}
              onChange={handleChange}
            />
          </FormGroup>

        </FormGrid>


        <Actions>

       
          <Button type="button" onClick={salvarOuEditar}>

            {isEdicao ? "Editar SS" : "Salvar SS"}
          </Button>

        </Actions>

      </Card>

    </Container>
  );
}
