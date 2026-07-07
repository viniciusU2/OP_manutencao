import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

import type { Ativo } from "../../types/Ativo";
import { StatusBadge } from "../statusBadge";

function getSubestacaoSigla(ativo: Ativo) {
  const subestacao = ativo.subestacao;

  if (typeof subestacao === "string") return subestacao;
  if (subestacao?.sigla) return subestacao.sigla;
  if (subestacao?.nome) return subestacao.nome;

  return "-";
}

function getTipoAtivoNome(ativo: Ativo) {
  const tipo = ativo.tipo_ativo;

  if (typeof tipo === "string") return tipo;
  if (tipo?.nome) return tipo.nome;

  return "-";
}

export const columns: ColumnDef<Ativo>[] = [
  {
    accessorKey: "codigo_ativo",
    header: "Codigo",
    cell: ({ row }) => {
      const ativo = row.original;

      return (
        <Link
          to={`/ativo/${ativo.id_ativo}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {ativo.codigo_ativo}
        </Link>
      );
    },
  },
  {
    accessorKey: "subestacao",
    header: "Subestacao",
    cell: ({ row }) => getSubestacaoSigla(row.original),
  },
  {
    accessorKey: "tipo_ativo",
    header: "Tipo",
    cell: ({ row }) => getTipoAtivoNome(row.original),
  },

  {
    accessorKey: "fase",
    header: "Fase",
    cell: ({ row }) => {
      const fase = row.original.fase ?? "";

      const cores: Record<string, string> = {
        VM: "bg-red-500 text-white",
        AZ: "bg-blue-500 text-white",
        BR: "bg-gray-200 text-black",
      };

      return (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${cores[fase] || "bg-gray-300"}`}
        >
          {fase || "-"}
        </span>
      );
    },
  },
  {
    accessorKey: "bay",
    header: "Bay",
    cell: ({ row }) => row.original.bay || "-",
  },
  {
    accessorKey: "modelo",
    header: "Modelo",
    cell: ({ row }) => row.original.modelo || "-",
  },
  {
    accessorKey: "numero_serie",
    header: "Serie",
    cell: ({ row }) => row.original.numero_serie || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];
