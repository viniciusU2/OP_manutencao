import { useEffect, useState } from "react";
import api from "../api/api";
import { DataTable } from "../components/ui/data-table";
import { columns } from "../components/si/columns";
import { toast } from "sonner";
import { CalendarSearch } from "lucide-react";
import type { SI } from "../types/SI";
import type { AdvancedFilter } from "../components/AdvancedDocumentFilters";
import { useAuth } from "../context/AuthContext";
import {
  ORDEM_STATUS_SI,
  STATUS_SI_COR,
  STATUS_SI_LABEL,
  statusRequerAcao,
} from "../lib/siFluxo";

interface Props {
  search: string;
  status: string;
  subestacao: string;
  tipoEquipamento: string;
  advancedFilters: AdvancedFilter[];
  onStatusChange: (status: string) => void;
}

interface ResumoStatus {
  status: string;
  total: number;
}

/* ================= RESUMO DE STATUS (chips clicáveis) ================= */

function ChipStatus({
  rotulo,
  total,
  cor,
  ativo,
  requerAcao,
  onClick,
}: {
  rotulo: string;
  total: number;
  cor: string;
  ativo: boolean;
  requerAcao: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={ativo ? "Remover filtro" : "Filtrar por este status"}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition ${
        ativo
          ? "border-slate-900 bg-slate-900 text-white"
          : requerAcao && total > 0
            ? "border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
      style={!ativo && requerAcao && total > 0 ? { borderColor: cor } : undefined}
    >
      <span
        className="inline-block size-2 rounded-full"
        style={{ background: ativo ? "#ffffff" : cor }}
      />
      <span className={requerAcao && total > 0 ? "font-semibold" : undefined}>
        {rotulo}
      </span>
      <span
        className={`rounded-full px-1.5 text-[11px] tabular-nums ${
          ativo ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
        }`}
      >
        {total}
      </span>
    </button>
  );
}

/* ================= TABELA ================= */

export function SIPage1({ search, status, subestacao, tipoEquipamento, advancedFilters, onStatusChange }: Props) {
  const { usuario } = useAuth();
  const [data, setData] = useState<SI[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [resumo, setResumo] = useState<ResumoStatus[]>([]);
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
    } catch (error: any) {
      console.error("Erro ao excluir SI:", error);
      const detalhe = error?.response?.data?.detail;
      toast.error(typeof detalhe === "string" ? detalhe : "Erro ao excluir SI");
    }
  }

  useEffect(() => {
    setPage(1);
  }, [search, status, subestacao, tipoEquipamento, advancedFilters]);

  useEffect(() => {
    api
      .get("/si/resumo-status")
      .then((res) => setResumo(Array.isArray(res.data?.items) ? res.data.items : []))
      .catch(() => setResumo([]));
  }, [refreshKey]);

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

  const resumoOrdenado = [...resumo].sort(
    (a, b) => ORDEM_STATUS_SI.indexOf(a.status as never) - ORDEM_STATUS_SI.indexOf(b.status as never)
  );
  const totalGeral = resumo.reduce((soma, item) => soma + item.total, 0);

  return (
    <div className="container mx-auto py-6">
      {resumoOrdenado.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <ChipStatus
            rotulo="Todas"
            total={totalGeral}
            cor="#0f172a"
            ativo={status === "all"}
            requerAcao={false}
            onClick={() => onStatusChange("all")}
          />
          {resumoOrdenado.map((item) => (
            <ChipStatus
              key={item.status}
              rotulo={STATUS_SI_LABEL[item.status] ?? item.status}
              total={item.total}
              cor={STATUS_SI_COR[item.status] ?? "#64748b"}
              ativo={status === item.status}
              requerAcao={statusRequerAcao(item.status, usuario)}
              onClick={() =>
                onStatusChange(status === item.status ? "all" : item.status)
              }
            />
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-6 text-slate-500">
          <span className="size-2 animate-pulse rounded-full bg-slate-400" />
          Carregando SI...
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <CalendarSearch size={28} className="text-slate-300" />
          <strong className="text-slate-700">Nenhuma SI encontrada</strong>
          <span className="text-sm text-slate-500">
            Ajuste a busca ou os filtros para ver outras solicitações.
          </span>
        </div>
      ) : (
        <DataTable
          columns={columns(baixarSI, deletarSI)}
          data={data}
          pagination={{ page, pageSize, total, totalPages, onPageChange: setPage }}
        />
      )}
    </div>
  );
}
