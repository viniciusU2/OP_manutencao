import { useEffect, useState } from "react";
import api from "../api/api";
import type { OrdemServico } from "../types/OrdemServico";
import { DataTable } from "../components/ui/data-table";
import { columns } from "../components/os/columns";
import { DeleteModal } from "../components/DeleteModal";

interface Props {
  search: string;
  status: string;
  subestacao: string;
  esquema_servicos:string;
}

export function OsPage1({ search, status, subestacao,esquema_servicos }: Props) {

  const [data, setData] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [openDelete, setOpenDelete] = useState(false);
  const [osSelecionada, setOsSelecionada] = useState<number | null>(null);



  // remove "SE " do início
function nomeSeguro(texto: string) {
  return texto.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

/*
function getAnoOS(os: OrdemServico) {
  const data =
    os.data_inicio_programado ||
    os.data_fim_programado;

  if (!data) return new Date().getFullYear(); // fallback

  return new Date(data).getFullYear();
}


function nomeSeguro(texto: string) {
  return texto.replace(/[^a-zA-Z0-9_-]/g, "_");
}
*/

  /* ===============================
     ABRIR MODAL
  =============================== */

  function abrirModalDelete(id: number) {
    setOsSelecionada(id);
    setOpenDelete(true);
  }

async function baixarOS(os: OrdemServico) {
  try {
    const response = await api.get(`/os/${os.id_os}/download`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.ms-excel.sheet.macroEnabled.12",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    const nomeArquivo = `${os.numero_os}.xlsm`;

    link.href = url;
    link.setAttribute("download", nomeSeguro(nomeArquivo));

    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Erro ao baixar OS:", error);
  }
}

 async function baixarAPR(os: OrdemServico) {
  try {
    const response = await api.get(`/os/${os.id_os}/apr/download`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.ms-excel.sheet.macroEnabled.12",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    const nomeArquivo = `${os.numero_apr || `APR_${os.numero_os}`}.xlsm`;

    link.href = url;
    link.setAttribute("download", nomeSeguro(nomeArquivo));

    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Erro ao baixar APR:", error);
  }
}

  /* ===============================
     DELETAR OS
  =============================== */

  async function deletarOS() {
    if (!osSelecionada) return;

    try {

      await api.delete(`/os/${osSelecionada}`);

      setData((prev) =>
        prev.filter((os) => os.id_os !== osSelecionada)
      );

    } catch (error) {
      console.error("Erro ao excluir OS:", error);
    } finally {
      setOpenDelete(false);
    }
  }

  /* ===============================
     BUSCAR OS
  =============================== */

  const fetchOS = async () => {

    try {

      const res = await api.get("/os");

      setData(Array.isArray(res.data) ? res.data : []);
      setErroCarregamento("");

    } catch (error: any) {

      console.error("Erro ao buscar OS:", error);
      setErroCarregamento(
        error?.response?.data?.detail ||
          error?.message ||
          "Erro ao carregar ordens de servico."
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchOS();
  }, []);

  /* ===============================
     FILTROS
  =============================== */

  const filteredData = data.filter((os) => {

    const matchSearch =
      !search ||
      os.numero_os?.toLowerCase().includes(search.toLowerCase()) ||
      (os.codigo_ativo ?? os.ativo?.codigo_ativo ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (os.descricao_servicos ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchStatus =
      status === "all" || os.status === status;

   const matchEsquema =
  esquema_servicos === "all" ||
  (os.esquema_servicos ?? "")
    .trim()
    .toLowerCase()
    .includes(esquema_servicos.trim().toLowerCase());
    
    const matchSubestacao =
      subestacao === "all" || os.id_subestacao === Number(subestacao);

    return matchSearch && matchStatus && matchSubestacao && matchEsquema;
  });

  const semResultadoPorFiltro = data.length > 0 && filteredData.length === 0;

  /* ===============================
     LOADING
  =============================== */

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">
          Carregando ordens de serviço...
        </p>
      </div>
    );
  }

  /* ===============================
     PAGE
  =============================== */

  return (

    <div className="container mx-auto py-6">
      {erroCarregamento && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erro ao carregar OS: {erroCarregamento}
        </div>
      )}

      {semResultadoPorFiltro && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Existem {data.length} OS carregadas, mas os filtros atuais nao retornaram registros.
        </div>
      )}

      <DataTable
        columns={columns(abrirModalDelete, baixarOS, baixarAPR)}
        data={filteredData}
      />

      <DeleteModal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={deletarOS}
      />

    </div>

  );
}
