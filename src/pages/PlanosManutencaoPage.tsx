import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Edit, Eye, ListChecks, Plus } from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import Container from "../components/Container";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { DataTable } from "../components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import type {
  PlanoItemRead,
  PlanoManutencaoRead,
  PlanoManutencaoReadFull,
} from "../types/planoManutencao";

function resumo(texto?: string) {
  const value = texto?.trim();
  if (!value) return "-";
  return value.length > 90 ? `${value.slice(0, 90)}...` : value;
}

function periodicidadeLabel(value: string) {
  return value.replace("_", " ");
}

function apiErrorMessage(error: any, fallback: string) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message || JSON.stringify(item))
      .join("; ");
  }
  if (detail) return JSON.stringify(detail);
  return error?.message || fallback;
}

type OsPrevistaPlano = {
  id_plano_manutencao: number;
  plano?: string | null;
  tipo_ativo?: string | null;
  ativo?: string | null;
  fase?: string | null;
  bay?: string | null;
  data_programada?: string | null;
  esquema_servicos?: string | null;
  descricao_servicos?: string | null;
  responsavel?: string | null;
  substituto?: string | null;
  itens_plano?: {
    id_plano_item: number;
    nome_item?: string | null;
    periodicidade?: string | null;
    proxima_execucao?: string | null;
  }[];
};

export default function PlanosManutencaoPage() {
  const [planos, setPlanos] = useState<PlanoManutencaoReadFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSimulacao, setDataSimulacao] = useState("");
  const [gerandoOs, setGerandoOs] = useState(false);
  const [simulandoOs, setSimulandoOs] = useState(false);
  const [osPrevistas, setOsPrevistas] = useState<OsPrevistaPlano[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPlano, setSelectedPlano] =
    useState<PlanoManutencaoReadFull | null>(null);

  useEffect(() => {
    async function carregarPlanos() {
      setLoading(true);

      try {
        const { data } = await api.get<PlanoManutencaoRead[]>(
          "/planos-manutencao/"
        );

        const completos = await Promise.all(
          data.map(async (plano) => {
            const response = await api.get<PlanoManutencaoReadFull>(
              `/planos-manutencao/${plano.id_plano_manutencao}`
            );
            return response.data;
          })
        );

        setPlanos(completos);
      } catch {
        toast.error("Erro ao carregar planos de manutencao");
      } finally {
        setLoading(false);
      }
    }

    carregarPlanos();
  }, []);

  const columns = useMemo<ColumnDef<PlanoManutencaoReadFull>[]>(
    () => [
      {
        accessorKey: "id_plano_manutencao",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-medium">
            #{row.original.id_plano_manutencao}
          </span>
        ),
      },
      {
        header: "Tipo de ativo",
        cell: ({ row }) =>
          row.original.tipo_ativo?.nome ??
          `Tipo ${row.original.id_tipo_ativo}`,
      },
      {
        accessorKey: "descricao_geral",
        header: "Descricao",
        cell: ({ row }) => (
          <span className="block max-w-[420px] whitespace-normal">
            {resumo(row.original.descricao_geral)}
          </span>
        ),
      },
      {
        header: "Itens",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.itens.length} item
            {row.original.itens.length === 1 ? "" : "s"}
          </Badge>
        ),
      },
      {
        header: "Materiais",
        cell: ({ row }) => (
          <span className="block max-w-[260px] whitespace-normal">
            {resumo(row.original.materiais_previstos)}
          </span>
        ),
      },
      {
        id: "acoes",
        header: "",
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedPlano(row.original)}
            >
              <Eye size={16} />
              Ver itens
            </Button>
            <Button asChild type="button" variant="outline" size="sm">
              <Link
                to={`/planos-manutencao/${row.original.id_plano_manutencao}/editar`}
              >
                <Edit size={16} />
                Editar
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  async function gerarOsPorData() {
    if (!dataSimulacao) {
      toast.error("Informe uma data para gerar as OS");
      return;
    }

    setGerandoOs(true);

    try {
      const { data } = await api.post("/os/gerar-os-planos", {
        data_simulacao: `${dataSimulacao}T23:59:59`,
        simular: false,
      });

      const total = data.total_os ?? data.os_criadas?.length ?? 0;
      toast.success(
        total === 1
          ? "Geracao concluida: 1 OS foi criada."
          : `Geracao concluida: ${total} OS foram criadas.`
      );
    } catch (error: any) {
      toast.error(apiErrorMessage(error, "Erro ao gerar OS pela data informada"));
    } finally {
      setGerandoOs(false);
    }
  }

  async function simularOsPorData() {
    if (!dataSimulacao) {
      toast.error("Informe uma data para simular as OS");
      return;
    }

    setSimulandoOs(true);

    try {
      const { data } = await api.post("/os/gerar-os-planos", {
        data_simulacao: `${dataSimulacao}T23:59:59`,
        simular: true,
      });

      const previstas = data.os_previstas ?? [];
      setOsPrevistas(previstas);
      setPreviewOpen(true);

      const total = data.total_os ?? previstas.length;
      toast.success(
        total === 1
          ? "Simulacao concluida: 1 OS seria criada."
          : `Simulacao concluida: ${total} OS seriam criadas.`
      );
    } catch (error: any) {
      toast.error(apiErrorMessage(error, "Erro ao simular OS pela data informada"));
    } finally {
      setSimulandoOs(false);
    }
  }

  return (
    <Container>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-2xl font-semibold text-slate-900">
            Planos de Manutencao
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? "Carregando planos cadastrados..."
              : `${planos.length} plano${planos.length === 1 ? "" : "s"} cadastrado${planos.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Gerar para o dia
            <input
              type="date"
              value={dataSimulacao}
              onChange={(event) => setDataSimulacao(event.target.value)}
              className="h-9 rounded-md border border-slate-300 px-3 text-sm"
            />
          </label>

          <Button
            type="button"
            variant="outline"
            onClick={simularOsPorData}
            disabled={simulandoOs || gerandoOs}
          >
            <ListChecks size={16} />
            {simulandoOs ? "Simulando..." : "Simular OS"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={gerarOsPorData}
            disabled={gerandoOs || simulandoOs}
          >
            {gerandoOs ? "Gerando..." : "Gerar OS"}
          </Button>

          <Button asChild>
            <Link to="/planos-manutencao/novo">
              <Plus size={16} />
              Novo plano
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Planos cadastrados</CardTitle>
          <CardDescription>
            Consulte os planos e abra os itens associados a cada cadastro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-md border bg-white p-6 text-sm text-slate-500">
              Carregando...
            </div>
          ) : (
            <DataTable columns={columns} data={planos} />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedPlano}
        onOpenChange={(open) => {
          if (!open) setSelectedPlano(null);
        }}
      >
        <DialogContent className="max-h-[86vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              Itens do plano #{selectedPlano?.id_plano_manutencao}
            </DialogTitle>
            <DialogDescription>
              {selectedPlano?.tipo_ativo?.nome ??
                `Tipo ${selectedPlano?.id_tipo_ativo ?? ""}`}
            </DialogDescription>
          </DialogHeader>

          <ItensPlanoTable itens={selectedPlano?.itens ?? []} />
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[86vh] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>OS previstas para {dataSimulacao}</DialogTitle>
            <DialogDescription>
              {osPrevistas.length
                ? `${osPrevistas.length} OS seriam criadas nessa data.`
                : "Nenhuma OS seria criada nessa data."}
            </DialogDescription>
          </DialogHeader>

          <OsPrevistasTable osPrevistas={osPrevistas} />
        </DialogContent>
      </Dialog>
    </Container>
  );
}

function formatarData(data?: string | null) {
  if (!data) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function OsPrevistasTable({
  osPrevistas,
}: {
  osPrevistas: OsPrevistaPlano[];
}) {
  if (!osPrevistas.length) {
    return (
      <div className="rounded-md border p-4 text-sm text-slate-500">
        Nenhuma OS prevista para a data informada.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ativo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Data programada</TableHead>
            <TableHead>Esquema</TableHead>
            <TableHead>Itens</TableHead>
            <TableHead>Equipe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {osPrevistas.map((osPrevista, index) => (
            <TableRow
              key={`${osPrevista.id_plano_manutencao}-${osPrevista.ativo ?? index}`}
            >
              <TableCell>
                <div className="font-medium">{osPrevista.ativo ?? "-"}</div>
                <div className="text-xs text-slate-500">
                  {[osPrevista.bay, osPrevista.fase].filter(Boolean).join(" / ") ||
                    "-"}
                </div>
              </TableCell>
              <TableCell>{osPrevista.tipo_ativo ?? "-"}</TableCell>
              <TableCell className="max-w-[280px] whitespace-normal">
                {resumo(osPrevista.plano ?? undefined)}
              </TableCell>
              <TableCell>{formatarData(osPrevista.data_programada)}</TableCell>
              <TableCell>{osPrevista.esquema_servicos ?? "-"}</TableCell>
              <TableCell className="max-w-[320px] whitespace-normal">
                {osPrevista.itens_plano?.length
                  ? osPrevista.itens_plano
                      .map((item) => item.nome_item)
                      .filter(Boolean)
                      .join("; ")
                  : "-"}
              </TableCell>
              <TableCell>
                <div>{osPrevista.responsavel ?? "-"}</div>
                <div className="text-xs text-slate-500">
                  {osPrevista.substituto ?? "-"}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ItensPlanoTable({ itens }: { itens: PlanoItemRead[] }) {
  if (!itens.length) {
    return (
      <div className="rounded-md border p-4 text-sm text-slate-500">
        Nenhum item cadastrado para este plano.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ordem</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Periodicidade</TableHead>
            <TableHead>Intervalo</TableHead>
            <TableHead>Antecedencia</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead>Descricao</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item) => (
            <TableRow key={item.id_plano_item}>
              <TableCell>{item.ordem}</TableCell>
              <TableCell className="font-medium">{item.nome_item}</TableCell>
              <TableCell>{periodicidadeLabel(item.periodicidade)}</TableCell>
              <TableCell>{item.intervalo}</TableCell>
              <TableCell>{item.antecedencia}</TableCell>
              <TableCell>
                {item.valor_referencia ?? "-"}
                {item.unidade ? ` ${item.unidade}` : ""}
                {item.tolerancia ? ` +/- ${item.tolerancia}` : ""}
              </TableCell>
              <TableCell className="max-w-[300px] whitespace-normal">
                {resumo(item.descricao)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
