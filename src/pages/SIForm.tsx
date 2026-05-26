import { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../api/api";
import Container from "../components/Container";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { SI } from "../types/SI";
import type { Subestacao } from "../types/Subestacao";
import type { Ativo } from "../types/Ativo";
import { useAuth } from "../context/AuthContext";

/* ================= STYLES ================= */

const PageTitle = styled.div`
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-weight: 600;
  }

  p {
    color: #6b7280;
    margin-top: 6px;
  }
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

  input,
  textarea,
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

export default function SIForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const isEdit = Boolean(id);

  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);

  const [form, setForm] = useState<SI>({
    id_si: 0,

    numero_os: "",
    numero_si: "",
    numero_sgi: "",

    especie: "",
    numero_apr: "",
    tipo: "",

    id_subestacao: null,
    id_ativo: null,

    status_manutencao: "ABERTA",

    data_inicio_preriodo_total: null,
    data_fim_preriodo_total: null,
    data_inicio_preriodo_manutencao: null,
    data_fim_preriodo_manutencao: null,

    responsavel: "",
    substituto: "",

    descricao_servicos: "",
    observacoes: "",

    responsavel_ons_manutencao: "",
    responsavel_data_ons_manutencao: null,
    responsavel_cot_manutencao: "",
    responsavel_data_cot_manutencao: null,
    responsavel_se_manutencao: "",
    responsavel_data_se_manutencao: null,

    responsavel_ons_operacao: "",
    responsavel_data_ons_operacao: null,
    responsavel_cot_operacao: "",
    responsavel_data_cot_operacao: null,
    responsavel_se_operacao: "",
    responsavel_data_se_operacao: null,

    aproveitamento: "",
    inclusao_servico: "",
    orgaos: "",
    tipo_programacao: "",
    dias_excecao: "",
    tempo_retorno: "",
    disponivel: "",
    risco_desligamento: "",
    condicoes_climaticas: "",

    emissor: "",
    criado_em: "",
  });

  useEffect(() => {
    api
      .get("/subestacao/ativas")
      .then((res) => setSubestacoes(res.data))
      .catch((err) =>
        console.error("Erro ao carregar subestações:", err)
      );
  }, []);

  useEffect(() => {
    if (form.id_subestacao) {
      api
        .get(`/ativos/${form.id_subestacao}`)
        .then((res) => setAtivos(res.data))
        .catch((err) =>
          console.error("Erro ao carregar ativos:", err)
        );
    } else {
      setAtivos([]);
    }
  }, [form.id_subestacao]);

  useEffect(() => {
    if (isEdit) {
      api
        .get(`/si/${id}`)
        .then((res) => {
          setForm({
            ...res.data,

            numero_os: res.data.numero_os ?? "",
            numero_si: res.data.numero_si ?? "",
            numero_sgi: res.data.numero_sgi ?? "",

            especie: res.data.especie ?? "",
            numero_apr: res.data.numero_apr ?? "",
            tipo: res.data.tipo ?? "",

            status_manutencao:
              res.data.status_manutencao ?? "ABERTA",

            descricao_servicos:
              res.data.descricao_servicos ?? "",
            observacoes: res.data.observacoes ?? "",

            responsavel: res.data.responsavel ?? "",
            substituto: res.data.substituto ?? "",

            aproveitamento: res.data.aproveitamento ?? "",
            inclusao_servico: res.data.inclusao_servico ?? "",
            orgaos: res.data.orgaos ?? "",
            tipo_programacao: res.data.tipo_programacao ?? "",
            dias_excecao: res.data.dias_excecao ?? "",
            tempo_retorno: res.data.tempo_retorno ?? "",
            disponivel: res.data.disponivel ?? "",
            risco_desligamento:
              res.data.risco_desligamento ?? "",
            condicoes_climaticas:
              res.data.condicoes_climaticas ?? "",
          });
        })
        .catch((err) => {
          console.error("Erro ao carregar SI:", err);
          toast.error("Erro ao carregar SI");
        });
    }
  }, [id, isEdit]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "id_subestacao" || name === "id_ativo"
          ? value === ""
            ? null
            : Number(value)
          : value,
    }));
  }

  function isAfter(start?: string | null, end?: string | null) {
    if (!start || !end) return true;
    return new Date(end).getTime() >= new Date(start).getTime();
  }

  function validarFormulario() {
    if (!form.numero_os?.trim()) {
      toast.error("Informe o número da OS.");
      return false;
    }

    if (!form.id_subestacao) {
      toast.error("Selecione a subestação.");
      return false;
    }

    if (!form.id_ativo) {
      toast.error("Selecione o ativo.");
      return false;
    }

    if (!form.tipo?.trim()) {
      toast.error("Selecione o tipo da SI.");
      return false;
    }

    if (!isAfter(form.data_inicio_preriodo_total, form.data_fim_preriodo_total)) {
      toast.error("O fim do periodo total deve ser posterior ao inicio.");
      return false;
    }

    if (!isAfter(form.data_inicio_preriodo_manutencao, form.data_fim_preriodo_manutencao)) {
      toast.error("O fim da manutencao deve ser posterior ao inicio.");
      return false;
    }

    return true;
  }

  async function salvar() {
    try {
      if (!validarFormulario()) return;

      const { numero_si: _numeroSi, ...formSemNumeroSi } = form;
      void _numeroSi;

      const payload = {
        ...formSemNumeroSi,

        data_inicio_preriodo_total:
          form.data_inicio_preriodo_total?.trim() || null,
        data_fim_preriodo_total:
          form.data_fim_preriodo_total?.trim() || null,
        data_inicio_preriodo_manutencao:
          form.data_inicio_preriodo_manutencao?.trim() || null,
        data_fim_preriodo_manutencao:
          form.data_fim_preriodo_manutencao?.trim() || null,

        responsavel_data_ons_manutencao:
          form.responsavel_data_ons_manutencao?.trim() || null,
        responsavel_data_cot_manutencao:
          form.responsavel_data_cot_manutencao?.trim() || null,
        responsavel_data_se_manutencao:
          form.responsavel_data_se_manutencao?.trim() || null,

        responsavel_data_ons_operacao:
          form.responsavel_data_ons_operacao?.trim() || null,
        responsavel_data_cot_operacao:
          form.responsavel_data_cot_operacao?.trim() || null,
        responsavel_data_se_operacao:
          form.responsavel_data_se_operacao?.trim() || null,

        emissor: usuario?.nome,
      };

      if (isEdit) {
        await api.put(`/si/${id}`, payload);
        toast.success("SI atualizada com sucesso!");
      } else {
        await api.post("/si", payload);
        toast.success("SI cadastrada com sucesso!");
      }

      navigate("/si");
    } catch (error) {
      console.error("Erro ao salvar SI:", error);
      toast.error("Erro ao salvar SI");
    }
  }

  return (
    <Container>
      <PageTitle>
        <h2>{isEdit ? "Editar SI" : "Nova SI"}</h2>
        <p>Cadastro e controle de solicitação de intervenção</p>
      </PageTitle>

      <Card>
        <SectionTitle>Identificação</SectionTitle>

        <FormGrid>
          <FormGroup>
            <label>Nº OS *</label>
            <input
              name="numero_os"
              onChange={handleChange}
              value={form.numero_os ?? ""}
              placeholder="Informe o número da OS"
            />
          </FormGroup>

          <FormGroup>
            <label>Nº SI</label>
            <ReadOnlyValue>
              {form.numero_si || "Gerado automaticamente ao salvar"}
            </ReadOnlyValue>
          </FormGroup>

          <FormGroup>
            <label>Nº SGI</label>
            <input
              name="numero_sgi"
              onChange={handleChange}
              value={form.numero_sgi ?? ""}
              placeholder="Informe o número SGI"
            />
          </FormGroup>

          <FormGroup>
            <label>Espécie</label>
            <select
              name="especie"
              onChange={handleChange}
              value={form.especie ?? ""}
            >
              <option value="">Selecione</option>
              <option value="EAT">EAT</option>
              <option value="SPCS">SPCS</option>
              <option value="TELECON">TELECON</option>
              <option value="SERVIÇO AUXÍLIAR">
                SERVIÇO AUXÍLIAR
              </option>
              <option value="GERAL">GERAL</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Nº APR</label>
            <input
              name="numero_apr"
              onChange={handleChange}
              value={form.numero_apr ?? ""}
              placeholder="Informe o número da APR"
            />
          </FormGroup>

          <FormGroup>
            <label>Tipo</label>
            <select
              name="tipo"
              onChange={handleChange}
              value={form.tipo ?? ""}
            >
              <option value="">Selecione</option>
              <option value="PROGRAMADA">Programada</option>
              <option value="URGÊNCIA">Urgência</option>
              <option value="EMERGÊNCIA">Emergência</option>
            </select>
          </FormGroup>
        </FormGrid>

        <SectionTitle>Localização</SectionTitle>

        <FormGrid>
          <FormGroup>
            <label>Instalação/Subestação *</label>
            <select
              name="id_subestacao"
              value={form.id_subestacao?.toString() ?? ""}
              onChange={handleChange}
            >
              <option value="">Selecione</option>
              {subestacoes.map((s) => (
                <option
                  key={s.id_subestacao}
                  value={s.id_subestacao}
                >
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
              {ativos.map((a) => (
                <option key={a.id_ativo} value={a.id_ativo}>
                  {a.codigo_ativo} – {a.fase}
                  {a.vao ? `-${a.vao}` : ""}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label>Status</label>
            <select
              name="status_manutencao"
              onChange={handleChange}
              value={form.status_manutencao ?? "ABERTA"}
            >
              <option value="ABERTA">Aberta</option>
              <option value="PROGRAMADA">Programada</option>
              <option value="EM_EXECUCAO">Em Execução</option>
              <option value="ENCERRADA">Encerrada</option>
            </select>
          </FormGroup>
        </FormGrid>

        <SectionTitle>Informações Operacionais</SectionTitle>

        <FormGrid>
          <FormGroup>
            <label>Aproveitamento?</label>
            <select
              name="aproveitamento"
              onChange={handleChange}
              value={form.aproveitamento ?? ""}
            >
              <option value="">Selecione</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Inclusão de Serviço?</label>
            <select
              name="inclusao_servico"
              onChange={handleChange}
              value={form.inclusao_servico ?? ""}
            >
              <option value="">Selecione</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Órgãos</label>
            <select
              name="orgaos"
              onChange={handleChange}
              value={form.orgaos ?? ""}
            >
              <option value="">Selecione</option>
              <option value="ONS">ONS</option>
              <option value="COT">COT</option>
              <option value="SE">SE</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Tipo Programação</label>
            <select
              name="tipo_programacao"
              onChange={handleChange}
              value={form.tipo_programacao ?? ""}
            >
              <option value="">Selecione</option>
              <option value="DIARIA">Diária</option>
              <option value="SEMANAL">Semanal</option>
              <option value="MENSAL">Mensal</option>
              <option value="EVENTUAL">Eventual</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Se diário, exceto os dias</label>
            <input
              name="dias_excecao"
              onChange={handleChange}
              value={form.dias_excecao ?? ""}
              placeholder="Ex: sábado e domingo"
            />
          </FormGroup>

          <FormGroup>
            <label>Tempo de retorno</label>
            <input
              name="tempo_retorno"
              onChange={handleChange}
              value={form.tempo_retorno ?? ""}
              placeholder="Ex: 30 minutos"
            />
          </FormGroup>

          <FormGroup>
            <label>Disponível</label>
            <select
              name="disponivel"
              onChange={handleChange}
              value={form.disponivel ?? ""}
            >
              <option value="">Selecione</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Risco de Desligamento?</label>
            <select
              name="risco_desligamento"
              onChange={handleChange}
              value={form.risco_desligamento ?? ""}
            >
              <option value="">Selecione</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Depende de condições climáticas?</label>
            <select
              name="condicoes_climaticas"
              onChange={handleChange}
              value={form.condicoes_climaticas ?? ""}
            >
              <option value="">Selecione</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
            </select>
          </FormGroup>
        </FormGrid>

        <SectionTitle>Período total</SectionTitle>

        <FormGrid>
          <FormGroup>
            <label>Início do período total</label>
            <input
              type="datetime-local"
              name="data_inicio_preriodo_total"
              onChange={handleChange}
              value={form.data_inicio_preriodo_total ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Fim do período total</label>
            <input
              type="datetime-local"
              name="data_fim_preriodo_total"
              onChange={handleChange}
              value={form.data_fim_preriodo_total ?? ""}
            />
          </FormGroup>
        </FormGrid>

        <SectionTitle>Período de manutenção</SectionTitle>

        <FormGrid>
          <FormGroup>
            <label>Início da manutenção</label>
            <input
              type="datetime-local"
              name="data_inicio_preriodo_manutencao"
              onChange={handleChange}
              value={form.data_inicio_preriodo_manutencao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Fim da manutenção</label>
            <input
              type="datetime-local"
              name="data_fim_preriodo_manutencao"
              onChange={handleChange}
              value={form.data_fim_preriodo_manutencao ?? ""}
            />
          </FormGroup>
        </FormGrid>

        <SectionTitle>Responsáveis</SectionTitle>

        <FormGrid>
          <FormGroup>
            <label>Responsável</label>
            <select
              name="responsavel"
              onChange={handleChange}
              value={form.responsavel ?? ""}
            >
              <option value="">Selecione</option>
              <option value="ALDENIR">
                ALDENIR PEREIRA DE LIMA
              </option>
              <option value="ALESSANDRO PEREIRA">
                ALESSANDRO PEREIRA
              </option>
              <option value="EDINEI ROCHA">EDINEI ROCHA</option>
              <option value="EVALDO MENDONÇA DE SOUZA">
                EVALDO MENDONÇA DE SOUZA
              </option>
              <option value="RANGEL ROGER VASCONCELOS">
                RANGEL ROGER VASCONCELOS
              </option>
              <option value="MARCIO DA SILVA OLIVEIRA">
                MARCIO DA SILVA OLIVEIRA
              </option>
              <option value="VINICIUS GAMA">VINICIUS GAMA</option>
              <option value="WILSON MOREIRA JUNIOR">
                WILSON MOREIRA JUNIOR
              </option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Substituto</label>
            <select
              name="substituto"
              onChange={handleChange}
              value={form.substituto ?? ""}
            >
              <option value="">Selecione</option>
              <option value="ALDENIR">
                ALDENIR PEREIRA DE LIMA
              </option>
              <option value="ALESSANDRO PEREIRA">
                ALESSANDRO PEREIRA
              </option>
              <option value="EDINEI ROCHA">EDINEI ROCHA</option>
              <option value="EVALDO MENDONÇA DE SOUZA">
                EVALDO MENDONÇA DE SOUZA
              </option>
              <option value="RANGEL ROGER VASCONCELOS">
                RANGEL ROGER VASCONCELOS
              </option>
              <option value="MARCIO DA SILVA OLIVEIRA">
                MARCIO DA SILVA OLIVEIRA
              </option>
              <option value="VINICIUS GAMA">VINICIUS GAMA</option>
              <option value="WILSON MOREIRA JUNIOR">
                WILSON MOREIRA JUNIOR
              </option>
            </select>
          </FormGroup>
        </FormGrid>

        <SectionTitle>Descrição</SectionTitle>

        <FormGrid>
          <FormGroup>
            <label>Descrição dos serviços</label>
            <textarea
              name="descricao_servicos"
              onChange={handleChange}
              value={form.descricao_servicos ?? ""}
              placeholder="Descreva os serviços"
            />
          </FormGroup>

          <FormGroup>
            <label>Observações</label>
            <textarea
              name="observacoes"
              onChange={handleChange}
              value={form.observacoes ?? ""}
              placeholder="Observações adicionais"
            />
          </FormGroup>
        </FormGrid>

        <SectionTitle>Cabos de Aterramento</SectionTitle>

        <FormGrid>
          <FormGroup>
            <label>Cabos de aterramento</label>
            <textarea
              name="cabo_aterramento"
              onChange={handleChange}
              value={form.cabo_aterramento ?? ""}
              placeholder="Informe os cabos de aterramento, se aplicável"
            />
          </FormGroup>
        </FormGrid>

        <SectionTitle>Liberação para manutenção</SectionTitle>

        <FormGrid>
          <FormGroup>
            <label>Responsável ONS</label>
            <input
              name="responsavel_ons_manutencao"
              onChange={handleChange}
              value={form.responsavel_ons_manutencao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Data/hora ONS</label>
            <input
              type="datetime-local"
              name="responsavel_data_ons_manutencao"
              onChange={handleChange}
              value={form.responsavel_data_ons_manutencao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Responsável COT</label>
            <input
              name="responsavel_cot_manutencao"
              onChange={handleChange}
              value={form.responsavel_cot_manutencao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Data/hora COT</label>
            <input
              type="datetime-local"
              name="responsavel_data_cot_manutencao"
              onChange={handleChange}
              value={form.responsavel_data_cot_manutencao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Responsável SE</label>
            <input
              name="responsavel_se_manutencao"
              onChange={handleChange}
              value={form.responsavel_se_manutencao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Data/hora SE</label>
            <input
              type="datetime-local"
              name="responsavel_data_se_manutencao"
              onChange={handleChange}
              value={form.responsavel_data_se_manutencao ?? ""}
            />
          </FormGroup>
        </FormGrid>

        <SectionTitle>Liberação para operação</SectionTitle>

        <FormGrid>
          <FormGroup>
            <label>Responsável ONS</label>
            <input
              name="responsavel_ons_operacao"
              onChange={handleChange}
              value={form.responsavel_ons_operacao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Data/hora ONS</label>
            <input
              type="datetime-local"
              name="responsavel_data_ons_operacao"
              onChange={handleChange}
              value={form.responsavel_data_ons_operacao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Responsável COT</label>
            <input
              name="responsavel_cot_operacao"
              onChange={handleChange}
              value={form.responsavel_cot_operacao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Data/hora COT</label>
            <input
              type="datetime-local"
              name="responsavel_data_cot_operacao"
              onChange={handleChange}
              value={form.responsavel_data_cot_operacao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Responsável SE</label>
            <input
              name="responsavel_se_operacao"
              onChange={handleChange}
              value={form.responsavel_se_operacao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Data/hora SE</label>
            <input
              type="datetime-local"
              name="responsavel_data_se_operacao"
              onChange={handleChange}
              value={form.responsavel_data_se_operacao ?? ""}
            />
          </FormGroup>
        </FormGrid>

        <Actions>
          <Button onClick={salvar}>
            {isEdit ? "Atualizar SI" : "Salvar SI"}
          </Button>
        </Actions>
      </Card>
    </Container>
  );
}
