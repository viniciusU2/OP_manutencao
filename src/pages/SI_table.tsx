import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { DataTable } from "../components/ui/data-table";
import { columns } from "../components/si/columns";
import { toast } from "sonner";
import type { SI } from "../types/SI";
import type { Ativo } from "../types/Ativo";

interface Props {
  search: string;
  status: string;
  subestacao: string;
}

export function SIPage1({ search, status, subestacao }: Props) {
  const [data, setData] = useState<SI[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);

async function baixarSI(si: SI) {
  try {
    const response = await api.get(`/si/${si.id_si}/download`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.ms-excel.sheet.macroEnabled.12",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `${si.numero_si}.xlsx`);

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Erro ao baixar SI:", error);
    toast.error("Erro ao baixar SI");
  }
}

  async function deletarSI(si: SI) {
    if (!confirm(`Deseja excluir a SI ${si.numero_si}?`)) return;

    try {
      await api.delete(`/si/${si.id_si}`);
      setData((prev) => prev.filter((item) => item.id_si !== si.id_si));
      toast.success("SI excluida com sucesso");
    } catch (error) {
      console.error("Erro ao excluir SI:", error);
      toast.error("Erro ao excluir SI");
    }
  }

  async function fetch() {
    try {
      const res = await api.get("/si");
      setData(res.data);
    } catch {
      toast.error("Erro ao carregar SI");
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

  const filteredData = data.filter((si) => {

    const matchSearch =
      !search ||
      si.numero_si.toLowerCase().includes(search.toLowerCase()) ||
      (si.descricao_servicos ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchStatus =
      status === "all" || si.status_manutencao === status;
    
    const matchSubestacao =
      subestacao === "all" ||
      si.id_subestacao === Number(subestacao) ||
      (si.id_ativo != null && subestacaoPorAtivo[si.id_ativo] === Number(subestacao));

    return matchSearch && matchStatus && matchSubestacao;
  });

  return (
    <div className="container mx-auto py-6">
      <DataTable columns={columns(baixarSI, deletarSI)} data={filteredData} />
    </div>
  );
}
