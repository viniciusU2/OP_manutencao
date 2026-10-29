import type { ColumnDef } from "@tanstack/react-table";
import type { SI } from "../../types/SI";
import { StatusBadge } from "../../components/statusBadge";
import { Link } from "react-router-dom";
import { Download, Eye, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { OnlyAdmin } from "../onlyAdmin";

function formatarData(valor?: string | null) {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleDateString("pt-BR");
}

export const columns = (
  onDownload: (si: SI) => void,
  onDelete: (si: SI) => void
): ColumnDef<SI>[] => [
  {
    accessorKey: "numero_si",
    header: "SI",
    cell: ({ row }) => (
      <Link
        to={`/si/${row.original.id_si}`}
        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
      >
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
    cell: ({ row }) => row.original.tipo || "-",
  },
  {
    accessorKey: "emissor",
    header: "Emissor",
    cell: ({ row }) => row.original.emissor || "-",
  },
  {
    accessorKey: "criado_em",
    header: "Criada em",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-slate-500">
        {formatarData(row.original.criado_em)}
      </span>
    ),
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
        <div className="flex justify-end gap-1">
          <Link
            to={`/si/${si.id_si}`}
            title="Abrir SI"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <Eye size={17} />
          </Link>

          <button
            onClick={() => onDownload(si)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-500 transition hover:bg-blue-50 hover:text-blue-700"
            title="Baixar SI"
          >
            <Download size={17} />
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
