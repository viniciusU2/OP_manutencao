import type { ColumnDef } from "@tanstack/react-table";
import type { OrdemServico } from "../../types/OrdemServico";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/statusBadge";
import { Download, Trash2 } from "lucide-react";
import { OnlyAdmin } from "../onlyAdmin";

function getTipoEquipamento(os: OrdemServico) {
  const tipo = os.tipo_ativo ?? os.ativo?.tipo_ativo;

  if (typeof tipo === "string") {
    return tipo || "-";
  }

  return tipo?.nome || os.ativo?.id_tipo_ativo || os.id_tipo_ativo || "-";
}

function getFaseEquipamento(os: OrdemServico) {
  return os.fase || os.ativo?.fase || os.complemento || "-";
}

export const columns = (
  onDelete: (id: number) => void,
  onDownload: (os: OrdemServico) => void,
  onDownloadApr: (os: OrdemServico) => void
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
    id: "codigo_ativo",
    header: "Código do ativo",
    cell: ({ row }) =>
      row.original.codigo_ativo || row.original.ativo?.codigo_ativo || "-",
  },
  {
    accessorKey: "instalacao",
    header: " Instalacao",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "fase_equipamento",
    header: "Fase",
    cell: ({ row }) => getFaseEquipamento(row.original),
  },
  {
    id: "especie",
    header: "Espécie",
    cell: ({ row }) => row.original.especie || getTipoEquipamento(row.original) || "-",
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
    accessorKey: "esquema_servico",
    header: "Esquema de serviço",
    cell: ({ row }) => {
      return <StatusBadge status={row.original.esquema_servicos} />;
    },
  },
  {
    id: "tipo_equipamento",
    header: "Tipo Equip.",
    cell: ({ row }) => getTipoEquipamento(row.original),
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

          <button
            onClick={() => onDownloadApr(os)}
            className="text-emerald-600 hover:text-emerald-800 transition"
            title="Baixar APR"
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
