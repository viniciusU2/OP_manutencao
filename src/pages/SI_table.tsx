import { useEffect, useState } from "react";
import api from "../api/api";
import { DataTable } from "../components/ui/data-table";
import { columns } from "../components/si/columns";
import { toast } from "sonner";
import type { SI } from "../types/SI";
import type { AdvancedFilter } from "../components/AdvancedDocumentFilters";

interface Props {
  search: string;
  status: string;
  subestacao: string;
  tipoEquipamento: string;
  advancedFilters: AdvancedFilter[];
}

export function SIPage1({ search, status, subestacao, tipoEquipamento, advancedFilters }: Props) {
  const [data, setData] = useState<SI[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 25;

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
      setRefreshKey((value) => value + 1);
      toast.success("SI excluida com sucesso");
    } catch (error) {
      console.error("Erro ao excluir SI:", error);
      toast.error("Erro ao excluir SI");
    }
  }

  useEffect(() => {
    setPage(1);
  }, [search, status, subestacao, tipoEquipamento, advancedFilters]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/si/paginado", {
          params: {
            page,
            page_size: pageSize,
            search: search.trim() || undefined,
            status: status === "all" ? undefined : status,
            id_subestacao: subestacao === "all" ? undefined : Number(subestacao),
            id_tipo_ativo: tipoEquipamento === "all" ? undefined : Number(tipoEquipamento),
            filter_field: advancedFilters.filter(f=>f.value.trim()).map(f=>f.field),
            filter_value: advancedFilters.filter(f=>f.value.trim()).map(f=>f.value),
          },
          signal: controller.signal,
        });
        setData(Array.isArray(res.data?.items) ? res.data.items : []);
        setTotal(Number(res.data?.total ?? 0));
        setTotalPages(Number(res.data?.total_pages ?? 1));
      } catch (error: any) {
        if (error?.code !== "ERR_CANCELED") toast.error("Erro ao carregar SI");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, search, status, subestacao, tipoEquipamento, advancedFilters, refreshKey]);

  if (loading) return <div className="p-6 text-gray-500">Carregando SI...</div>;

  return (
    <div className="container mx-auto py-6">
      <DataTable
        columns={columns(baixarSI, deletarSI)}
        data={data}
        pagination={{ page, pageSize, total, totalPages, onPageChange: setPage }}
      />
    </div>
  );
}
