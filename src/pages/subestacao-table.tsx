import { useEffect, useState } from "react";
import api from "../api/api";
import type { Subestacao } from "../types/Subestacao";
import { DataTable } from "../components/ui/data-table";
import { columns } from "../components/subestacao/columns";
import Container from "../components/Container";

export function SubestacaoPage1() {
  const [data, setData] = useState<Subestacao[]>([]);

  useEffect(() => {
    api.get("/subestacao").then((res) => {
      setData(res.data);
    });
  }, []);

  return (
    <Container>
      <h2 className="text-2xl font-semibold mb-4">
        Subestações Cadastradas
      </h2>

    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
    </Container>
  );
}
