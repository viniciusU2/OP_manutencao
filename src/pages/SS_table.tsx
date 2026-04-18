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
  const [data, setData] = useState<SS[]>([]);

  async function baixarSS(ss:SS) {
  const response = await api.get(`/ss/${ss.id_ss}/download`, {
    responseType: "blob",
  }); 


  const blob = new Blob([response.data], {
    type: "application/vnd.ms-excel.sheet.macroEnabled.12",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", `SS-${ss.numero_ss}.xlsm`);

  document.body.appendChild(link);
  link.click();
  link.remove();
}

  async function fetch() {
    try {
      const res = await api.get("/ss");
      setData(res.data);
    } catch {
      toast.error("Erro ao carregar SI");
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
      (ss.descricao ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchStatus =
      status === "all" || ss.status === status;
    
    

    return matchSearch && matchStatus
  });

  return (
    <div className="container mx-auto py-6">
      <DataTable columns={columns(baixarSS)} data={filteredData} />
    </div>
  );
}