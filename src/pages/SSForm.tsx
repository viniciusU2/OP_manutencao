import { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../api/api";
import Container from "../components/Container";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import type { SolicitacaoServico } from "../types/solicitacaoServico";
import type { Ativo } from "../types/Ativo";
import type { Subestacao } from "../types/Subestacao";
import type { TipoAtivo } from "../types/TipoAtivo";
import { especiePorAtivo } from "../lib/documentosOperacao";

const PRIORIDADES_SS = [
  { value: "NIVEL_1", label: "Nivel 1 - Emergencial: 0 a 24h" },
  { value: "NIVEL_2", label: "Nivel 2 - Urgente: ate 3 dias" },
  { value: "NIVEL_3", label: "Nivel 3 - Programado prioritario: ate 15 dias" },
  { value: "NIVEL_4", label: "Nivel 4 - Programado: ate 60 dias" },
  { value: "NIVEL_5", label: "Nivel 5 - Melhoria/Oportunidade: ate 180 dias" },
  { value: "NIVEL_6", label: "Nivel 6 - Monitoramento: conforme planejamento da O&M" },
];

const LOCALIZACOES_FISICAS = [
  { value: "Bom Jesus da Lapa-BA", label: "Bom Jesus da Lapa" },
  { value: "Gentio do Ouro-BA", label: "Gentio do Ouro" },
  { value: "Jaiba-MG", label: "Jaiba" },
  { value: "BURITIZEIRO-MG", label: "Buritizeiro" },
];

const ESQUEMAS_SERVICO_SS = [
  { value: "MANUTENÇÃO PREVENTIVA", label: "Manutencao Preventiva" },
  { value: "PREVENTIVA SEMANAL", label: "Preventiva Semanal" },
  { value: "PREVENTIVA MENSAL", label: "Preventiva Mensal" },
  { value: "PREVENTIVA BIMESTRAL", label: "Preventiva Bimestral" },
  { value: "PREVENTIVA TRIMESTRAL", label: "Preventiva Trimestral" },
  { value: "PREVENTIVA SEMESTRAL", label: "Preventiva Semestral" },
  { value: "PREVENTIVA ANUAL", label: "Preventiva Anual" },
  { value: "PREVENTIVA BIANUAL", label: "Preventiva Bianual" },
  { value: "PREVENTIVA TRIANUAL", label: "Preventiva Trianual" },
  { value: "PREVENTIVA A 5 ANOS", label: "Preventiva a 5 anos" },
  { value: "PREVENTIVA A 6 ANOS", label: "Preventiva a 6 anos" },
  { value: "MANUTENÇÃO CORRETIVA", label: "Manutencao Corretiva" },
  { value: "MANUTENÇÃO PREDITIVA", label: "Manutencao Preditiva" },
  { value: "Monitoramento", label: "Monitoramento" },
  { value: "Atendimento Recomendação", label: "Atendimento Recomendacao" },
];

function normalizarPrioridadeSS(prioridade?: string | null) {
  if (prioridade === "ALTA") return "NIVEL_1";
  if (prioridade === "MEDIA") return "NIVEL_3";
  if (prioridade === "BAIXA") return "NIVEL_5";

  return prioridade || "NIVEL_3";
}

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
  const [ativoSelecionadoDetalhes, setAtivoSelecionadoDetalhes] = useState<Ativo | null>(null);
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);

  const [form, setForm] = useState<SolicitacaoServico>({
    numero_ss: "",
    numero_os: null,

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

    prioridade: "NIVEL_3",
    esquema_servico: "",
    centro_custo: "",

    causa: "",
    causa_secundaria: "",

    equipe: "",

    data_hora_solicitacao: "",
    data_hora_limite: "",

    status: "ABERTA"
  });

  const ativoSelecionadoLista = ativos.find(
    (ativo) => Number(ativo.id_ativo) === Number(form.id_ativo)
  );
  const ativoSelecionado = ativoSelecionadoDetalhes ?? ativoSelecionadoLista;


  /* ===============================
     CARREGAR SUBESTAÇÕES
  =============================== */
  useEffect(() => {
    api.get("/subestacao/ativas")
      .then(res => setSubestacoes(res.data));
  }, []);

  useEffect(() => {
    api
      .get("/tipo-ativo")
      .then((res) => setTiposAtivo(res.data))
      .catch((err) => console.error("Erro ao carregar tipos de ativo:", err));
  }, []);


  /* ===============================
     CARREGAR ATIVOS
  =============================== */
  useEffect(() => {
    if (!form.id_ativo) {
      setAtivoSelecionadoDetalhes(null);
      return;
    }

    api
      .get(`/ativo/${form.id_ativo}`)
      .then((res) => setAtivoSelecionadoDetalhes(res.data))
      .catch(() => setAtivoSelecionadoDetalhes(null));
  }, [form.id_ativo]);

  useEffect(() => {
    if (form.id_subestacao) {
      api.get(`/ativos/${form.id_subestacao}`)
        .then(res => setAtivos(res.data));
    } else {
      setAtivos([]);
    }
  }, [form.id_subestacao]);


  /* ===============================
     CARREGAR SS (EDIÇÃO)
  =============================== */
  useEffect(() => {
    if (isEdicao) {
      api.get(`/ss/${id}`).then(async res => {
        const ss = res.data;
        let idSubestacao = ss.id_subestacao ?? null;

        if (!idSubestacao && ss.id_ativo) {
          const ativoRes = await api.get(`/ativo/${ss.id_ativo}`);
          idSubestacao = ativoRes.data.id_subestacao ?? null;
        }

        setForm({
          ...ss,
          id_subestacao: idSubestacao,
          prioridade: normalizarPrioridadeSS(ss.prioridade),
        });
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

  if (name === "id_subestacao") {
    setForm(prev => ({
      ...prev,
      id_subestacao: value === "" ? null : Number(value),
      id_ativo: null,
    }));
    return;
  }

  setForm(prev => ({
    ...prev,
    [name]: name === "id_ativo"
      ? value === "" ? null : Number(value)
      : value
  }));

}

function isAfter(start?: string | null, end?: string | null) {
  if (!start || !end) return true;
  return new Date(end).getTime() >= new Date(start).getTime();
}

function validarFormulario() {
  if (!form.id_subestacao) {
    toast.error("Selecione a subestacao.");
    return false;
  }

  if (!form.id_ativo) {
    toast.error("Selecione o ativo.");
    return false;
  }

  if (!form.solicitante?.trim()) {
    toast.error("Informe o solicitante.");
    return false;
  }

  if (!form.esquema_servico?.trim()) {
    toast.error("Selecione o esquema de servico.");
    return false;
  }

  if (!form.descricao_problema?.trim()) {
    toast.error("Descreva o problema.");
    return false;
  }

  if (!isAfter(form.data_hora_solicitacao, form.data_hora_limite)) {
    toast.error("A data limite deve ser posterior a data de solicitacao.");
    return false;
  }

  return true;
}


  /* ===============================
     SALVAR SS
  =============================== */
async function salvarOuEditar() {

  try {

    if (!validarFormulario()) return;

    const { numero_ss: _numeroSs, ...dadosEnvio } = form;
    void _numeroSs;

    const payload = {
      ...dadosEnvio,
      id_ativo: dadosEnvio.id_ativo ? Number(dadosEnvio.id_ativo) : null
    };

    if (isEdicao) {
      await api.put(`/ss/${id}`, payload);
      toast.success("SS atualizada com sucesso!");
    } else {
      await api.post("/ss", payload);
      toast.success("SS cadastrada com sucesso!");
    }

    navigate("/ss");

  } catch (err) {
    console.error(err);
    toast.error("Erro ao salvar SS.");
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
            <label>Nº OS vinculada</label>
            <ReadOnlyValue>
              {form.numero_os || "Ainda não atendida"}
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
                  {a.codigo_ativo} - {[a.fase, a.vao].filter(Boolean).join("-")}
                </option>
              ))}

            </select>

          </FormGroup>

          <FormGroup>
            <label>Espécie</label>
            <ReadOnlyValue>
              {especiePorAtivo(ativoSelecionado, tiposAtivo) || "Informe tensão nominal e fabricante no cadastro do ativo"}
            </ReadOnlyValue>
          </FormGroup>


          <FormGroup>
            <label>Localização Física</label>
            <select
              name="localizacao"
              value={form.localizacao ?? ""}
              onChange={handleChange}
            >
              <option value="">Selecione</option>

              {form.localizacao &&
                !LOCALIZACOES_FISICAS.some((local) => local.value === form.localizacao) && (
                  <option value={form.localizacao}>{form.localizacao}</option>
                )}

              {LOCALIZACOES_FISICAS.map((local) => (
                <option key={local.value} value={local.value}>
                  {local.label}
                </option>
              ))}
            </select>
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
            <label>Status</label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="ABERTA">Aberta</option>
              <option value="PROGRAMADA">Programada</option>
              <option value="EM_EXECUCAO">Em Execucao</option>
              <option value="ENCERRADA">Encerrada</option>
            </select>

          </FormGroup>

          <FormGroup>
            <label>Prioridade</label>

            <select
              name="prioridade"
              value={form.prioridade}
              onChange={handleChange}
            >
              {PRIORIDADES_SS.map((prioridade) => (
                <option key={prioridade.value} value={prioridade.value}>
                  {prioridade.label}
                </option>
              ))}

            </select>

          </FormGroup>


          <FormGroup>
            <label>Esquema de Serviço</label>

            <select
              name="esquema_servico"
              value={form.esquema_servico ?? ""}
              onChange={handleChange}
            >

              <option value="">Selecione</option>
              {form.esquema_servico &&
                !ESQUEMAS_SERVICO_SS.some((esquema) => esquema.value === form.esquema_servico) && (
                  <option value={form.esquema_servico}>{form.esquema_servico}</option>
                )}
              <option value="MANUTENÇÃO PREVENTIVA">Manutenção Preventiva</option>
              <option value="PREVENTIVA SEMANAL">Preventiva Semanal</option>
              <option value="PREVENTIVA MENSAL">Preventiva Mensal</option>
              <option value="PREVENTIVA BIMESTRAL">Preventiva Bimestral</option>
              <option value="PREVENTIVA TRIMESTRAL">Preventiva Trimestral</option>
              <option value="PREVENTIVA SEMESTRAL">Preventiva Semestral</option>
              <option value="PREVENTIVA ANUAL">Preventiva Anual</option>
              <option value="PREVENTIVA BIANUAL">Preventiva Bianual</option>
              <option value="PREVENTIVA TRIANUAL">Preventiva Trianual</option>
              <option value="PREVENTIVA A 5 ANOS">Preventiva a 5 anos</option>
              <option value="PREVENTIVA A 6 ANOS">Preventiva a 6 anos</option>
              <option value="MANUTENÇÃO CORRETIVA">Manutenção Corretiva</option>
              <option value="MANUTENÇÃO PREDITIVA">Manutenção Preditiva</option>
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
