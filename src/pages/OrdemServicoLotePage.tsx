import { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../api/api";
import Container from "../components/Container";
import { useNavigate } from "react-router-dom";
import type { Subestacao } from "../types/Subestacao";
import { useAuth } from "../context/AuthContext";

/* ================= TYPES ================= */

type TipoAtivo = {
  id_tipo_ativo: number;
  nome: string;
};

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

export function OrdemServicoLotePage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);

  const [form, setForm] = useState<any>({
    numero_os: "",
    numero_si: "",
    id_os: 0,

    id_subestacao: null,
    id_tipo_ativo: null,

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

    prioridade: "MEDIA",
    responsavel: "",
    responsavel_manutencao: "",
    responsavel_operacao: "",
    substituto: "",
    emissor: "",

    data_abertura_ss: null,
    data_inicio_programado: null,
    data_fim_programado: null,
    data_inicio_execucao: null,
    data_fim_execucao: null,

    descricao_servicos: "",
    observacoes: "",

    centro_custos: "RIALMA TRANSMISSORA V",
    status: "ABERTA",
  });

  /* ================= LOAD ================= */

  useEffect(() => {
    api.get("/subestacao/ativas").then(res => setSubestacoes(res.data));
    api.get("/tipo-ativo").then(res => setTiposAtivo(res.data));
  }, []);

  /* ================= HANDLE ================= */

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((prev: any) => ({
      ...prev,
      [name]: value === "" ? null : value,
    }));
  }

  /* ================= SALVAR ================= */

  async function salvarOuEditar() {
    try {
      const payload = {
        ...form,
        emissor: usuario?.nome,

        data_abertura_ss: form.data_abertura_ss || null,
        data_inicio_programado: form.data_inicio_programado || null,
        data_fim_programado: form.data_fim_programado || null,
        data_inicio_execucao: form.data_inicio_execucao || null,
        data_fim_execucao: form.data_fim_execucao || null,
      };

      await api.post("os/lote-por-tipo-ativo", payload);

      alert("OS em lote criada com sucesso!");
      navigate("/os");
    } catch (err) {
      console.error("Erro ao salvar OS:", err);
    }
  }

  /* ================= UI ================= */

  return (
    <Container>
      <PageTitle>
        <h2>Nova Ordem de Serviço em Lote</h2>
        <p>Abertura e controle de manutenção</p>
      </PageTitle>

      <Card>

        {/* IDENTIFICAÇÃO */}
        <SectionTitle>Identificação</SectionTitle>
        <FormGrid>
          <FormGroup>
            <label>Nº OS</label>
            <input name="numero_os" onChange={handleChange} value={form.numero_os} />
          </FormGroup>

          <FormGroup>
            <label>Nº SI</label>
            <input name="numero_si" onChange={handleChange} value={form.numero_si} />
          </FormGroup>

          <FormGroup>
            <label>Espécie</label>
            <select name="especie" onChange={handleChange} value={form.especie}>
              <option value="EAT">EAT</option>
              <option value="SPCS">SPCS</option>
              <option value="TELECON">TELECON</option>
              <option value="SERVIÇO AUXÍLIAR">SERVIÇO AUXÍLIAR</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Nº APR</label>
            <input name="numero_apr" onChange={handleChange} value={form.numero_apr} />
          </FormGroup>
        </FormGrid>

        {/* LOCALIZAÇÃO */}
        <SectionTitle>Localização</SectionTitle>
        <FormGrid>
          <FormGroup>
            <label>Subestação</label>
            <select name="id_subestacao" value={form.id_subestacao ?? ""} onChange={handleChange}>
              <option value="">Selecione</option>
              {subestacoes.map(s => (
                <option key={s.id_subestacao} value={s.id_subestacao}>
                  {s.nome}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label>Tipo de Ativo</label>
            <select name="id_tipo_ativo" value={form.id_tipo_ativo ?? ""} onChange={handleChange}>
              <option value="">Selecione</option>
              {tiposAtivo.map(t => (
                <option key={t.id_tipo_ativo} value={t.id_tipo_ativo}>
                  {t.nome}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label>Localização Física</label>
            <select name="localizacao" value={form.localizacao ?? ""} onChange={handleChange}>
              <option value="Bom Jesus da Lapa-BA">Bom Jesus da Lapa</option>
              <option value="Gentio do Ouro-BA">Gentio do Ouro</option>
              <option value="Jaíba-MG">Jaíba</option>
              <option value="BURITIZEIRO-MG">Buritizeiro</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Complemento</label>
            <input name="complemento" value={form.complemento ?? ""} onChange={handleChange} />
          </FormGroup>
        </FormGrid>

        {/* ANÁLISE */}
        <SectionTitle>Análise</SectionTitle>
        <FormGrid>
          <FormGroup>
            <label>Origem</label>
            <textarea name="origens" value={form.origens ?? ""} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Defeito</label>
            <textarea name="defeito" value={form.defeito ?? ""} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Esquema de Serviços</label>
            <select name="esquema_servicos" value={form.esquema_servicos ?? ""} onChange={handleChange}>
              <option value="MANUTENÇÃO PREVENTIVA">Manutenção Preventiva</option>
              <option value="MANUTENÇÃO CORRETIVA">Manutenção Corretiva</option>
              <option value="Monitoramento">Monitoramento</option>
              <option value="Atendimento Recomendação">Atendimento Recomendação</option>
            </select>
          </FormGroup>
        </FormGrid>

        {/* CAUSAS */}
        <SectionTitle>Causas</SectionTitle>
        <FormGrid>
          <FormGroup>
            <label>Causa Primária</label>
            <textarea name="causa_primaria" value={form.causa_primaria ?? ""} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Causa Secundária</label>
            <textarea name="causa_secundaria" value={form.causa_secundaria ?? ""} onChange={handleChange} />
          </FormGroup>
        </FormGrid>

        {/* PLANEJAMENTO */}
        <SectionTitle>Planejamento</SectionTitle>
        <FormGrid>
          <FormGroup>
            <label>Abertura SS</label>
            <input type="datetime-local" name="data_abertura_ss" value={form.data_abertura_ss ?? ""} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Início Programado</label>
            <input type="datetime-local" name="data_inicio_programado" value={form.data_inicio_programado ?? ""} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Fim Programado</label>
            <input type="datetime-local" name="data_fim_programado" value={form.data_fim_programado ?? ""} onChange={handleChange} />
          </FormGroup>
        </FormGrid>

        {/* CONTROLE */}
        <SectionTitle>Controle</SectionTitle>
        <FormGrid>
          <FormGroup>
            <label>Prioridade</label>
            <select name="prioridade" value={form.prioridade} onChange={handleChange}>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label>Responsável</label>
            <input name="responsavel" value={form.responsavel} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Substituto</label>
            <input name="substituto" value={form.substituto} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="ABERTA">Aberta</option>
              <option value="PROGRAMADA">Programada</option>
              <option value="EM_EXECUCAO">Execução</option>
              <option value="ENCERRADA">Encerrada</option>
            </select>
          </FormGroup>
        </FormGrid>

        {/* EXECUÇÃO */}
        <SectionTitle>Execução</SectionTitle>
        <FormGrid>
          <FormGroup>
            <label>Início Execução</label>
            <input type="datetime-local" name="data_inicio_execucao" value={form.data_inicio_execucao ?? ""} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Responsável Manutenção</label>
            <input name="responsavel_manutencao" value={form.responsavel_manutencao} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Fim Execução</label>
            <input type="datetime-local" name="data_fim_execucao" value={form.data_fim_execucao ?? ""} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Responsável Operação</label>
            <input name="responsavel_operacao" value={form.responsavel_operacao} onChange={handleChange} />
          </FormGroup>
        </FormGrid>

        {/* ENCERRAMENTO */}
        <SectionTitle>Encerramento</SectionTitle>
        <FormGrid>
          <FormGroup>
            <label>Descrição dos Serviços</label>
            <textarea name="descricao_servicos" value={form.descricao_servicos ?? ""} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <label>Observações</label>
            <textarea name="observacoes" value={form.observacoes ?? ""} onChange={handleChange} />
          </FormGroup>
        </FormGrid>

        <Actions>
          <Button onClick={salvarOuEditar}>
            Criar Ordem de Serviço em Lote
          </Button>
        </Actions>

      </Card>
    </Container>
  );
}