import { useEffect, useState } from "react";
import styled from "styled-components";
import { toast } from "sonner";

import api from "../api/api";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../components/ui/select";
import { Card } from "../components/ui/card";

// ================= TYPES =================
type Status = "OK" | "NOK" | "NA";

interface ResultadoItem {
  id_item_template: number;
  valor_medido?: number;
  status_item: Status;
  observacao_item?: string;
}

interface Ativo {
  id_ativo: number;
  codigo_ativo: string;
  id_tipo_ativo: number;
}

// ================= STYLES =================
const Container = styled.div`
  padding: 24px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const FullWidth = styled.div`
  grid-column: span 2;
`;

const Section = styled.div`
  grid-column: span 2;
  margin-top: 20px;
`;

const CardItem = styled.div<{ status: Status }>`
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;

  background-color: ${({ status }) =>
    status === "OK"
      ? "#f0fdf4"
      : status === "NOK"
      ? "#fef2f2"
      : "#ffffff"};
`;

const HeaderItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const StatusBadge = styled.span<{ status: Status }>`
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: bold;

  background-color: ${({ status }) =>
    status === "OK"
      ? "#dcfce7"
      : status === "NOK"
      ? "#fee2e2"
      : "#e5e7eb"};
`;

const GridItem = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 2fr;
  gap: 10px;
  align-items: center;
`;

const Info = styled.div`
  font-size: 12px;
  opacity: 0.7;
`;

const Actions = styled.div`
  grid-column: span 2;
  display: flex;
  justify-content: flex-end;
`;

// ================= COMPONENT =================
export default function InspecaoForm() {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const [form, setForm] = useState({
    id_ativo: 0,
    periodicidade: "MENSAL",
    responsavel: "",
    observacao_geral: "",
    resultados: [] as ResultadoItem[],
  });

  // ================= LOAD DADOS =================
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [ativosRes] = await Promise.all([api.get("/ativo")]);

        setAtivos(ativosRes.data);
      } catch {
        toast.error("Erro ao carregar dados");
      }
    };

    loadInitial();
  }, []);

  // ================= PEGAR TIPO DO ATIVO =================
  const tipoAtivoId = ativos.find(
    (a) => a.id_ativo === form.id_ativo
  )?.id_tipo_ativo;

  // ================= LOAD TEMPLATE =================
  useEffect(() => {
    const loadTemplates = async () => {
      if (!tipoAtivoId) return;

      try {
        const { data } = await api.get(
          `/inspecoes/item-templates/tipo/${tipoAtivoId}`
        );

        const filtrados = data.filter(
          (i: any) => i.periodicidade === form.periodicidade
        );

        setTemplates(filtrados);

        const resultados = filtrados.map((item: any) => ({
          id_item_template: item.id_item_template,
          status_item: "NA" as Status,
          valor_medido: undefined,
          observacao_item: "",
        }));

        setForm((prev) => ({ ...prev, resultados }));
      } catch {
        toast.error("Erro ao carregar templates");
      }
    };

    loadTemplates();
  }, [tipoAtivoId, form.periodicidade]);

  // ================= LÓGICA =================
  const calcularStatus = (valor: number, item: any): Status => {
    if (!item.valor_referencia || !item.tolerancia) return "OK";

    const min = item.valor_referencia - item.tolerancia;
    const max = item.valor_referencia + item.tolerancia;

    return valor < min || valor > max ? "NOK" : "OK";
  };

  const updateResultado = (
    index: number,
    field: keyof ResultadoItem,
    value: any
  ) => {
    const novos = [...form.resultados];
    const atual = novos[index];
    if (!atual) return;

    novos[index] = { ...atual, [field]: value };

    setForm((prev) => ({ ...prev, resultados: novos }));
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/inspecoes", form);
      toast.success("Inspeção salva!");
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  // ================= RENDER =================
  return (
    <Container>
      <Card className="p-8">
        <Title>Nova Inspeção</Title>

        <Form onSubmit={handleSubmit}>
          {/* ATIVO SELECT */}
          <Select
            value={form.id_ativo ? String(form.id_ativo) : ""}
            onValueChange={(v) =>
              setForm({ ...form, id_ativo: Number(v) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o ativo" />
            </SelectTrigger>
            <SelectContent>
              {ativos.map((a) => (
                <SelectItem
                  key={a.id_ativo}
                  value={String(a.id_ativo)}
                >
                  {a.id_ativo} - {a.codigo_ativo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* PERIODICIDADE */}
          <Select
            value={form.periodicidade}
            onValueChange={(v) =>
              setForm({ ...form, periodicidade: v })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEMANAL">Semanal</SelectItem>
              <SelectItem value="MENSAL">Mensal</SelectItem>
              <SelectItem value="BIMESTRAL">Bimestral</SelectItem>
              <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
              <SelectItem value="SEMESTRAL">Semestral</SelectItem>
            </SelectContent>
          </Select>

          {/* RESPONSAVEL */}
          <Input
            placeholder="Responsável"
            onChange={(e) =>
              setForm({ ...form, responsavel: e.target.value })
            }
          />

          <FullWidth>
            <Textarea
              placeholder="Observação geral"
              onChange={(e) =>
                setForm({
                  ...form,
                  observacao_geral: e.target.value,
                })
              }
            />
          </FullWidth>

          {/* CHECKLIST */}
          <Section>
            <h2>Checklist</h2>

            {templates.map((item, index) => {
              const status = form.resultados[index]?.status_item ?? "NA";

              return (
                <CardItem key={item.id_item_template} status={status}>
                  <HeaderItem>
                    <strong>{item.nome_item}</strong>
                    <StatusBadge status={status}>
                      {status}
                    </StatusBadge>
                  </HeaderItem>

                  <Info>
                    Ref: {item.valor_referencia ?? "-"} ±{" "}
                    {item.tolerancia ?? "-"} | {item.unidade || "-"}
                  </Info>

                  <GridItem>
                    <Input
                      type="number"
                      placeholder="Valor"
                      disabled={status === "NA"}
                      onChange={(e) => {
                        const valor = Number(e.target.value);

                        updateResultado(index, "valor_medido", valor);
                        updateResultado(
                          index,
                          "status_item",
                          calcularStatus(valor, item)
                        );
                      }}
                    />

                    <Select
                      value={status}
                      onValueChange={(v: Status) =>
                        updateResultado(index, "status_item", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OK">OK</SelectItem>
                        <SelectItem value="NOK">NOK</SelectItem>
                        <SelectItem value="NA">N/A</SelectItem>
                      </SelectContent>
                    </Select>

                    <span>{item.unidade || "-"}</span>

                    <Input
                      placeholder="Observação"
                      onChange={(e) =>
                        updateResultado(
                          index,
                          "observacao_item",
                          e.target.value
                        )
                      }
                    />
                  </GridItem>
                </CardItem>
              );
            })}
          </Section>

          <Actions>
            <Button type="submit">Salvar Inspeção</Button>
          </Actions>
        </Form>
      </Card>
    </Container>
  );
}
