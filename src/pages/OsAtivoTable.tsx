import { useEffect, useState } from "react";
import api from "../api/api";
import type { OrdemServico } from "../types/OrdemServico";
import { DataTable } from "../components/ui/data-table";
import { columns } from "../components/os/columns";
import { DeleteModal } from "../components/DeleteModal";

interface Props {
  idAtivo: number;
}

export function OsAtivoTable({ idAtivo }: Props) {
  const [data, setData] = useState<OrdemServico[]>([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [osSelecionada, setOsSelecionada] = useState<number | null>(null);

   /* ===============================
     ABRIR MODAL
  =============================== */

  function abrirModalDelete(id: number) {
    setOsSelecionada(id);
    setOpenDelete(true);
  }

  function nomeSeguro(texto: string) {
    return texto.replace(/[^a-zA-Z0-9_.-]/g, "_");
  }

  async function baixarOS(os: OrdemServico) {
  if (!os.id_os) return;

  try {
    const response = await api.get(`/os/${os.id_os}/download`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(
      new Blob([response.data], {
        type: "application/vnd.ms-excel.sheet.macroEnabled.12",
      })
    );
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", nomeSeguro(`${os.numero_os}.xlsm`));

    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Erro ao baixar OS:", error);
  }
}

  async function baixarAPR(os: OrdemServico) {
  if (!os.id_os) return;

  try {
    const response = await api.get(`/os/${os.id_os}/apr/download`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(
      new Blob([response.data], {
        type: "application/vnd.ms-excel.sheet.macroEnabled.12",
      })
    );
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      nomeSeguro(`${os.numero_apr || `APR_${os.numero_os}`}.xlsm`)
    );

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


  useEffect(() => {
    api
      .get(`/os/ativo/${idAtivo}`)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Erro ao carregar OS:", err);
      });
  }, [idAtivo]);

  return (
    <div className="container mx-auto py-6">
      
      
      <DataTable
        columns={columns(abrirModalDelete, baixarOS, baixarAPR)}
        data={data}
      />

        <DeleteModal
              open={openDelete}
              onClose={() => setOpenDelete(false)}
              onConfirm={deletarOS}
            />
    </div>
  );
}
