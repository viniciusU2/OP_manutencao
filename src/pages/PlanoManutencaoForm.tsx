import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import Container from "../components/Container";
import type { TipoAtivo } from "../types/TipoAtivo";
import type {
  PeriodicidadePlano,
  PlanoItemCreate,
  PlanoManutencaoCreate,
  PlanoManutencaoReadFull,
} from "../types/planoManutencao";

const periodicidades: Array<{ label: string; value: PeriodicidadePlano }> = [
  { label: "Semanal", value: "SEMANAL" },
  { label: "Mensal", value: "MENSAL" },
  { label: "Bimestral", value: "BIMESTRAL" },
  { label: "Trimestral", value: "TRIMESTRAL" },
  { label: "Semestral", value: "SEMESTRAL" },
  { label: "Anual", value: "ANUAL" },
  { label: "3 anos", value: "3_ANOS" },
  { label: "5 anos", value: "5_ANOS" },
  { label: "6 anos", value: "6_ANOS" },
];

const emptyItem = (ordem: number): PlanoItemCreate => ({
  nome_item: "",
  descricao: "",
  periodicidade: "MENSAL",
  unidade: "",
  valor_referencia: undefined,
  tolerancia: undefined,
  data_inicio: "",
  intervalo: 1,
  antecedencia: 0,
  ordem,
});

const emptyForm = (idTipoAtivo = 0): PlanoManutencaoCreate => ({
  id_tipo_ativo: idTipoAtivo,
  descricao_geral: "",
  materiais_previstos: "",
  procedimentos_instrucoes: "",
  requisitos_de_seguranca: "",
  observacao_geral: "",
  itens: [emptyItem(1)],
});

function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function planoToForm(plano: PlanoManutencaoReadFull): PlanoManutencaoCreate {
  return {
    id_tipo_ativo: plano.id_tipo_ativo,
    descricao_geral: plano.descricao_geral ?? "",
    materiais_previstos: plano.materiais_previstos ?? "",
    procedimentos_instrucoes: plano.procedimentos_instrucoes ?? "",
    requisitos_de_seguranca: plano.requisitos_de_seguranca ?? "",
    observacao_geral: plano.observacao_geral ?? "",
    itens: ((plano.itens ?? []).length ? plano.itens : [emptyItem(1)])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((item, index) => ({
        nome_item: item.nome_item ?? "",
        descricao: item.descricao ?? "",
        periodicidade: item.periodicidade,
        unidade: item.unidade ?? "",
        valor_referencia: item.valor_referencia ?? undefined,
        tolerancia: item.tolerancia ?? undefined,
        data_inicio: toDateInput(item.data_inicio),
        intervalo: item.intervalo || 1,
        antecedencia: item.antecedencia || 0,
        ordem: item.ordem || index + 1,
      })),
  };
}

const PageTitle = styled.div`
  margin-bottom: 24px;

  h2 {
    font-family: "Poppins", sans-serif;
    font-size: 24px;
    font-weight: 600;
    margin: 0;
    color: #0f172a;
  }

  p {
    margin-top: 4px;
    color: #64748b;
    font-size: 14px;
  }
`;

const Card = styled.form`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
`;

const Section = styled.section`
  & + & {
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid #e2e8f0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
`;

const Field = styled.label<{ $full?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  grid-column: ${({ $full }) => ($full ? "1 / -1" : "auto")};
  color: #334155;
  font-size: 13px;
  font-weight: 500;

  input,
  select,
  textarea {
    width: 100%;
    min-width: 0;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    color: #0f172a;
    font-size: 14px;
    padding: 10px 12px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  textarea {
    min-height: 92px;
    resize: vertical;
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
`;

const ItemBox = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 18px;
  background: #f8fafc;

  & + & {
    margin-top: 16px;
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  strong {
    color: #0f172a;
    font-size: 14px;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
`;

const ActionButton = styled.button<{ $variant?: "primary" | "danger" | "ghost" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === "danger"
        ? "#fecaca"
        : $variant === "ghost"
        ? "#cbd5e1"
        : "#2563eb"};
  border-radius: 6px;
  background: ${({ $variant }) =>
    $variant === "danger"
      ? "#fff1f2"
      : $variant === "ghost"
      ? "#ffffff"
      : "#2563eb"};
  color: ${({ $variant }) =>
    $variant === "danger"
      ? "#b91c1c"
      : $variant === "ghost"
      ? "#334155"
      : "#ffffff"};
  padding: 9px 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: ${({ $variant }) =>
      $variant === "danger"
        ? "#ffe4e6"
        : $variant === "ghost"
        ? "#f8fafc"
        : "#1d4ed8"};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

export default function PlanoManutencaoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingPlano, setLoadingPlano] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PlanoManutencaoCreate>(emptyForm());

  const canRemoveItem = useMemo(() => form.itens.length > 1, [form.itens.length]);

  useEffect(() => {
    async function carregarTipos() {
      setLoadingTipos(true);

      try {
        const { data } = await api.get<TipoAtivo[]>("/tipo-ativo");
        setTiposAtivo(data);

        const firstId = data.find((tipo) => tipo.id_tipo_ativo)?.id_tipo_ativo;
        if (firstId && !isEdit) {
          setForm((prev) => ({ ...prev, id_tipo_ativo: firstId }));
        }
      } catch {
        toast.error("Erro ao carregar tipos de ativo");
      } finally {
        setLoadingTipos(false);
      }
    }

    carregarTipos();
  }, [isEdit]);

  useEffect(() => {
    async function carregarPlano() {
      if (!id) return;

      setLoadingPlano(true);

      try {
        const { data } = await api.get<PlanoManutencaoReadFull>(
          `/planos-manutencao/${id}`
        );
        setForm(planoToForm(data));
      } catch {
        toast.error("Erro ao carregar plano de manutencao");
        navigate("/planos-manutencao");
      } finally {
        setLoadingPlano(false);
      }
    }

    carregarPlano();
  }, [id, navigate]);

  function handlePlanoChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "id_tipo_ativo" ? Number(value) : value,
    }));
  }

  function handleItemChange(
    index: number,
    field: keyof PlanoItemCreate,
    value: string
  ) {
    setForm((prev) => {
      const itens = prev.itens.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (
          field === "intervalo" ||
          field === "antecedencia" ||
          field === "ordem" ||
          field === "valor_referencia" ||
          field === "tolerancia"
        ) {
          return {
            ...item,
            [field]: value === "" ? undefined : Number(value),
          };
        }

        return {
          ...item,
          [field]: value,
        };
      });

      return { ...prev, itens };
    });
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      itens: [...prev.itens, emptyItem(prev.itens.length + 1)],
    }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({
      ...prev,
      itens: prev.itens
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, ordem: itemIndex + 1 })),
    }));
  }

  function buildPayload(): PlanoManutencaoCreate {
    return {
      ...form,
      itens: form.itens.map((item, index) => ({
        ...item,
        descricao: item.descricao?.trim() || undefined,
        unidade: item.unidade?.trim() || undefined,
        data_inicio: item.data_inicio || undefined,
        intervalo: item.intervalo || 1,
        antecedencia: item.antecedencia || 0,
        ordem: index + 1,
      })),
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.id_tipo_ativo) {
      toast.error("Selecione um tipo de ativo");
      return;
    }

    if (form.itens.some((item) => !item.nome_item.trim())) {
      toast.error("Preencha o nome de todos os itens");
      return;
    }

    if (form.itens.some((item) => !item.intervalo || item.intervalo < 1)) {
      toast.error("O intervalo dos itens deve ser maior que zero");
      return;
    }

    setSaving(true);

    try {
      if (isEdit) {
        await api.put(`/planos-manutencao/${id}`, buildPayload());
        toast.success("Plano de manutencao editado com sucesso");
        navigate("/planos-manutencao");
        return;
      }

      await api.post("/planos-manutencao/", buildPayload());
      toast.success("Plano de manutencao criado com sucesso");

      setForm(emptyForm(tiposAtivo[0]?.id_tipo_ativo ?? 0));
    } catch {
      toast.error(
        isEdit
          ? "Erro ao editar plano de manutencao"
          : "Erro ao criar plano de manutencao"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container>
      <PageTitle>
        <h2>{isEdit ? "Editar Plano de Manutencao" : "Novo Plano de Manutencao"}</h2>
        <p>
          {isEdit
            ? "Atualize o plano preventivo e seus itens de execucao."
            : "Cadastre o plano preventivo e seus itens de execucao."}
        </p>
      </PageTitle>

      {loadingPlano ? (
        <div className="rounded-md border bg-white p-6 text-sm text-slate-500">
          Carregando plano...
        </div>
      ) : (

      <Card onSubmit={handleSubmit}>
        <Section>
          <SectionHeader>
            <h3>Dados do plano</h3>
          </SectionHeader>

          <FormGrid>
            <Field>
              Tipo de ativo
              <select
                name="id_tipo_ativo"
                value={form.id_tipo_ativo}
                onChange={handlePlanoChange}
                disabled={loadingTipos}
              >
                <option value={0}>
                  {loadingTipos ? "Carregando..." : "Selecione..."}
                </option>
                {tiposAtivo.map((tipo) => (
                  <option key={tipo.id_tipo_ativo} value={tipo.id_tipo_ativo}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
            </Field>

            <Field $full>
              Descricao geral
              <textarea
                name="descricao_geral"
                value={form.descricao_geral}
                onChange={handlePlanoChange}
                placeholder="Ex: Realizar manutencao preventiva mensal do ativo"
              />
            </Field>

            <Field $full>
              Materiais previstos
              <textarea
                name="materiais_previstos"
                value={form.materiais_previstos}
                onChange={handlePlanoChange}
                placeholder="Ferramentas, EPIs, instrumentos ou materiais necessarios"
              />
            </Field>

            <Field $full>
              Procedimentos e instrucoes
              <textarea
                name="procedimentos_instrucoes"
                value={form.procedimentos_instrucoes}
                onChange={handlePlanoChange}
                placeholder="Passos principais para executar a manutencao"
              />
            </Field>

            <Field $full>
              Requisitos de seguranca
              <textarea
                name="requisitos_de_seguranca"
                value={form.requisitos_de_seguranca}
                onChange={handlePlanoChange}
                placeholder="Bloqueios, sinalizacoes e cuidados obrigatorios"
              />
            </Field>

            <Field $full>
              Observacao geral
              <textarea
                name="observacao_geral"
                value={form.observacao_geral}
                onChange={handlePlanoChange}
              />
            </Field>
          </FormGrid>
        </Section>

        <Section>
          <SectionHeader>
            <h3>Itens do plano</h3>
            <ActionButton type="button" $variant="ghost" onClick={addItem}>
              <Plus size={16} />
              Adicionar item
            </ActionButton>
          </SectionHeader>

          {form.itens.map((item, index) => (
            <ItemBox key={index}>
              <ItemHeader>
                <strong>Item {index + 1}</strong>
                <ActionButton
                  type="button"
                  $variant="danger"
                  onClick={() => removeItem(index)}
                  disabled={!canRemoveItem}
                  title="Remover item"
                >
                  <Trash2 size={16} />
                  Remover
                </ActionButton>
              </ItemHeader>

              <FormGrid>
                <Field>
                  Nome do item
                  <input
                    value={item.nome_item}
                    onChange={(event) =>
                      handleItemChange(index, "nome_item", event.target.value)
                    }
                    placeholder="Ex: Verificar pressao SF6"
                  />
                </Field>

                <Field>
                  Periodicidade
                  <select
                    value={item.periodicidade}
                    onChange={(event) =>
                      handleItemChange(index, "periodicidade", event.target.value)
                    }
                  >
                    {periodicidades.map((periodicidade) => (
                      <option
                        key={periodicidade.value}
                        value={periodicidade.value}
                      >
                        {periodicidade.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field>
                  Unidade
                  <input
                    value={item.unidade ?? ""}
                    onChange={(event) =>
                      handleItemChange(index, "unidade", event.target.value)
                    }
                    placeholder="Ex: V, A, psi"
                  />
                </Field>

                <Field>
                  Valor referencia
                  <input
                    type="number"
                    step="0.0001"
                    value={item.valor_referencia ?? ""}
                    onChange={(event) =>
                      handleItemChange(index, "valor_referencia", event.target.value)
                    }
                  />
                </Field>

                <Field>
                  Tolerancia
                  <input
                    type="number"
                    step="0.0001"
                    value={item.tolerancia ?? ""}
                    onChange={(event) =>
                      handleItemChange(index, "tolerancia", event.target.value)
                    }
                  />
                </Field>

                <Field>
                  Data inicial
                  <input
                    type="date"
                    value={item.data_inicio ?? ""}
                    onChange={(event) =>
                      handleItemChange(index, "data_inicio", event.target.value)
                    }
                  />
                </Field>

                <Field>
                  Intervalo
                  <input
                    type="number"
                    min={1}
                    value={item.intervalo ?? ""}
                    onChange={(event) =>
                      handleItemChange(index, "intervalo", event.target.value)
                    }
                  />
                </Field>

                <Field>
                  Antecedencia
                  <input
                    type="number"
                    min={0}
                    value={item.antecedencia ?? ""}
                    onChange={(event) =>
                      handleItemChange(index, "antecedencia", event.target.value)
                    }
                  />
                </Field>

                <Field $full>
                  Descricao do item
                  <textarea
                    value={item.descricao ?? ""}
                    onChange={(event) =>
                      handleItemChange(index, "descricao", event.target.value)
                    }
                  />
                </Field>
              </FormGrid>
            </ItemBox>
          ))}
        </Section>

        <Actions>
          <ActionButton type="submit" disabled={saving}>
            <Save size={16} />
            {saving ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Salvar plano"}
          </ActionButton>
        </Actions>
      </Card>
      )}
    </Container>
  );
}
