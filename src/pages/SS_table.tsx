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
  prazo: string;
  tipoEquipamento: string;
  refreshToken?: number;
}

export function SSPage1({
  search,
  status,
  subestacao,
  prazo,
  tipoEquipamento,
  refreshToken = 0,
}: Props) {
  const [data, setData] = useState<SS[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 25;

  async function deletarSS(ss: SS) {
    if (!confirm(`Deseja excluir a SS ${ss.numero_ss}?`)) return;

    try {
      await api.delete(`/ss/${ss.id_ss}`);
      setRefreshKey((value) => value + 1);
      toast.success("SS excluida com sucesso");
    } catch {
      toast.error("Erro ao excluir SS");
    }
  }

  async function atenderSS(ss: SS) {
    if (!confirm(`Deseja atender a SS ${ss.numero_ss} e criar uma OS?`)) return;

    try {
      const { data: resposta } = await api.post(`/ss/${ss.id_ss}/atender`);
      setData((prev) =>
        prev.map((item) =>
          item.id_ss === ss.id_ss
            ? {
                ...item,
                status: resposta.ss?.status ?? "PROGRAMADA",
                numero_os: resposta.ss?.numero_os ?? resposta.os?.numero_os ?? item.numero_os,
              }
            : item
        )
      );
      toast.success(`OS ${resposta.os?.numero_os ?? ""} criada para a SS`);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail ?? "Erro ao atender SS");
    }
  }

  useEffect(() => {
    setPage(1);
  }, [search, status, subestacao, prazo, tipoEquipamento]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/ss/paginado", {
          params: {
            page,
            page_size: pageSize,
            search: search.trim() || undefined,
            status: status === "all" ? undefined : status,
            id_subestacao: subestacao === "all" ? undefined : Number(subestacao),
            prazo: prazo === "all" ? undefined : prazo,
            id_tipo_ativo: tipoEquipamento === "all" ? undefined : Number(tipoEquipamento),
          },
          signal: controller.signal,
        });
        setData(Array.isArray(res.data?.items) ? res.data.items : []);
        setTotal(Number(res.data?.total ?? 0));
        setTotalPages(Number(res.data?.total_pages ?? 1));
      } catch (error: any) {
        if (error?.code !== "ERR_CANCELED") toast.error("Erro ao carregar SS");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, search, status, subestacao, prazo, tipoEquipamento, refreshKey, refreshToken]);

  if (loading) return <div className="p-6 text-gray-500">Carregando SS...</div>;

  return (
    <div className="container mx-auto py-6">
      <DataTable
        columns={columns(deletarSS, atenderSS)}
        data={data}
        pagination={{ page, pageSize, total, totalPages, onPageChange: setPage }}
      />
    </div>
  );
}
