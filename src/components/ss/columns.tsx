import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { ClipboardCheck, Trash2 } from "lucide-react";

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

function getStatusLabel(status: string) {
  const s = status?.toUpperCase();

  if (s === "ENCERRADA") return "Encerrada";
  if (s === "EM_EXECUCAO") return "Em Execucao";
  if (s === "PROGRAMADA") return "Programada";
  if (s === "ABERTA") return "Aberta";

  return status;
}

function getPrioridadeLabel(prioridade?: string) {
  const p = prioridade?.toUpperCase();

  if (p === "NIVEL_1") return "Nivel 1 - Emergencial";
  if (p === "NIVEL_2") return "Nivel 2 - Urgente";
  if (p === "NIVEL_3") return "Nivel 3 - Programado prioritario";
  if (p === "NIVEL_4") return "Nivel 4 - Programado";
  if (p === "NIVEL_5") return "Nivel 5 - Melhoria/Oportunidade";
  if (p === "NIVEL_6") return "Nivel 6 - Monitoramento";
  if (p === "ALTA") return "Nivel 1 - Emergencial";
  if (p === "MEDIA") return "Nivel 3 - Programado prioritario";
  if (p === "BAIXA") return "Nivel 5 - Melhoria/Oportunidade";

  return prioridade || "-";
}

export const columns = (
  onDelete: (ss: SS) => void,
  onAtender: (ss: SS) => void
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
    accessorKey: "codigo_ativo",
    header: "Código do ativo",
    cell: ({ row }) => row.original.codigo_ativo || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={getStatusVariant(row.original.status)}>
        {getStatusLabel(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: "numero_os",
    header: "OS",
    cell: ({ row }) => row.original.numero_os || "-",
  },
  {
    accessorKey: "prioridade",
    header: "Prioridade",
    cell: ({ row }) => getPrioridadeLabel(row.original.prioridade),
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
    accessorKey: "emissor",
    header: "Emissor",
    cell: ({ row }) => row.original.emissor || "-",
  },
  {
    accessorKey: "editado_por",
    header: "Editado por",
    cell: ({ row }) => row.original.editado_por || "-",
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
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onAtender(ss)}
            title="Atender SS"
            disabled={ss.status === "ENCERRADA"}
          >
            <ClipboardCheck size={16} />
          </Button>

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
