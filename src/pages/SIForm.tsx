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
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
`;

const SectionTitle = styled.h3`
  margin: 24px 0 12px;
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
const Input = styled.input`
  padding: 10px;
`;

const Select = styled.select`
  padding: 10px;
`;

const Textarea = styled.textarea`
  padding: 10px;
`;

const Button = styled.button`
  margin-top: 20px;
  padding: 12px;
  background: #2563eb;
  color: white;
`;

/* ================= COMPONENT ================= */

export default function SIForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const { usuario } = useAuth();

  const isEdit = Boolean(id);

  const [form, setForm] = useState<SI>({
    id_si: 0,
    numero_si: "",
    criado_em: "",
  });

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


  /* ===============================
    CARREGAR ATIVOS DA SUBESTAÇÃO
 =============================== */
  useEffect(() => {
    if (form.id_subestacao) {
      api
        .get(`/ativos/${form.id_subestacao}`)
        .then((res) => setAtivos(res.data));
    }
  }, [form.id_subestacao]);



  function handleChange(e: React.ChangeEvent<any>) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value === "" ? null : value,
    }));
  }

  useEffect(() => {
    if (isEdit) {
      api.get(`/si/${id}`).then((res) => setForm(res.data));
    }
  }, [id]);

  async function salvar() {
    try {


      const payload = {
        ...form,
        emissor: usuario?.nome
      }
      console.log("emissor:")
      console.log(usuario?.nome)

      if (isEdit) {
        await api.put(`/si/${id}`, payload);
        toast.success("SI atualizada com sucesso!");
      } else {
        await api.post("/si", payload);
        toast.success("SI cadastrada com sucesso!");
      }

      navigate("/si");
    } catch {
      toast.error("Erro ao salvar SI");
    }
  }

  return (
    <Container>
      <PageTitle>
        <h2>{isEdit ? "Editar SI" : "Nova SI"}</h2>
      </PageTitle>

      <Card>
        <SectionTitle>Identificação</SectionTitle>
        <FormGroup>
          <Input name="numero_si" placeholder="Número SI" onChange={handleChange} value={form.numero_si} />
          <Input name="numero_sgi" placeholder="Número SGI" onChange={handleChange} value={form.numero_sgi || ""} />
          <Input name="especie" placeholder="Espécie" onChange={handleChange} value={form.especie || ""} />
          <Input name="numero_apr" placeholder="APR" onChange={handleChange} value={form.numero_apr || ""} />
          <Input name="tipo" placeholder="Tipo" onChange={handleChange} value={form.tipo || ""} />
        </FormGroup>

        <FormGroup>
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
              </option>
            ))}
          </select>
        </FormGroup>


        <SectionTitle>Períodos total</SectionTitle>
        <FormGroup>
          <Input type="datetime-local" name="data_inicio_preriodo_total" onChange={handleChange} value={form.data_inicio_preriodo_total || ""} />
          <Input type="datetime-local" name="data_fim_preriodo_total" onChange={handleChange} value={form.data_fim_preriodo_total || ""} />
        </FormGroup>
        <SectionTitle>Períodos Manutenção</SectionTitle>
        <FormGroup>
          <Input type="datetime-local" name="data_inicio_preriodo_manutencao" onChange={handleChange} value={form.data_inicio_preriodo_manutencao || ""} />
          <Input type="datetime-local" name="data_fim_preriodo_manutencao" onChange={handleChange} value={form.data_fim_preriodo_manutencao || ""} />
        </FormGroup>

        <SectionTitle>Responsáveis</SectionTitle>
        <FormGroup>
          <Input name="responsavel" placeholder="Responsável" onChange={handleChange} value={form.responsavel || ""} />
          <Input name="substituto" placeholder="Substituto" onChange={handleChange} value={form.substituto || ""} />
        </FormGroup>

        <SectionTitle>Descrição</SectionTitle>
        <FormGroup>
          <Textarea name="descricao_servicos" placeholder="Descrição" onChange={handleChange} value={form.descricao_servicos || ""} />
          <Textarea name="observacoes" placeholder="Observações" onChange={handleChange} value={form.observacoes || ""} />
        </FormGroup>

        <SectionTitle>Manutenção</SectionTitle>
        <FormGroup>
          <Input name="responsavel_ons_manutencao" placeholder="ONS" onChange={handleChange} value={form.responsavel_ons_manutencao || ""} />
          <Input type="datetime-local" name="responsavel_data_ons_manutencao" onChange={handleChange} value={form.responsavel_data_ons_manutencao || ""} />
          <Input name="responsavel_cot_manutencao" placeholder="COT" onChange={handleChange} value={form.responsavel_cot_manutencao || ""} />
          <Input type="datetime-local" name="responsavel_data_cot_manutencao" onChange={handleChange} value={form.responsavel_data_cot_manutencao || ""} />

          <Input name="responsavel_se_manutencao" placeholder="SE" onChange={handleChange} value={form.responsavel_se_manutencao || ""} />

          <Input type="datetime-local" name="responsavel_data_se_manutencao" onChange={handleChange} value={form.responsavel_data_se_manutencao || ""} />
        </FormGroup>

        <SectionTitle>Operação</SectionTitle>
        <FormGroup>
          <Input name="responsavel_ons_operacao" placeholder="ONS" onChange={handleChange} value={form.responsavel_ons_operacao || ""} />
          <Input type="datetime-local" name="responsavel_data_ons_operacao" onChange={handleChange} value={form.responsavel_data_ons_operacao || ""} />
          <Input name="responsavel_cot_operacao" placeholder="COT" onChange={handleChange} value={form.responsavel_cot_operacao || ""} />
          <Input type="datetime-local" name="responsavel_data_cot_operacao" onChange={handleChange} value={form.responsavel_data_cot_operacao || ""} />
          <Input name="responsavel_se_operacao" placeholder="SE" onChange={handleChange} value={form.responsavel_se_operacao || ""} />
          <Input type="datetime-local" name="responsavel_data_se_operacao" onChange={handleChange} value={form.responsavel_data_se_operacao || ""} />

        </FormGroup>

        <Button onClick={salvar}>
          {isEdit ? "Atualizar SI" : "Salvar SI"}
        </Button>
      </Card>
    </Container>
  );
}