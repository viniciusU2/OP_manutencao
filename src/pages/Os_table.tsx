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
}

export function OsPage1({ search, status, subestacao }: Props) {

  const [data, setData] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  const [openDelete, setOpenDelete] = useState(false);
  const [osSelecionada, setOsSelecionada] = useState<number | null>(null);


  function extrairCodigoInstalacao(instalacao?: string) {
  if (!instalacao) return "SEM";

  // remove "SE " do início
  return instalacao.replace(/^SE\s+/i, "").trim();

}

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

    const codigoInstalacao = extrairCodigoInstalacao(os.instalacao).toUpperCase();
    const ano = getAnoOS(os);

    const nomeArquivo = `${os.numero_os}`;

    link.href = url;
    link.setAttribute("download", nomeSeguro(nomeArquivo));

    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Erro ao baixar OS:", error);
  }
}

  /* ===============================
     DELETAR OS
  =============================== */

  async function deletarOS() {
    if (!osSelecionada) return;

    try {

      await api.delete(`os/${osSelecionada}`);

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

      setData(res.data);

    } catch (error) {

      console.error("Erro ao buscar OS:", error);

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
      (os.descricao_servicos ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchStatus =
      status === "all" || os.status === status;
    
    const matchSubestacao =
      subestacao === "all" || os.id_subestacao === Number(subestacao);

    return matchSearch && matchStatus && matchSubestacao;
  });

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

      <DataTable
        columns={columns(abrirModalDelete,baixarOS)}
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