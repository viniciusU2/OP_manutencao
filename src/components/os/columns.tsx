import type { ColumnDef } from "@tanstack/react-table";
import type { OrdemServico } from "../../types/OrdemServico";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/statusBadge";
import { Trash2, Download } from "lucide-react";
import { OnlyAdmin } from "../onlyAdmin";

export const columns = (
  onDelete: (id: number) => void,
  onDownload: ( os: OrdemServico) => void
): ColumnDef<OrdemServico>[] => [
  {
    accessorKey: "numero_os",
    header: "OS",
    cell: ({ row }) => {
      const os = row.original;

      return (
        <Link
          to={`/os/${os.id_os}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {os.numero_os}
        </Link>
      );
    },
  },
  {
    accessorKey: "instalacao",
    header: " Instalacao",
  },
  {
    accessorKey: "especie",
    header: "Espécie",
  },
  {
    accessorKey: "emissor",
    header: "Emissor",
  },
  {
    accessorKey: "esquema_servico",
    header: "Esquema de serviço",
    cell: ({ row }) => {
      return <StatusBadge status={row.original.esquema_servicos} />;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return <StatusBadge status={row.original.status} />;
    },
  },
  {
    accessorKey: "responsavel",
    header: "Responsável",
  },
  {
    accessorKey: "data_inicio_programado",
    header: "Início Prog.",
    cell: ({ getValue }) => {
      const value = getValue<Date | null>();
      return value
        ? new Date(value).toLocaleDateString("pt-BR")
        : "-";
    },
  },
  {
    accessorKey: "data_fim_programado",
    header: "Fim Prog.",
    cell: ({ getValue }) => {
      const value = getValue<Date | null>();
      return value
        ? new Date(value).toLocaleDateString("pt-BR")
        : "-";
    },
  },
  {
    id: "acoes",
    header: "",
    cell: ({ row }) => {
      const os = row.original;

      return (
        <div className="flex gap-2">
          {/* DOWNLOAD */}
          <button
            onClick={() => onDownload(os)}
            className="text-blue-500 hover:text-blue-700 transition"
            title="Baixar OS"
          >
            <Download size={18} />
          </button>

          {/* DELETE */}

             <OnlyAdmin>
              
          
      
  
          <button
            onClick={() => os.id_os && onDelete(os.id_os)}
            className="text-red-500 hover:text-red-700 transition"
            title="Excluir OS"
          >
            <Trash2 size={18} />
          </button>
             </OnlyAdmin>
        </div>
      );
    },
  },
];
