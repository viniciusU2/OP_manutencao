import { useEffect, useState } from "react";
import api from "../api/api";
import { DataTable } from "../components/ui/data-table";
import { columns } from "../components/ss/columns";
import { toast } from "sonner";
import type { SS } from "../types/SS";

interface Props {
  search: string;
  status: string;
  subestacao: string;
}

export function SSPage1({ search, status, subestacao }: Props) {
  void subestacao;
  const [data, setData] = useState<SS[]>([]);

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


    
  /*==============FILTROS================= */

  const filteredData = data.filter((ss) => {

    const matchSearch =
      !search ||
      ss.numero_ss.toLowerCase().includes(search.toLowerCase()) ||
      (ss.descricao_problema ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchStatus =
      status === "all" || ss.status === status;
    
    

    return matchSearch && matchStatus
  });

  return (
    <div className="container mx-auto py-6">
      <DataTable columns={columns(deletarSS)} data={filteredData} />
    </div>
  );
}
