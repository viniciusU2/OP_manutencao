import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Edit, Eye, Plus } from "lucide-react";
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

export default function PlanosManutencaoPage() {
  const [planos, setPlanos] = useState<PlanoManutencaoReadFull[]>([]);
  const [loading, setLoading] = useState(true);
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

        <Button asChild>
          <Link to="/planos-manutencao/novo">
            <Plus size={16} />
            Novo plano
          </Link>
        </Button>
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
    </Container>
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
