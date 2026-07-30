import { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../api/api";
import Container from "../components/Container";
import type { OrdemServico } from "../types/OrdemServico";
import { useParams } from "react-router-dom";
import type {Ativo} from "../types/Ativo"
import type {Subestacao} from "../types/Subestacao"
import type { TipoAtivo } from "../types/TipoAtivo";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import UsuarioSelect from "../components/UsuarioSelect";
import {
  PRIORIDADES_OPERACAO,
  especiePorAtivo,
  normalizarPrioridadeOperacao,
} from "../lib/documentosOperacao";




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

const FormGroup = styled.div<{ $invalid?: boolean }>`
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
    border: 1px solid ${({ $invalid }) => ($invalid ? "#ef4444" : "#d1d5db")};
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

const ErrorText = styled.span`
  color: #dc2626;
  font-size: 12px;
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

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

type FieldErrors = Partial<Record<keyof OrdemServico | "periodo_programado" | "periodo_execucao", string>>;

const LOCALIZACOES_FISICAS = [
  { value: "Bom Jesus da Lapa-BA", label: "Bom Jesus da Lapa" },
  { value: "Gentio do Ouro-BA", label: "Gentio do Ouro" },
  { value: "Jaiba-MG", label: "Jaiba" },
  { value: "Jaíba-MG", label: "Jaiba" },
  { value: "BURITIZEIRO-MG", label: "Buritizeiro" },
];

const ESQUEMAS_SERVICO = [
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

/* ================= COMPONENT ================= */

export  function OrdemServicoPage() {

  const { id} = useParams();

  const isEdicao = Boolean(id);


  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [ativoSelecionadoDetalhes, setAtivoSelecionadoDetalhes] = useState<Ativo | null>(null);
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);
  const { usuario } = useAuth();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<OrdemServico>({
    numero_os: "",
    numero_si: "",
    id_os: 0,

    id_subestacao: null,
    id_ativo: null,

    especie: "",
    numero_apr: "",

    instalacao: "",
    localizacao: "",
    complemento: "",

    origens: "",
    defeito: "",
    esquema_servicos: "",

    causa_primaria: "",
    causa_secundaria: "",

    prioridade: "NIVEL_3",
    responsavel: "",
    responsavel_manutencao: "",
    responsavel_operacao: "",
    substituto: "",
    emissor:"",
    editado_por: "",

  data_abertura_ss: null,
  data_inicio_programado: null,
  data_fim_programado: null,
  data_inicio_execucao: null,
  data_fim_execucao: null,



    descricao_servicos: "",
    observacoes: "",

    centro_custos: "",
    status: "ABERTA",
  });


  
// styled-components (mantive seus nomes)





  /* ===============================
     CARREGAR SUBESTAÇÕES
  =============================== */
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

 

  /* ===============================
     CARREGAR ATIVOS DA SUBESTAÇÃO
  =============================== */
  useEffect(() => {
    if (form.id_subestacao) { 
      api
        .get(`/ativos/${form.id_subestacao}`)
        .then((res) => setAtivos(res.data));
    } else {
      setAtivos([]);
    }
  }, [form.id_subestacao]);


   /* ===============================
     CARREGAR OS (EDIÇÃO)
  =============================== */
  useEffect(() => {
    if (isEdicao) {
      api.get(`/os/${id}`).then(async (res) => {
        const os = res.data;
        let idSubestacao = os.id_subestacao ?? null;

        if (!idSubestacao && os.id_ativo) {
          const ativoRes = await api.get(`/ativo/${os.id_ativo}`);
          idSubestacao = ativoRes.data.id_subestacao ?? null;
        }

        setForm({
        ...os,
        id_subestacao: idSubestacao,
        status: os.status || "ABERTA",
        prioridade: normalizarPrioridadeOperacao(os.prioridade),
        especie: os.especie,
        localizacao: os.localizacao,
        esquema_servicos: os.esquema_servicos ?? os.esquema_servico ?? "",
        centro_custos: os.centro_custos || "RIALMA TRANSMISSORA V"
      });

      });
    }
  }, [id, isEdicao]);

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

  /* ===============================
     HANDLE CHANGE GENÉRICO
  =============================== */
  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
      ...(name === "data_inicio_programado" || name === "data_fim_programado"
        ? { periodo_programado: undefined }
        : {}),
      ...(name === "data_inicio_execucao" || name === "data_fim_execucao"
        ? { periodo_execucao: undefined }
        : {}),
    }));

    setForm((prev) => {
      if (name === "id_subestacao") {
        return {
          ...prev,
          id_subestacao: value ? Number(value) : null,
          id_ativo: null,
        };
      }

      if (name === "id_ativo") {
        return {
          ...prev,
          id_ativo: value ? Number(value) : null,
        };
      }

      return { ...prev, [name]: value };
    });
  }

  function isAfter(start?: string | null, end?: string | null) {
    if (!start || !end) return true;
    return new Date(end).getTime() >= new Date(start).getTime();
  }

  function validateForm() {
    const nextErrors: FieldErrors = {};
    const temInstalacao = !!form.id_subestacao || !!form.instalacao?.trim();

    if (!temInstalacao) {
      nextErrors.id_subestacao = "Selecione a instalacao.";
    }

    if (!form.id_ativo && !isEdicao) {
      nextErrors.id_ativo = "Selecione o ativo.";
    }

    if (!form.esquema_servicos?.trim()) {
      nextErrors.esquema_servicos = "Selecione o esquema de servicos.";
    }

    if (!form.prioridade?.trim()) {
      nextErrors.prioridade = "Selecione a prioridade.";
    }

    if (!form.status?.trim()) {
      nextErrors.status = "Selecione o status.";
    }

    if (!form.responsavel?.trim()) {
      nextErrors.responsavel = "Selecione o responsavel.";
    }

    if (!form.descricao_servicos?.trim()) {
      nextErrors.descricao_servicos = "Descreva os servicos.";
    }

    if (!isAfter(form.data_inicio_programado, form.data_fim_programado)) {
      nextErrors.periodo_programado = "A data fim programada deve ser posterior ao inicio.";
    }

    if (!isAfter(form.data_inicio_execucao, form.data_fim_execucao)) {
      nextErrors.periodo_execucao = "A data fim da execucao deve ser posterior ao inicio.";
    }

    if (form.status === "PROGRAMADA") {
      if (!form.data_inicio_programado) {
        nextErrors.data_inicio_programado = "Informe o inicio programado.";
      }
      if (!form.data_fim_programado) {
        nextErrors.data_fim_programado = "Informe o fim programado.";
      }
    }

    if (form.status === "EM_EXECUCAO") {
      if (!form.data_inicio_execucao) {
        nextErrors.data_inicio_execucao = "Informe o inicio da execucao.";
      }
      if (!form.responsavel_manutencao?.trim()) {
        nextErrors.responsavel_manutencao = "Selecione o responsavel da manutencao.";
      }
    }

    if (form.status === "ENCERRADA") {
      if (!form.data_inicio_execucao) {
        nextErrors.data_inicio_execucao = "Informe o inicio da execucao.";
      }
      if (!form.data_fim_execucao) {
        nextErrors.data_fim_execucao = "Informe o fim da execucao.";
      }
      if (!form.responsavel_manutencao?.trim()) {
        nextErrors.responsavel_manutencao = "Selecione o responsavel da manutencao.";
      }
      if (!form.responsavel_operacao?.trim()) {
        nextErrors.responsavel_operacao = "Selecione o responsavel da operacao.";
      }
    }

    setErrors(nextErrors);
    return nextErrors;
  }

  /* ===============================
     SALVAR OU EDITAR
  =============================== */
  async function salvarOuEditar() {
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Revise os campos obrigatorios da OS.");
      return;
    }

    setSaving(true);
    try {



      const {
        numero_os: _numeroOs,
        id_tipo_ativo: _idTipoAtivo,
        tipo_ativo: _tipoAtivo,
        codigo_ativo: _codigoAtivo,
        fase: _fase,
        ativo: _ativo,
        ...formSemNumeroOs
      } = form;
      void _numeroOs;
      void _idTipoAtivo;
      void _tipoAtivo;
      void _codigoAtivo;
      void _fase;
      void _ativo;

      const ativoSelecionado = ativos.find(
        (ativo) => Number(ativo.id_ativo) === Number(form.id_ativo)
      );
      const ativoCompleto = ativoSelecionadoDetalhes ?? ativoSelecionado;

      const payload = {
        ...formSemNumeroOs,
        especie: especiePorAtivo(ativoCompleto, tiposAtivo) || form.especie,
        // Garante que campos vazios virem null (ou omita o campo se o backend preferir)
        data_abertura_ss: form.data_abertura_ss?.trim() || null,
        data_inicio_programado: form.data_inicio_programado?.trim() || null,
        data_fim_programado: form.data_fim_programado?.trim() || null,
        data_inicio_execucao: form.data_inicio_execucao?.trim() || null,
        data_fim_execucao: form.data_fim_execucao?.trim() || null,
        ...(isEdicao
          ? { emissor: form.emissor, editado_por: usuario?.nome }
          : { emissor: usuario?.nome }),
      };



      if (isEdicao) {
        await api.put(`/os/${id}`,  payload);
        toast.success("OS atualizada com sucesso!");
      } else {
        await api.post("/os",  payload);
        toast.success("OS cadastrada com sucesso!");
      }
    } catch (err: any) {
      console.error("Erro ao salvar OS:", err);
      toast.error(err?.response?.data?.detail || err?.message || "Erro ao salvar OS.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container>
     <PageTitle>
  <h2>
    {isEdicao ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
  </h2>
  <p>Abertura e controle de manutenção</p>
</PageTitle>


      <Card>
        {/* ===== IDENTIFICAÇÃO ===== */}
        <SectionTitle>Identificação</SectionTitle>
        <FormGrid>
          <FormGroup>
            <label>Nº OS</label>
            <ReadOnlyValue>
              {form.numero_os || "Gerado automaticamente ao salvar"}
            </ReadOnlyValue>
          </FormGroup>

          <FormGroup>
            <label>Nº SI</label>
            <input name="numero_si" onChange={handleChange} value={form.numero_si}/>
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
            <input name="numero_apr" onChange={handleChange} value={form.numero_apr}/>
          </FormGroup>
        </FormGrid>

        {/* ===== LOCALIZAÇÃO / INSTALAÇÃO ===== */}
        <SectionTitle>Localização</SectionTitle>
        <FormGrid>
          <FormGroup $invalid={!!errors.id_subestacao}>
            <label>Instalação (Subestação)</label>
            <select
              name="id_subestacao"
              value={form.id_subestacao?.toString() ?? ""}
              onChange={handleChange}
            >
              <option value="">Selecione</option>
              {subestacoes.map((s) => (
                <option
                  key={s.id_subestacao}
                  value={String(s.id_subestacao ?? "")}
                >
                  {s.nome}
                </option>
              ))}
            </select>
            {errors.id_subestacao && <ErrorText>{errors.id_subestacao}</ErrorText>}
          </FormGroup>

          <FormGroup $invalid={!!errors.id_ativo}>
            <label>Ativo</label>
      
            <select
              name="id_ativo"
              value={form.id_ativo ?? ""}
              onChange={handleChange}
              disabled={!form.id_subestacao}
            >
              <option value="">Selecione</option>
              {ativos.map((a) => (
                <option key={a.id_ativo} value={String(a.id_ativo ?? "")}>
                  {a.codigo_ativo} - {[a.fase, a.bay].filter(Boolean).join("-")}
                </option>
              ))}
            </select>
            {errors.id_ativo && <ErrorText>{errors.id_ativo}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <label>Localização Física</label>
           
            
              <select name="localizacao" onChange={handleChange} value={form.localizacao ?? ""}>
              <option value="">Selecione</option>
              {form.localizacao &&
                !LOCALIZACOES_FISICAS.some((local) => local.value === form.localizacao) && (
                  <option value={form.localizacao}>{form.localizacao}</option>
                )}
              <option value="Bom Jesus da Lapa II">Bom Jesus da Lapa II</option>
              <option value="Gentio do Ouro II">Gentio do Ouro II</option>
              <option value="Jaíba">Jaíba</option>
              <option value="BURITIZEIRO III">Buritizeiro III</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Complemento</label>
            <input name="complemento" onChange={handleChange} value={form.complemento ?? ""} />
          </FormGroup>
        </FormGrid>

        {/* ===== ANÁLISE ===== */}
        <SectionTitle>Análise</SectionTitle>
        <FormGrid>
          <FormGroup>
            <label>Origem</label>
            <textarea name="origens" onChange={handleChange} value={form.origens ?? ""} />
          </FormGroup>

          <FormGroup>
            <label>Defeito</label>
            <textarea name="defeito" onChange={handleChange} value={form.defeito ?? ""}/>
          </FormGroup>

          <FormGroup $invalid={!!errors.esquema_servicos}>
            <label>Esquema de Serviços</label>
            

              <select name="esquema_servicos" onChange={handleChange} value={form.esquema_servicos ?? ""}>
              <option value="">Selecione</option>
              {form.esquema_servicos &&
                !ESQUEMAS_SERVICO.some((esquema) => esquema.value === form.esquema_servicos) && (
                  <option value={form.esquema_servicos}>{form.esquema_servicos}</option>
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
            {errors.esquema_servicos && <ErrorText>{errors.esquema_servicos}</ErrorText>}
          </FormGroup>
        </FormGrid>

        {/* ===== CAUSAS ===== */}
        <SectionTitle>Causas</SectionTitle>
        <FormGrid>
          <FormGroup>
            <label>Causa Primária</label>
            <textarea name="causa_primaria" onChange={handleChange} value={form.causa_primaria} />
          </FormGroup>

          <FormGroup>
            <label>Causa Secundária</label>
            <textarea name="causa_secundaria" onChange={handleChange} value={form.causa_secundaria} />
          </FormGroup>
        </FormGrid>

        {/* ===== PLANEJAMENTO ===== */}
        <SectionTitle>Planejamento</SectionTitle>
        <FormGrid>
          <FormGroup>
            <label>Abertura SS</label>
            <input
              type="datetime-local"
              name="data_abertura_ss"
              onChange={handleChange}
              value={form.data_abertura_ss ?? ""}
            
            />
          </FormGroup>

          <FormGroup $invalid={!!errors.data_inicio_programado || !!errors.periodo_programado}>
            <label>Início Programado</label>
            <input
              type="datetime-local"
              name="data_inicio_programado"
              onChange={handleChange}
              value={form.data_inicio_programado ?? ""}
            />
            {errors.data_inicio_programado && <ErrorText>{errors.data_inicio_programado}</ErrorText>}
            {errors.periodo_programado && <ErrorText>{errors.periodo_programado}</ErrorText>}
          </FormGroup>

          <FormGroup $invalid={!!errors.data_fim_programado || !!errors.periodo_programado}>
            <label>Fim Programado</label>
            <input
              type="datetime-local"
              name="data_fim_programado"
              onChange={handleChange}
              value={form.data_fim_programado ?? ""}
            />
            {errors.data_fim_programado && <ErrorText>{errors.data_fim_programado}</ErrorText>}
          </FormGroup>
        </FormGrid>

 

        {/* ===== CONTROLE ===== */}
        <SectionTitle>Controle</SectionTitle>
        <FormGrid>
          <FormGroup $invalid={!!errors.prioridade}>
            <label>Prioridade</label>
            <select name="prioridade" onChange={handleChange} value={form.prioridade}>
              {PRIORIDADES_OPERACAO.map((prioridade) => (
                <option key={prioridade.value} value={prioridade.value}>
                  {prioridade.label}
                </option>
              ))}
            </select>
            {errors.prioridade && <ErrorText>{errors.prioridade}</ErrorText>}
          </FormGroup>

          <FormGroup $invalid={!!errors.responsavel}>
            <label>Responsável</label>
            <UsuarioSelect name="responsavel" onChange={handleChange} value={form.responsavel} />
            {errors.responsavel && <ErrorText>{errors.responsavel}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <label>Substituto</label>
         

            <UsuarioSelect name="substituto" onChange={handleChange} value={form.substituto} />
          </FormGroup>

          <FormGroup>
            <label>Centro de Custos</label>
            <input name="centro_custos" onChange={handleChange} value={"RIALMA TRANSMISSORA V"}/>
          </FormGroup>

          <FormGroup $invalid={!!errors.status}>
            <label>Status</label>
            <select name="status" onChange={handleChange} value={form.status}>
              <option value="ABERTA">Aberta</option>
              <option value="PROGRAMADA">Programada</option>
              <option value="EM_EXECUCAO">Em Execução</option>
              <option value="ENCERRADA">Encerrada</option>
            </select>
            {errors.status && <ErrorText>{errors.status}</ErrorText>}
          </FormGroup>
        </FormGrid>

        {/* ===== LIBERAÇÃO PARA MANUTENÇÃO  ===== */}
        <SectionTitle>Liberação para manutenção</SectionTitle>
        <FormGrid>
          <FormGroup $invalid={!!errors.data_inicio_execucao || !!errors.periodo_execucao}>
            <label>Data/hora </label>
            <input
              type="datetime-local"
              name="data_inicio_execucao"
              onChange={handleChange}
              value={form.data_inicio_execucao ?? ""}
            
            />
            {errors.data_inicio_execucao && <ErrorText>{errors.data_inicio_execucao}</ErrorText>}
            {errors.periodo_execucao && <ErrorText>{errors.periodo_execucao}</ErrorText>}
          </FormGroup>

             <FormGroup $invalid={!!errors.responsavel_manutencao}>
            <label>Responsável Manutenção</label>
        
            <UsuarioSelect name="responsavel_manutencao" onChange={handleChange} value={form.responsavel_manutencao} />
            {errors.responsavel_manutencao && <ErrorText>{errors.responsavel_manutencao}</ErrorText>}
          </FormGroup>



        </FormGrid>

        {/* ===== LIBERAÇÃO PARA OPERAÇÃO  ===== */}
        <SectionTitle>Liberação para operação</SectionTitle>
        <FormGrid>
          <FormGroup $invalid={!!errors.data_fim_execucao || !!errors.periodo_execucao}>
            <label>Data/hora </label>
            <input
              type="datetime-local"
              name="data_fim_execucao"
              onChange={handleChange}
              value={form.data_fim_execucao ?? ""}
            
            />
            {errors.data_fim_execucao && <ErrorText>{errors.data_fim_execucao}</ErrorText>}
          </FormGroup>

             <FormGroup $invalid={!!errors.responsavel_operacao}>
            <label>Responsável Liberação</label>
        
            <UsuarioSelect name="responsavel_operacao" onChange={handleChange} value={form.responsavel_operacao} />
            {errors.responsavel_operacao && <ErrorText>{errors.responsavel_operacao}</ErrorText>}
          </FormGroup>



        </FormGrid>



        {/* ===== ENCERRAMENTO ===== */}
        <SectionTitle>Encerramento</SectionTitle>
        <FormGrid>
          <FormGroup $invalid={!!errors.descricao_servicos}>
            <label>Descrição dos Serviços</label>
            <textarea
              name="descricao_servicos"
              onChange={handleChange}
              value={form.descricao_servicos}
            />
            {errors.descricao_servicos && <ErrorText>{errors.descricao_servicos}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <label>Observações</label>
            <textarea name="observacoes" onChange={handleChange} value={form.observacoes} />
            
          </FormGroup>
        </FormGrid>

        <Actions>
         <Button onClick={salvarOuEditar} disabled={saving}>
  {saving ? "Salvando..." : isEdicao ? "Editar Ordem de Serviço" : "Criar OS"}
</Button>

        </Actions>
      </Card>
   
    </Container>
  );
}
