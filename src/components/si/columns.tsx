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
    accessorKey: "codigo_ativo",
    header: "Código do ativo",
    cell: ({ row }) => row.original.codigo_ativo || "-",
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
    accessorKey: "editado_por",
    header: "Editado por",
    cell: ({ row }) => row.original.editado_por || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="flex flex-col gap-1">
          <StatusBadge status={status} />
          {!row.original.pode_editar && (
            <span className="text-[11px] text-slate-400">somente leitura</span>
          )}
        </div>
      );
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

          {si.pode_excluir && (
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
          )}
        </div>
      );
    },
  },

];
