import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { toast } from "sonner";

import api from "../api/api";
import UsuarioSelect from "../components/UsuarioSelect";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

type Status = "OK" | "NOK" | "NA";

interface ResultadoItem {
  id_plano_item: number;
  valor_medido?: number | "";
  status_item: Status;
  observacao_item?: string;
  foto?: string;
}

interface Ativo {
  id_ativo: number;
  id_subestacao: number;
  codigo_ativo: string;
  id_tipo_ativo: number;
  fase?: string;
  vao?: string;
  tipo_ativo?: string;
}

interface Subestacao {
  id_subestacao: number;
  nome: string;
}

interface PlanoItem {
  id_plano_item: number;
  nome_item: string;
  descricao?: string;
  periodicidade: string;
  unidade?: string;
  valor_referencia?: number | string | null;
  tolerancia?: number | string | null;
  ordem?: number;
}

interface OrdemServicoOption {
  id_os: number;
  numero_os: string;
  numero_apr?: string;
  status?: string;
  data_inicio_programado?: string | null;
}

const periodicidades = [
  "SEMANAL",
  "MENSAL",
  "BIMESTRAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "3_ANOS",
  "5_ANOS",
  "6_ANOS",
];

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;

  @media (max-width: 700px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
`;

const FormGrid = styled.form`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
`;

const Select = styled.select`
  width: 100%;
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  padding: 0 10px;
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

const Checklist = styled.div`
  grid-column: 1 / -1;
  display: grid;
  gap: 12px;
`;

const CardItem = styled.div<{ $status: Status }>`
  border: 1px solid
    ${({ $status }) =>
      $status === "NOK" ? "#fecaca" : $status === "OK" ? "#bbf7d0" : "#e5e7eb"};
  border-radius: 8px;
  padding: 14px;
  background:
    ${({ $status }) =>
      $status === "NOK" ? "#fef2f2" : $status === "OK" ? "#f0fdf4" : "#ffffff"};
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
`;

const ItemGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 1fr) 120px minmax(160px, 1.4fr) minmax(160px, 1.4fr);
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Meta = styled.div`
  color: #64748b;
  font-size: 12px;
  margin-bottom: 10px;
`;

const EmptyState = styled.div`
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  padding: 18px;
  text-align: center;
`;

const Actions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

function numero(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return undefined;
  const n = Number(valor);
  return Number.isFinite(n) ? n : undefined;
}

export default function InspecaoForm() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [itens, setItens] = useState<PlanoItem[]>([]);
  const [ordensServico, setOrdensServico] = useState<OrdemServicoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id_subestacao: 0,
    id_ativo: 0,
    id_os: 0,
    periodicidade: "MENSAL",
    responsavel: "",
    ficha_inspecao_url: "",
    observacao_geral: "",
    resultados: [] as ResultadoItem[],
  });

  useEffect(() => {
    api
      .get("/subestacao/ativas")
      .then((res) => setSubestacoes(res.data))
      .catch(() => toast.error("Erro ao carregar subestações"));
  }, []);

  useEffect(() => {
    if (!form.id_subestacao) {
      setAtivos([]);
      return;
    }

    api
      .get(`/ativos/${form.id_subestacao}`)
      .then((res) => setAtivos(res.data))
      .catch(() => toast.error("Erro ao carregar ativos da subestação"));
  }, [form.id_subestacao]);

  useEffect(() => {
    if (isEditing) return;
    const ativoParam = Number(searchParams.get("id_ativo"));
    const osParam = Number(searchParams.get("id_os"));
    if (Number.isFinite(ativoParam) && ativoParam > 0) {
      api
        .get(`/ativo/${ativoParam}`)
        .then((res) => {
          setForm((prev) => ({
            ...prev,
            id_subestacao: Number(res.data.id_subestacao) || prev.id_subestacao,
            id_ativo: ativoParam,
            id_os: Number.isFinite(osParam) && osParam > 0 ? osParam : prev.id_os,
          }));
        })
        .catch(() => {
          setForm((prev) => ({
            ...prev,
            id_ativo: ativoParam,
            id_os: Number.isFinite(osParam) && osParam > 0 ? osParam : prev.id_os,
          }));
        });
    }
  }, [isEditing, searchParams]);

  useEffect(() => {
    if (!isEditing) return;

    setLoading(true);
    api
      .get(`/inspecoes/${id}`)
      .then((res) => {
        const inspecao = res.data;
        setForm({
          id_subestacao: inspecaoNumero(inspecao.id_subestacao),
          id_ativo: inspecaoNumero(inspecao.id_ativo),
          id_os: inspecaoNumero(inspecao.id_os),
          periodicidade: inspecaoTexto(inspecao.periodicidade, "MENSAL"),
          responsavel: inspecaoTexto(inspecao.responsavel),
          ficha_inspecao_url: inspecaoTexto(inspecao.ficha_inspecao_url),
          observacao_geral: inspecaoTexto(inspecao.observacao_geral),
          resultados: (inspecao.resultados ?? []).map((resultado: any) => ({
            id_plano_item: resultado.id_plano_item,
            valor_medido: resultado.valor_medido ?? "",
            status_item: resultado.status_item ?? "NA",
            observacao_item: resultado.observacao_item ?? "",
            foto: resultado.foto ?? "",
          })),
        });

        if (!inspecao.id_subestacao && inspecao.id_ativo) {
          api
            .get(`/ativo/${inspecao.id_ativo}`)
            .then((ativoRes) => {
              setForm((prev) => ({
                ...prev,
                id_subestacao: inspecaoNumero(ativoRes.data.id_subestacao),
              }));
            })
            .catch(() => undefined);
        }
      })
      .catch(() => toast.error("Erro ao carregar inspeção"))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  useEffect(() => {
    if (!form.id_ativo) {
      setItens([]);
      setOrdensServico([]);
      return;
    }

    api
      .get("/os", { params: { id_ativo: form.id_ativo } })
      .then((res) => setOrdensServico(res.data))
      .catch(() => toast.error("Erro ao carregar OS do ativo"));

    api
      .get(`/inspecoes/pendentes/${form.id_ativo}`, {
        params: { periodicidade: form.periodicidade },
      })
      .then((res) => {
        const novosItens: PlanoItem[] = res.data;
        setItens(novosItens);
        setForm((prev) => {
          const existentes = new Map(
            prev.resultados.map((resultado) => [resultado.id_plano_item, resultado])
          );
          return {
            ...prev,
            resultados: novosItens.map((item) => ({
              id_plano_item: item.id_plano_item,
              status_item: existentes.get(item.id_plano_item)?.status_item ?? "NA",
              valor_medido: existentes.get(item.id_plano_item)?.valor_medido ?? "",
              observacao_item: existentes.get(item.id_plano_item)?.observacao_item ?? "",
              foto: existentes.get(item.id_plano_item)?.foto ?? "",
            })),
          };
        });
      })
      .catch(() => toast.error("Erro ao carregar itens de inspeção"));
  }, [form.id_ativo, form.periodicidade]);

  const ativoSelecionado = useMemo(
    () => ativos.find((ativo) => ativo.id_ativo === form.id_ativo),
    [ativos, form.id_ativo]
  );

  function updateResultado(index: number, field: keyof ResultadoItem, value: any) {
    setForm((prev) => {
      const resultados = [...prev.resultados];
      resultados[index] = { ...resultados[index], [field]: value };
      return { ...prev, resultados };
    });
  }

  function calcularStatus(valor: number | undefined, item: PlanoItem): Status {
    const referencia = numero(item.valor_referencia);
    const tolerancia = numero(item.tolerancia);
    if (valor === undefined || referencia === undefined || tolerancia === undefined) {
      return valor === undefined ? "NA" : "OK";
    }
    return valor < referencia - tolerancia || valor > referencia + tolerancia ? "NOK" : "OK";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.id_subestacao) {
      toast.error("Selecione a subestação");
      return;
    }

    if (!form.id_ativo) {
      toast.error("Selecione um ativo");
      return;
    }

    const { id_subestacao: _idSubestacao, ...dadosInspecao } = form;
    void _idSubestacao;

    const payload = {
      ...dadosInspecao,
      id_os: form.id_os || null,
      ficha_inspecao_url: form.ficha_inspecao_url.trim() || null,
      resultados: form.resultados.map((resultado) => ({
        ...resultado,
        valor_medido: resultado.valor_medido === "" ? null : resultado.valor_medido,
        foto: resultado.foto?.trim() || null,
      })),
    };

    try {
      const res = isEditing
        ? await api.put(`/inspecoes/${id}`, payload)
        : await api.post("/inspecoes", payload);
      toast.success(isEditing ? "Inspeção atualizada" : "Inspeção salva");
      navigate(`/inspecoes/${res.data.id_inspecao}`);
    } catch {
      toast.error("Erro ao salvar inspeção");
    }
  }

  return (
    <Container>
      <Header>
        <Title>{isEditing ? "Editar Inspeção" : "Nova Inspeção"}</Title>
        <Button variant="outline" type="button" onClick={() => navigate("/inspecoes")}>
          Voltar
        </Button>
      </Header>

      <Card className="p-6">
        <FormGrid onSubmit={handleSubmit}>
          <Field>
            Subestação
            <Select
              value={form.id_subestacao ? String(form.id_subestacao) : ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  id_subestacao: Number(e.target.value),
                  id_ativo: 0,
                  id_os: 0,
                  resultados: [],
                })
              }
              disabled={loading || isEditing}
            >
              <option value="">Selecione a subestação</option>
              {subestacoes.map((subestacao) => (
                <option key={subestacao.id_subestacao} value={subestacao.id_subestacao}>
                  {subestacao.nome}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            Ativo
            <Select
              value={form.id_ativo ? String(form.id_ativo) : ""}
              onChange={(e) =>
                setForm({ ...form, id_ativo: Number(e.target.value), id_os: 0 })
              }
              disabled={loading || isEditing || !form.id_subestacao}
            >
              <option value="">
                {form.id_subestacao ? "Selecione o ativo" : "Selecione primeiro a subestação"}
              </option>
              {ativos.map((ativo) => (
                <option key={ativo.id_ativo} value={ativo.id_ativo}>
                  {ativo.codigo_ativo} - {[ativo.fase, ativo.vao].filter(Boolean).join(" - ")}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            Periodicidade
            <Select
              value={form.periodicidade}
              onChange={(e) => setForm({ ...form, periodicidade: e.target.value })}
              disabled={loading}
            >
              {periodicidades.map((periodicidade) => (
                <option key={periodicidade} value={periodicidade}>
                  {periodicidade}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            Responsável
            <UsuarioSelect
              value={form.responsavel}
              onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
            />
          </Field>

          <Field>
            OS relacionada
            <Select
              value={form.id_os ? String(form.id_os) : ""}
              onChange={(e) => setForm({ ...form, id_os: Number(e.target.value) })}
              disabled={!form.id_ativo || ordensServico.length === 0}
            >
              <option value="">
                {form.id_ativo ? "Sem OS vinculada" : "Selecione primeiro o ativo"}
              </option>
              {ordensServico.map((os) => (
                <option key={os.id_os} value={os.id_os}>
                  {os.numero_os} {os.numero_apr ? `| ${os.numero_apr}` : ""}{" "}
                  {os.status ? `| ${os.status}` : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            Ativo selecionado
            <Input
              disabled
              value={
                ativoSelecionado
                  ? `${ativoSelecionado.codigo_ativo} ${ativoSelecionado.fase ?? ""}`
                  : ""
              }
            />
          </Field>

          <FullWidth>
            <Field>
              URL da ficha de inspeção física
              <Input
                value={form.ficha_inspecao_url}
                onChange={(e) => setForm({ ...form, ficha_inspecao_url: e.target.value })}
                placeholder="https://... ou caminho do arquivo"
              />
            </Field>
          </FullWidth>

          <FullWidth>
            <Field>
              Observação geral
              <Textarea
                value={form.observacao_geral}
                onChange={(e) => setForm({ ...form, observacao_geral: e.target.value })}
              />
            </Field>
          </FullWidth>

          <Checklist>
            <h2 className="text-lg font-semibold">Checklist</h2>
            {itens.length === 0 ? (
              <EmptyState>
                Selecione um ativo com itens de plano para essa periodicidade.
              </EmptyState>
            ) : (
              itens.map((item, index) => {
                const resultado = form.resultados[index];
                const status = resultado?.status_item ?? "NA";
                return (
                  <CardItem key={item.id_plano_item} $status={status}>
                    <ItemHeader>
                      <strong>{item.nome_item}</strong>
                      <span>{status}</span>
                    </ItemHeader>
                    <Meta>
                      Ref: {item.valor_referencia ?? "-"} | Tol: {item.tolerancia ?? "-"} |{" "}
                      {item.unidade || "-"}
                    </Meta>
                    <ItemGrid>
                      <Input
                        type="number"
                        placeholder="Valor medido"
                        value={resultado?.valor_medido ?? ""}
                        onChange={(e) => {
                          const valor = e.target.value === "" ? "" : Number(e.target.value);
                          updateResultado(index, "valor_medido", valor);
                          updateResultado(
                            index,
                            "status_item",
                            calcularStatus(valor === "" ? undefined : valor, item)
                          );
                        }}
                      />
                      <Select
                        value={status}
                        onChange={(e) => updateResultado(index, "status_item", e.target.value)}
                      >
                        <option value="OK">OK</option>
                        <option value="NOK">NOK</option>
                        <option value="NA">N/A</option>
                      </Select>
                      <Input
                        placeholder="Observação do item"
                        value={resultado?.observacao_item ?? ""}
                        onChange={(e) =>
                          updateResultado(index, "observacao_item", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Foto opcional (URL ou caminho)"
                        value={resultado?.foto ?? ""}
                        onChange={(e) => updateResultado(index, "foto", e.target.value)}
                      />
                    </ItemGrid>
                  </CardItem>
                );
              })
            )}
          </Checklist>

          <Actions>
            <Button variant="outline" type="button" onClick={() => navigate("/inspecoes")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {isEditing ? "Salvar Alterações" : "Salvar Inspeção"}
            </Button>
          </Actions>
        </FormGrid>
      </Card>
    </Container>
  );
}

function inspecaoTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" ? valor : fallback;
}

function inspecaoNumero(valor: unknown) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

