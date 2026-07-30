import { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../api/api";
import Container from "../components/Container";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Clock3, RotateCcw, Wrench, XCircle } from "lucide-react";
import type { SI, SILiberacao } from "../types/SI";
import type { Subestacao } from "../types/Subestacao";
import type { Ativo } from "../types/Ativo";
import type { TipoAtivo } from "../types/TipoAtivo";
import { useAuth } from "../context/AuthContext";
import UsuarioSelect from "../components/UsuarioSelect";
import {
  PRIORIDADES_OPERACAO,
  especiePorAtivo,
  normalizarPrioridadeOperacao,
} from "../lib/documentosOperacao";

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
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
  align-items: center;
`;

const Button = styled.button`
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 12px 28px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  min-height: 42px;
  transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

  &:hover {
    background: #1e40af;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    transform: none;
  }
`;

const SecondaryButton = styled(Button)`
  background: #334155;
  box-shadow: 0 8px 18px rgba(51, 65, 85, 0.14);

  &:hover {
    background: #1f2937;
    box-shadow: 0 10px 22px rgba(51, 65, 85, 0.2);
  }
`;

const DangerButton = styled(Button)`
  background: #ffffff;
  color: #b91c1c;
  border: 1px solid #fecaca;
  box-shadow: none;

  &:hover {
    background: #fef2f2;
  }
`;

const LiberationPanel = styled.div`
  margin: 12px 0 20px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #f8fbff;
  padding: 18px;
`;

const LiberationState = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 18px;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => ($active ? "#fde68a" : "#bbf7d0")};
  background: ${({ $active }) => ($active ? "#fffbeb" : "#f0fdf4")};
  color: ${({ $active }) => ($active ? "#92400e" : "#166534")};

  strong {
    display: block;
    font-size: 14px;
  }

  span {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: #64748b;
  }
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin: 32px 0 16px;

  h3 {
    margin: 0;
    font-size: 16px;
  }

  span {
    color: #64748b;
    font-size: 13px;
  }
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;

  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
    font-size: 13px;
    vertical-align: top;
  }

  th {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

const ResponsibleStack = styled.div`
  display: grid;
  gap: 4px;
  color: #334155;

  span {
    display: block;
  }
`;

const StatusPill = styled.span<{ $status: string }>`
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid ${({ $status }) => ($status === "EM_EXECUCAO" ? "#f59e0b" : $status === "ENCERRADA" ? "#10b981" : "#cbd5e1")};
  color: ${({ $status }) => ($status === "EM_EXECUCAO" ? "#92400e" : $status === "ENCERRADA" ? "#047857" : "#475569")};
  background: ${({ $status }) => ($status === "EM_EXECUCAO" ? "#fef3c7" : $status === "ENCERRADA" ? "#d1fae5" : "#f8fafc")};
  font-size: 12px;
  font-weight: 600;
`;

const TIPOS_SI = [
  { value: "TIPO 01", label: "TIPO 01" },
  { value: "TIPO 02", label: "TIPO 02" },
  { value: "TIPO 03", label: "TIPO 03" },
  { value: "TIPO 04", label: "TIPO 04" },
  {
    value: "TIPO 05 - OUTROS AGENTES/SERVIÇOS INTERNOS",
    label: "TIPO 05 - OUTROS AGENTES/SERVIÇOS INTERNOS",
  },
];

const NATUREZAS_SI = [
  "Manutenções corretivas",
  "Manutenções preventivas",
  "Manutenções preditivas",
  "Testes em equipamentos da rede de operação",
  "Teste ou energização de novos equipamentos",
  "Intervenção p/ implantação Ampliação, Reforço e Melhorias",
  "Desligamento por motivo de segurança Terc/serv. util. públ.",
  "Restrição oper. temp.,função restr. equip. integram FT/usina",
  "Restrição oper. temp.,função restr./indisp. equip./instal.",
  "Indisp. FT vinc.Pesq/Desenv ANEEL,termos Art.23 Res.270-2007",
  "Deslig. em função interv. equip. não integra rede operação",
  "Indisp. equip. reserva para subst.equip. de Função Transm.",
  "Desligamento de uma FT para atender solicitação do ONS",
  "Demais nat: interv/restr oper atend solic. ñ enquad item ant",
];

const CARACTERISTICAS_INTERVENCAO_SI = [
  "COM DESLIGAMENTO",
  "INTERVENÇÃO PARA REALIZAÇÃO DE TESTES",
  "SEM DESLIGAMENTO",
];

const TIPOS_PROGRAMACAO_SI = [
  { value: "DIARIA", label: "Diária" },
  { value: "CONTINUA", label: "Contínua" },
];

const STATUS_LIBERACAO_SI = [
  { value: "PROGRAMADA", label: "Programada" },
  { value: "INTERROMPIDA", label: "Interrompida" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "CANCELADA", label: "Cancelada" },
];

const STATUS_LIBERACAO_MANUTENCAO_SI = [
  { value: "PROGRAMADA", label: "Programada" },
  { value: "AUTORIZADA", label: "Autorizada" },
  { value: "REINICIADA", label: "Reiniciada" },
  { value: "INTERROMPIDA", label: "Interrompida" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "CANCELADA", label: "Cancelada" },
];

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("pt-BR");
}

function formatarData(valor?: string | null) {
  if (!valor) return "-";
  return new Date(`${valor}T00:00:00`).toLocaleDateString("pt-BR");
}

function statusLiberacaoLabel(status: string) {
  if (status === "EM_EXECUCAO") return "Em execução";
  if (status === "ENCERRADA") return "Encerrada";
  if (status === "CANCELADA") return "Cancelada";
  if (status === "ABERTA") return "Aberta";
  return status;
}

/* ================= COMPONENT ================= */

export default function SIForm() {
  const { id } = useParams();
  const { usuario } = useAuth();

  const isEdit = Boolean(id);

  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [ativoSelecionadoDetalhes, setAtivoSelecionadoDetalhes] = useState<Ativo | null>(null);
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);
  const [liberacoes, setLiberacoes] = useState<SILiberacao[]>([]);
  const [savingLiberacao, setSavingLiberacao] = useState(false);

  const [form, setForm] = useState<SI>({
    id_si: 0,

    numero_os: "",
    numero_si: "",
    numero_sgi: "",

    especie: "",
    numero_apr: "",
    prioridade: "NIVEL_3",
    natureza: "",
    caracteristica_intervencao: "",
    tipo: "",

    id_subestacao: null,
    id_ativo: null,

    status_manutencao: "PROGRAMADA",
    status_operacao: "PROGRAMADA",
    postergacao_traz_risco: "NAO",

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
    acarreta_risco_perdas_multiplas: "",
    orgaos: "",
    tipo_programacao: "",
    dias_excecao: "",
    tempo_retorno: "",
    disponivel: "",
    risco_desligamento: "",
    condicoes_climaticas: "",

    emissor: "",
    editado_por: "",
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
    api
      .get("/tipo-ativo")
      .then((res) => setTiposAtivo(res.data))
      .catch((err) => console.error("Erro ao carregar tipos de ativo:", err));
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
        .then(async (res) => {
          const si = res.data;
          let idSubestacao = si.id_subestacao ?? null;

          if (!idSubestacao && si.id_ativo) {
            const ativoRes = await api.get(`/ativo/${si.id_ativo}`);
            idSubestacao = ativoRes.data.id_subestacao ?? null;
          }

          setForm({
            ...si,
            id_subestacao: idSubestacao,

            numero_os: si.numero_os ?? "",
            numero_si: si.numero_si ?? "",
            numero_sgi: si.numero_sgi ?? "",

            especie: si.especie ?? "",
            numero_apr: si.numero_apr ?? "",
            prioridade: normalizarPrioridadeOperacao(si.prioridade),
            natureza: si.natureza ?? "",
            caracteristica_intervencao: si.caracteristica_intervencao ?? "",
            tipo: si.tipo ?? "",

            status_manutencao:
              si.status_manutencao ?? "PROGRAMADA",
            status_operacao:
              si.status_operacao ?? "PROGRAMADA",
            postergacao_traz_risco: si.postergacao_traz_risco || "NAO",

            descricao_servicos:
              si.descricao_servicos ?? "",
            observacoes: si.observacoes ?? "",

            responsavel: si.responsavel ?? "",
            substituto: si.substituto ?? "",

            aproveitamento: si.aproveitamento ?? "",
            inclusao_servico: si.inclusao_servico ?? "",
            acarreta_risco_perdas_multiplas:
              si.acarreta_risco_perdas_multiplas ?? "",
            orgaos: si.orgaos ?? "",
            tipo_programacao: si.tipo_programacao ?? "",
            dias_excecao: si.dias_excecao ?? "",
            tempo_retorno: si.tempo_retorno ?? "",
            disponivel: si.disponivel ?? "",
            risco_desligamento:
              si.risco_desligamento ?? "",
            condicoes_climaticas:
              si.condicoes_climaticas ?? "",
          });
        })
        .catch((err) => {
          console.error("Erro ao carregar SI:", err);
          toast.error("Erro ao carregar SI");
        });
    }
  }, [id, isEdit]);

  async function carregarLiberacoes() {
    if (!id) return;

    try {
      const res = await api.get(`/si/${id}/liberacoes`);
      setLiberacoes(res.data);
    } catch (error) {
      console.error("Erro ao carregar liberações da SI:", error);
      toast.error("Erro ao carregar histórico de liberações");
    }
  }

  useEffect(() => {
    if (isEdit) {
      carregarLiberacoes();
    }
  }, [id, isEdit]);

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
    const ativoSelecionado = ativos.find(
      (ativo) => Number(ativo.id_ativo) === Number(form.id_ativo)
    );
    const ativoCompleto = ativoSelecionadoDetalhes ?? ativoSelecionado;
    const especie = especiePorAtivo(ativoCompleto, tiposAtivo);

    if (especie !== form.especie) {
      setForm((prev) => ({ ...prev, especie }));
    }
  }, [ativos, ativoSelecionadoDetalhes, form.id_ativo, form.especie, tiposAtivo]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    if (name === "id_subestacao") {
      setForm((prev) => ({
        ...prev,
        id_subestacao: value === "" ? null : Number(value),
        id_ativo: null,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "id_ativo"
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

      const {
        id_si: _idSi,
        criado_em: _criadoEm,
        numero_si: _numeroSi,
        ...formBase
      } = form;
      void _idSi;
      void _criadoEm;
      void _numeroSi;

      const ativoSelecionado = ativos.find(
        (ativo) => Number(ativo.id_ativo) === Number(form.id_ativo)
      );
      const ativoCompleto = ativoSelecionadoDetalhes ?? ativoSelecionado;

      const payload = {
        ...formBase,
        ...(isEdit ? { numero_si: form.numero_si?.trim() || null } : {}),
        especie: especiePorAtivo(ativoCompleto, tiposAtivo) || form.especie,

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

        ...(isEdit
          ? { emissor: form.emissor, editado_por: usuario?.nome }
          : { emissor: usuario?.nome }),
      };

      if (isEdit) {
        await api.put(`/si/${id}`, payload);
        toast.success("SI atualizada com sucesso!");
      } else {
        await api.post("/si", payload);
        toast.success("SI cadastrada com sucesso!");
      }

    } catch (error) {
      console.error("Erro ao salvar SI:", error);
      toast.error("Erro ao salvar SI");
    }
  }

  const liberacaoEmExecucao = liberacoes.find(
    (liberacao) => liberacao.status === "EM_EXECUCAO"
  );

  function primeiroValor(...valores: Array<string | null | undefined>) {
    return valores.find((valor) => valor?.trim())?.trim() || undefined;
  }

  function responsaveisPorParte(tipo: "manutencao" | "operacao") {
    if (tipo === "manutencao") {
      return [
        ["ONS", form.responsavel_ons_manutencao],
        ["COS", form.responsavel_cot_manutencao],
        ["SE", form.responsavel_se_manutencao],
      ];
    }

    return [
      ["ONS", form.responsavel_ons_operacao],
      ["COS", form.responsavel_cot_operacao],
      ["SE", form.responsavel_se_operacao],
    ];
  }

  async function registrarLiberacaoManutencao() {
    if (!id) return;

    setSavingLiberacao(true);
    try {
      const dataHoraLiberacao = primeiroValor(
        form.responsavel_data_se_manutencao,
        form.responsavel_data_cot_manutencao,
        form.responsavel_data_ons_manutencao
      );

      await api.post(`/si/${id}/liberacoes/manutencao`, {
        data_utilizacao: dataHoraLiberacao?.slice(0, 10) || hojeISO(),
        data_hora_liberacao: dataHoraLiberacao,
        operador_liberou: primeiroValor(
          form.responsavel_se_manutencao,
          form.responsavel_cot_manutencao,
          form.responsavel_ons_manutencao
        ),
        observacoes: form.observacoes || undefined,
      });
      toast.success("Liberação para manutenção registrada.");
      await carregarLiberacoes();
    } catch (error) {
      console.error("Erro ao registrar liberação:", error);
      toast.error("Erro ao registrar liberação para manutenção.");
    } finally {
      setSavingLiberacao(false);
    }
  }

  async function registrarLiberacaoOperacao() {
    if (!id || !liberacaoEmExecucao) return;

    setSavingLiberacao(true);
    try {
      const dataHoraDevolucao = primeiroValor(
        form.responsavel_data_se_operacao,
        form.responsavel_data_cot_operacao,
        form.responsavel_data_ons_operacao
      );

      await api.put(`/si/${id}/liberacoes/${liberacaoEmExecucao.id_liberacao}/operacao`, {
        data_hora_devolucao: dataHoraDevolucao,
        operador_recebeu_devolucao: primeiroValor(
          form.responsavel_se_operacao,
          form.responsavel_cot_operacao,
          form.responsavel_ons_operacao
        ),
        observacoes: form.observacoes || undefined,
      });
      toast.success("Liberação para operação registrada.");
      await carregarLiberacoes();
    } catch (error) {
      console.error("Erro ao registrar devolução:", error);
      toast.error("Erro ao registrar liberação para operação.");
    } finally {
      setSavingLiberacao(false);
    }
  }

  async function cancelarLiberacao() {
    if (!id || !liberacaoEmExecucao) return;

    setSavingLiberacao(true);
    try {
      await api.put(`/si/${id}/liberacoes/${liberacaoEmExecucao.id_liberacao}/cancelar`, {
        observacoes: form.observacoes || undefined,
      });
      toast.success("Liberação cancelada.");
      await carregarLiberacoes();
    } catch (error) {
      console.error("Erro ao cancelar liberação:", error);
      toast.error("Erro ao cancelar liberação.");
    } finally {
      setSavingLiberacao(false);
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
            {isEdit ? (
              <input
                name="numero_si"
                onChange={handleChange}
                value={form.numero_si ?? ""}
                placeholder="Informe o número da SI"
              />
            ) : (
              <ReadOnlyValue>
                {form.numero_si || "Gerado automaticamente ao salvar"}
              </ReadOnlyValue>
            )}
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
            <ReadOnlyValue>
              {especiePorAtivo(ativoSelecionadoDetalhes ?? ativos.find(
                (ativo) => Number(ativo.id_ativo) === Number(form.id_ativo)
              ), tiposAtivo) || "Informe tensão nominal e fabricante no cadastro do ativo"}
            </ReadOnlyValue>
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
            <label>Prioridade</label>
            <select name="prioridade" value={form.prioridade ?? "NIVEL_3"} onChange={handleChange}>
              {PRIORIDADES_OPERACAO.map((prioridade) => (
                <option key={prioridade.value} value={prioridade.value}>
                  {prioridade.label}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label>Tipo</label>
            <select
              name="tipo"
              onChange={handleChange}
              value={form.tipo ?? ""}
            >
              <option value="">Selecione</option>
              {form.tipo &&
                !TIPOS_SI.some((tipo) => tipo.value === form.tipo) && (
                  <option value={form.tipo}>{form.tipo}</option>
                )}
              {TIPOS_SI.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label>Natureza</label>
            <select
              name="natureza"
              onChange={handleChange}
              value={form.natureza ?? ""}
            >
              <option value="">Selecione</option>
              {form.natureza &&
                !NATUREZAS_SI.includes(form.natureza) && (
                  <option value={form.natureza}>{form.natureza}</option>
                )}
              {NATUREZAS_SI.map((natureza) => (
                <option key={natureza} value={natureza}>
                  {natureza}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label>Caracterização da Intervenção</label>
            <select
              name="caracteristica_intervencao"
              onChange={handleChange}
              value={form.caracteristica_intervencao ?? ""}
            >
              <option value="">Selecione</option>
              {form.caracteristica_intervencao &&
                !CARACTERISTICAS_INTERVENCAO_SI.includes(form.caracteristica_intervencao) && (
                  <option value={form.caracteristica_intervencao}>
                    {form.caracteristica_intervencao}
                  </option>
                )}
              {CARACTERISTICAS_INTERVENCAO_SI.map((caracteristica) => (
                <option key={caracteristica} value={caracteristica}>
                  {caracteristica}
                </option>
              ))}
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
                  {a.codigo_ativo} - {[a.fase, a.bay].filter(Boolean).join("-")}
                </option>
              ))}
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
            <label>Acarreta risco de perdas múltiplas?</label>
            <select
              name="acarreta_risco_perdas_multiplas"
              onChange={handleChange}
              value={form.acarreta_risco_perdas_multiplas ?? ""}
            >
              <option value="">Selecione</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Postergação traz risco?</label>
            <select
              name="postergacao_traz_risco"
              onChange={handleChange}
              value={form.postergacao_traz_risco ?? ""}
            >
              <option value="">Selecione</option>
              <option value="NAO">Não</option>
              <option value="SIM_EQUIPAMENTO">Sim - Equipamento</option>
              <option value="SIM_PESSOA">Sim - Pessoa</option>
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
              <option value="COS">COS</option>
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
              {form.tipo_programacao &&
                !TIPOS_PROGRAMACAO_SI.some(
                  (tipo) => tipo.value === form.tipo_programacao
                ) && (
                  <option value={form.tipo_programacao}>
                    {form.tipo_programacao}
                  </option>
                )}
              {TIPOS_PROGRAMACAO_SI.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
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
            <UsuarioSelect
              name="responsavel"
              onChange={handleChange}
              value={form.responsavel ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Substituto</label>
            <UsuarioSelect
              name="substituto"
              onChange={handleChange}
              value={form.substituto ?? ""}
            />
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
            <label>Status de liberação para manutenção</label>
            <select
              name="status_manutencao"
              onChange={handleChange}
              value={form.status_manutencao ?? "PROGRAMADA"}
            >
              <option value="">Selecione</option>
              {form.status_manutencao &&
                !STATUS_LIBERACAO_MANUTENCAO_SI.some((status) => status.value === form.status_manutencao) && (
                  <option value={form.status_manutencao}>{form.status_manutencao}</option>
                )}
              {STATUS_LIBERACAO_MANUTENCAO_SI.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </FormGroup>

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
            <label>Responsável COS</label>
            <input
              name="responsavel_cot_manutencao"
              onChange={handleChange}
              value={form.responsavel_cot_manutencao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Data/hora COS</label>
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
            <label>Status de liberação para operação</label>
            <select
              name="status_operacao"
              onChange={handleChange}
              value={form.status_operacao ?? "PROGRAMADA"}
            >
              {form.status_operacao &&
                !STATUS_LIBERACAO_SI.some((status) => status.value === form.status_operacao) && (
                  <option value={form.status_operacao}>{form.status_operacao}</option>
                )}
              {STATUS_LIBERACAO_SI.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </FormGroup>

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
            <label>Responsável COS</label>
            <input
              name="responsavel_cot_operacao"
              onChange={handleChange}
              value={form.responsavel_cot_operacao ?? ""}
            />
          </FormGroup>

          <FormGroup>
            <label>Data/hora COS</label>
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

        {isEdit && (
          <>
            <HistoryHeader>
              <div>
                <h3>Histórico de liberações</h3>
                <span>{liberacoes.length} registro(s) para esta SI</span>
              </div>
            </HistoryHeader>

            <LiberationPanel>
              {!liberacaoEmExecucao ? (
                <>
                  <LiberationState>
                    <CheckCircle2 size={20} />
                    <div>
                      <strong>SI </strong>
                      <span>{form.status_manutencao || "Programada"}</span>
                    </div>
                  </LiberationState>

                </>
              ) : (
                <>
                  <LiberationState $active>
                    <Clock3 size={20} />
                    <div>
                      <strong>SI </strong>
                      <span>
                        Liberada em {formatarDataHora(liberacaoEmExecucao.data_hora_liberacao)}.
                      </span>
                    </div>
                  </LiberationState>

                </>
              )}
            </LiberationPanel>

            <TableWrap>
              <HistoryTable>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Liberação manutenção</th>
                    <th>Responsáveis manutenção</th>
                    <th>Liberação operação</th>
                    <th>Responsáveis operação</th>
                    <th>Status</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {liberacoes.length === 0 ? (
                    <tr>
                      <td colSpan={7}>Nenhuma liberação registrada.</td>
                    </tr>
                  ) : (
                    liberacoes.map((liberacao) => (
                      <tr key={liberacao.id_liberacao}>
                        <td>{formatarData(liberacao.data_utilizacao)}</td>
                        <td>{formatarDataHora(liberacao.data_hora_liberacao)}</td>
                        <td>
                          <ResponsibleStack>
                            {responsaveisPorParte("manutencao").map(([tipo, nome]) => (
                              <span key={tipo}>{tipo}: {nome || "-"}</span>
                            ))}
                          </ResponsibleStack>
                        </td>
                        <td>{formatarDataHora(liberacao.data_hora_devolucao)}</td>
                        <td>
                          <ResponsibleStack>
                            {responsaveisPorParte("operacao").map(([tipo, nome]) => (
                              <span key={tipo}>{tipo}: {nome || "-"}</span>
                            ))}
                          </ResponsibleStack>
                        </td>
                        <td>
                          <StatusPill $status={liberacao.status}>
                            {statusLiberacaoLabel(liberacao.status)}
                          </StatusPill>
                        </td>
                        <td>{liberacao.observacoes || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </HistoryTable>
            </TableWrap>
          </>
        )}

        <Actions>
          {isEdit && !liberacaoEmExecucao && (
            <SecondaryButton
              type="button"
              onClick={registrarLiberacaoManutencao}
              disabled={savingLiberacao}
            >
              {savingLiberacao ? <Clock3 size={18} /> : <Wrench size={18} />}
              {savingLiberacao ? "Registrando..." : "Liberar para manutenção"}
            </SecondaryButton>
          )}

          {isEdit && liberacaoEmExecucao && (
            <>
              <SecondaryButton
                type="button"
                onClick={registrarLiberacaoOperacao}
                disabled={savingLiberacao}
              >
                {savingLiberacao ? <Clock3 size={18} /> : <RotateCcw size={18} />}
                {savingLiberacao ? "Registrando..." : "Liberar para operação"}
              </SecondaryButton>

              <DangerButton
                type="button"
                onClick={cancelarLiberacao}
                disabled={savingLiberacao}
              >
                <XCircle size={18} />
                Cancelar liberação
              </DangerButton>
            </>
          )}

          <Button onClick={salvar}>
            {isEdit ? "Atualizar SI" : "Criar SI"}
          </Button>
        </Actions>
      </Card>
    </Container>
  );
}
