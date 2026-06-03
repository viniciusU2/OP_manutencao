import type { ColumnDef } from "@tanstack/react-table";
import type { SI } from "../../types/SI";
import { StatusBadge } from "../../components/statusBadge";
import { Link } from "react-router-dom";
import { Download, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { OnlyAdmin } from "../onlyAdmin";

export const columns = (
  onDownload: (si: SI) => void,
  onDelete: (si: SI) => void
): ColumnDef<SI>[] => [
  {
    accessorKey: "numero_si",
    header: "SI",
    cell: ({ row }) => (
      <Link to={`/si/${row.original.id_si}`} className="text-blue-600">
        {row.original.numero_si}
      </Link>
    ),
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
  },
{
    accessorKey: "emissor",
    header: "Emissor",
  },
  {
      accessorKey: "status_manutencao",
      header: "status_manutencao",
      cell: ({ row }) => {
        return <StatusBadge status={row.original.status_manutencao} />;
      },
    },
  {
      accessorKey: "status_operacao",
      header: "status_operacao",
      cell: ({ row }) => {
        return <StatusBadge status={row.original.status_operacao} />;
      },
    },
      {
    id: "acoes",
    header: "",
    cell: ({ row }) => {
      const si = row.original;

      return (
        <div className="flex gap-2">
          <button
            onClick={() => onDownload(si)}
            className="text-blue-500 hover:text-blue-700 transition"
            title="Baixar SI"
          >
            <Download size={18} />
          </button>

          <OnlyAdmin>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(si)}
              title="Excluir SI"
            >
              <Trash2 size={16} />
            </Button>
          </OnlyAdmin>
        </div>
      );
    },
  },

];
