import type { ColumnDef } from "@tanstack/react-table";
import type { SS } from "../../types/SS";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Eye, Trash2 } from "lucide-react";

/* ==============================
HELPER STATUS
============================== */
function getStatusVariant(status: string) {
  const s = status?.toUpperCase();

  if (s === "CONCLUIDA") return "success";
  if (s === "CANCELADA") return "secondary";
  if (s === "EM ANDAMENTO") return "warning";

  return "default";
}

/* ==============================
COLUMNS
============================== */

export const columns = (onDownload: ( ss: SS) => void): ColumnDef<SS>[] => [
  
  {
    accessorKey: "numero_ss",
    header: "Número",
    cell: ({ row }) => (
      <span className="font-medium">
        SS {row.original.numero_ss}
      </span>
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
    accessorKey: "descricao",
    header: "Descrição",
    cell: ({ row }) => (
      <span className="truncate max-w-[250px] block">
        {row.original.descricao || "-"}
      </span>
    ),
  },

  {
    accessorKey: "criado_em",
    header: "Criado em",
    cell: ({ row }) => {
      const data = row.original.criado_em;
      if (!data) return "-";

      return new Date(data).toLocaleDateString("pt-BR");
    },
  },

  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const ss = row.original;

      return (
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
           
          >
            <Eye size={16} />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (confirm("Deseja excluir esta SS?")) {
                console.log("Excluir SS:", ss.numero_ss);
              }
            }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      );
    },
  },
];