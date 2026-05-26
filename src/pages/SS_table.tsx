import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { DataTable } from "../components/ui/data-table";
import { columns } from "../components/ss/columns";
import { toast } from "sonner";
import type { SS } from "../types/SS";
import type { Ativo } from "../types/Ativo";

interface Props {
  search: string;
  status: string;
  subestacao: string;
}

export function SSPage1({ search, status, subestacao }: Props) {
  const [data, setData] = useState<SS[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);

  async function deletarSS(ss: SS) {
    if (!confirm(`Deseja excluir a SS ${ss.numero_ss}?`)) return;

    try {
      await api.delete(`/ss/${ss.id_ss}`);
      setData((prev) => prev.filter((item) => item.id_ss !== ss.id_ss));
      toast.success("SS excluida com sucesso");
    } catch {
      toast.error("Erro ao excluir SS");
    }
  }

  async function fetch() {
    try {
      const res = await api.get("/ss");
      setData(res.data);
    } catch {
      toast.error("Erro ao carregar SS");
    }
  }

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    api
      .get("/ativo")
      .then((res) => setAtivos(res.data))
      .catch(() => toast.error("Erro ao carregar ativos para filtro de subestacao"));
  }, []);

  const subestacaoPorAtivo = useMemo(() => {
    return ativos.reduce<Record<number, number>>((acc, ativo) => {
      if (ativo.id_ativo) {
        acc[ativo.id_ativo] = ativo.id_subestacao;
      }

      return acc;
    }, {});
  }, [ativos]);


    
  /*==============FILTROS================= */

  const filteredData = data.filter((ss) => {

    const matchSearch =
      !search ||
      (ss.numero_ss ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (ss.descricao_problema ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchStatus =
      status === "all" || ss.status === status;

    const matchSubestacao =
      subestacao === "all" ||
      (ss.id_ativo != null && subestacaoPorAtivo[ss.id_ativo] === Number(subestacao));

    return matchSearch && matchStatus && matchSubestacao;
  });

  return (
    <div className="container mx-auto py-6">
      <DataTable columns={columns(deletarSS)} data={filteredData} />
    </div>
  );
}
