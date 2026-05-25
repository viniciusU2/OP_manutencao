import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

import type { SS } from "../../types/SS";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { OnlyAdmin } from "../onlyAdmin";

function getStatusVariant(status: string) {
  const s = status?.toUpperCase();

  if (s === "ENCERRADA") return "default";
  if (s === "CANCELADA") return "secondary";
  if (s === "EM_EXECUCAO") return "outline";

  return "default";
}

export const columns = (
  onDelete: (ss: SS) => void
): ColumnDef<SS>[] => [
  {
    accessorKey: "numero_ss",
    header: "SS",
    cell: ({ row }) => (
      <Link
        to={`/ss/${row.original.id_ss}`}
        className="font-medium text-blue-600 hover:underline"
      >
        {row.original.numero_ss}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={getStatusVariant(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "prioridade",
    header: "Prioridade",
  },
  {
    accessorKey: "esquema_servico",
    header: "Esquema",
    cell: ({ row }) => row.original.esquema_servico || "-",
  },
  {
    accessorKey: "solicitante",
    header: "Solicitante",
  },
  {
    accessorKey: "descricao_problema",
    header: "Descricao",
    cell: ({ row }) => (
      <span className="truncate max-w-[280px] block">
        {row.original.descricao_problema || "-"}
      </span>
    ),
  },
  {
    accessorKey: "data_hora_solicitacao",
    header: "Solicitacao",
    cell: ({ row }) => {
      const data = row.original.data_hora_solicitacao;
      if (!data) return "-";
      return new Date(data).toLocaleDateString("pt-BR");
    },
  },
  {
    id: "actions",
    header: "Acoes",
    cell: ({ row }) => {
      const ss = row.original;

      return (
        <div className="flex gap-2">
          <OnlyAdmin>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(ss)}
              title="Excluir SS"
            >
              <Trash2 size={16} />
            </Button>
          </OnlyAdmin>
        </div>
      );
    },
  },
];
