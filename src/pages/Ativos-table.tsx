import { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import type { Ativo } from "../types/Ativo";
import { DataTable } from "../components/ui/data-table";
import { columns } from "../components/ativos/columns";
import Container from "../components/Container";

type Props = {
  tipoId?: number;
  search?: string;
  status?: string;
  subestacao?: string;
};

export function AtivoPage1({
  tipoId,
  search = "",
  status = "all",
  subestacao = "all",
}: Props) {
  const [todosAtivos, setTodosAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    buscarAtivos();
  }, []);

  async function buscarAtivos() {
    try {
      setLoading(true);
      const response = await api.get("/ativo");
      setTodosAtivos(response.data);
    } catch (error) {
      console.error("Erro ao buscar ativos", error);
      setTodosAtivos([]);
    } finally {
      setLoading(false);
    }
  }

  const ativosFiltrados = useMemo(() => {
    return todosAtivos.filter((ativo) => {
      const matchTipo =
        !tipoId || ativo.id_tipo_ativo === tipoId;

      const matchSearch =
        !search ||
        (ativo.codigo_ativo ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (ativo.modelo ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (ativo.numero_serie ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (ativo.fase ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (ativo.vao ?? "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchStatus =
        status === "all" || ativo.status === status;

      const matchSubestacao =
        subestacao === "all" ||
        String(ativo.id_subestacao) === subestacao;

      return (
        matchTipo &&
        matchSearch &&
        matchStatus &&
        matchSubestacao
      );
    });
  }, [todosAtivos, tipoId, search, status, subestacao]);

  return (
    <Container>
      {loading && <p>Carregando...</p>}

      {!loading && (
        <div className="container mx-auto py-6">
          <DataTable columns={columns} data={ativosFiltrados} />
        </div>
      )}
    </Container>
  );
}
