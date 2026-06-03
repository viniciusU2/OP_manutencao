import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Edit, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { OnlyAdmin, OnlyMaintainerOrAdmin } from "../components/onlyAdmin";

interface Resultado {
  id_resultado: number;
  id_plano_item: number;
  nome_item?: string;
  valor_referencia?: string | number | null;
  tolerancia?: string | number | null;
  valor_medido?: string | number | null;
  unidade?: string;
  status_item: "OK" | "NOK" | "NA";
  observacao_item?: string;
}

interface InspecaoDetalheData {
  id_inspecao: number;
  id_ativo: number;
  id_os?: number | null;
  numero_os?: string | null;
  numero_apr?: string | null;
  data_inspecao: string;
  periodicidade: string;
  responsavel?: string;
  observacao_geral?: string;
  status_geral: "OK" | "NOK" | "NA";
  codigo_ativo?: string;
  fabricante?: string;
  modelo?: string;
  fase?: string;
  vao?: string;
  instalacao?: string;
  tipo_ativo?: string;
  resultados?: Resultado[];
}

function statusClass(status: string) {
  if (status === "OK") return "bg-green-100 text-green-700";
  if (status === "NOK") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

function formatarData(data?: string) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InspecaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspecao, setInspecao] = useState<InspecaoDetalheData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/inspecoes/${id}`)
      .then((res) => setInspecao(res.data))
      .catch(() => toast.error("Erro ao carregar inspeção"))
      .finally(() => setLoading(false));
  }, [id]);

  async function excluir() {
    if (!id || !confirm(`Deseja excluir a inspeção #${id}?`)) return;

    try {
      await api.delete(`/inspecoes/${id}`);
      toast.success("Inspeção excluída");
      navigate("/inspecoes");
    } catch {
      toast.error("Erro ao excluir inspeção");
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando inspeção...</div>;
  if (!inspecao) {
    return <div className="p-8 text-center text-red-600">Inspeção não encontrada</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/inspecoes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Inspeção #{inspecao.id_inspecao}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatarData(inspecao.data_inspecao)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <OnlyMaintainerOrAdmin>
            <Button asChild variant="outline">
              <Link to={`/inspecoes/${id}/editar`}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Link>
            </Button>
          </OnlyMaintainerOrAdmin>
          <OnlyAdmin>
            <Button variant="destructive" onClick={excluir}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          </OnlyAdmin>
        </div>
      </div>

      <Separator />

      <div className="flex items-center gap-4">
        <span className="text-lg font-medium">Status Geral:</span>
        <Badge className={`${statusClass(inspecao.status_geral)} text-lg px-5 py-1`}>
          {inspecao.status_geral}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ativo Inspecionado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="font-semibold">{inspecao.codigo_ativo || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{inspecao.tipo_ativo || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Instalação</p>
              <p className="font-medium">{inspecao.instalacao || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fase / Vão</p>
              <p className="font-medium">
                {[inspecao.fase, inspecao.vao].filter(Boolean).join(" - ") || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">OS relacionada</p>
              {inspecao.id_os && inspecao.numero_os ? (
                <Link className="font-medium text-blue-700 underline" to={`/os/${inspecao.id_os}`}>
                  {inspecao.numero_os}
                </Link>
              ) : (
                <p className="font-medium">-</p>
              )}
              {inspecao.numero_apr && (
                <p className="text-sm text-muted-foreground">{inspecao.numero_apr}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Inspeção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Periodicidade</p>
              <p className="font-medium text-lg">{inspecao.periodicidade}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Responsável
              </p>
              <p className="font-medium">{inspecao.responsavel || "Não informado"}</p>
            </div>
          </div>

          {inspecao.observacao_geral && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Observação Geral</p>
              <div className="bg-muted/60 rounded-lg p-5 text-[15px] leading-relaxed">
                {inspecao.observacao_geral}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens Inspecionados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(inspecao.resultados ?? []).length === 0 ? (
              <p className="text-muted-foreground">Nenhum item registrado.</p>
            ) : (
              (inspecao.resultados ?? []).map((resultado) => (
                <div
                  key={resultado.id_resultado}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{resultado.nome_item || "-"}</p>
                    <p className="text-sm text-muted-foreground">
                      Medido: {resultado.valor_medido ?? "-"} {resultado.unidade || ""} | Ref:{" "}
                      {resultado.valor_referencia ?? "-"} | Tol: {resultado.tolerancia ?? "-"}
                    </p>
                    {resultado.observacao_item && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {resultado.observacao_item}
                      </p>
                    )}
                  </div>
                  <Badge className={statusClass(resultado.status_item)}>
                    {resultado.status_item}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" asChild>
          <Link to={`/ativo/${inspecao.id_ativo}`}>Ver Ativo</Link>
        </Button>
        <Button variant="outline" onClick={() => navigate("/inspecoes")}>
          Voltar
        </Button>
      </div>
    </div>
  );
}
