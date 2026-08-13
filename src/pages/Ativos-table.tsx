import { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import type { Ativo } from "../types/Ativo";
import { DataTable } from "../components/ui/data-table";
import { columns } from "../components/ativos/columns";
import Container from "../components/Container";

const normalizarBusca = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

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

      const termos = normalizarBusca(search).split(" ").filter(Boolean);
      const conteudoPesquisavel = normalizarBusca(JSON.stringify(ativo));
      const matchSearch = termos.every((termo) => conteudoPesquisavel.includes(termo));

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
