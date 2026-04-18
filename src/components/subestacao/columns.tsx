

import type { ColumnDef } from "@tanstack/react-table";
import type { Subestacao } from "../../types/Subestacao";

export const columns: ColumnDef<Subestacao>[] = [
  {
    accessorKey: "nome",
    header: "Subestação",
  },
  {
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
