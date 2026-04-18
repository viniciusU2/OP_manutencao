import type { ColumnDef } from "@tanstack/react-table";
import type { Ativo } from "../../types/Ativo";
import { Link } from "react-router-dom";

export const columns: ColumnDef<Ativo>[] = [
  {
    accessorKey: "codigo_ativo",
    header: "Código ativo (kV)",
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
  accessorKey: "fase",
  header: "Fase",
  cell: ({ row }) => {
    const fase = row.original.fase;

    const cores: Record<string, string> = {
      VM: "bg-red-500 text-white",
      AZ: "bg-blue-500 text-white",
      BR: "bg-gray-200 text-black",
    };

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-semibold ${cores[fase] || "bg-gray-300"}`}
      >
        {fase}
      </span>
    );
  },
},
  {
    accessorKey: "id_subestacao",
    header: "subestacao",
  },
  {
    accessorKey: "modelo",
    header: "Modelo",
  },
];
