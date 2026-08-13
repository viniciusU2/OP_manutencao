

import type { ColumnDef } from "@tanstack/react-table";
import type { Subestacao } from "../../types/Subestacao";

export const columns: ColumnDef<Subestacao>[] = [
  {
    accessorKey: "nome",
    header: "Instalação",
  },
  {
    accessorKey: "tipo_instalacao",
    header: "Tipo",
    cell: ({ row }) => row.original.tipo_instalacao === "LINHA_TRANSMISSAO" ? "Linha de transmissão" : "Subestação",
  },  {
    accessorKey: "tensao_kv",
    header: "Tensão (kV)",
  },
  {
    accessorKey: "localizacao",
    header: "Localização",
  },
  {
    accessorKey: "concessionaria",
    header: "Concessionária",
  },
];
