import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import api from "../api/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { CounterReport, type CounterRow, type MetricRow } from "../components/CsdOperationReports";
import { CsdHistoricalOperationsChart, type HistoricalOperationRow } from "../components/CsdHistoricalOperationsChart";
import { CsdOperationsPieChart } from "../components/CsdOperationsPieChart";
import { CsdLatestOperationTable } from "../components/CsdLatestOperationTable";

type Equipment = { id_equipamento: number; bay_number?: string | null; substation?: string | null };
type Dashboard = { equipamentos: Equipment[]; contadores: CounterRow[]; medidas: MetricRow[] };
type EquipmentHistoryRow = HistoricalOperationRow & { id_equipamento?: number | null; bay_number?: string | null; substation?: string | null };
const numeric = (value: unknown) => Number(value ?? 0);
const formatNumber = (value: unknown) => numeric(value).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const equipmentLabel = (item: Equipment) => `${item.bay_number || item.substation || `Equipamento ${item.id_equipamento}`} — ${item.substation || ""}`;
const measureBelongsTo = (row: MetricRow, item?: Equipment) => Boolean(item && ((item.bay_number && row.bay_number === item.bay_number) || (item.substation && row.substation === item.substation)));

function errorMessage(error: unknown) {
  return (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Não foi possível carregar os relatórios.";
}

export default function CsdMonitorReportsPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [history, setHistory] = useState<EquipmentHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [operationFilter, setOperationFilter] = useState("Open");
  const [latestEquipmentFilter, setLatestEquipmentFilter] = useState("");
  const [historyEquipmentFilter, setHistoryEquipmentFilter] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardResponse, historyResponse] = await Promise.all([
        api.get<Dashboard>("/csd-monitor/dashboard"),
        api.get<EquipmentHistoryRow[]>("/csd-monitor/historico-operacoes"),
      ]);
      const equipments = dashboardResponse.data.equipamentos || [];
      const firstEquipment = String(equipments[0]?.id_equipamento || "");
      setDashboard(dashboardResponse.data);
      setHistory(historyResponse.data);
      setLatestEquipmentFilter((current) => equipments.some((item) => String(item.id_equipamento) === current) ? current : firstEquipment);
      setHistoryEquipmentFilter((current) => equipments.some((item) => String(item.id_equipamento) === current) ? current : firstEquipment);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const visibleCounters = useMemo(() => {
    if (!dashboard) return [];
    if (equipmentFilter === "all") return dashboard.contadores;
    return dashboard.contadores.filter((row) => row.id_equipamento === Number(equipmentFilter));
  }, [dashboard, equipmentFilter]);
  const latestEquipment = dashboard?.equipamentos.find((item) => String(item.id_equipamento) === latestEquipmentFilter);
  const latestMeasures = (dashboard?.medidas || []).filter((row) => measureBelongsTo(row, latestEquipment));
  const equipmentHistory = history.filter((row) => row.id_equipamento === Number(historyEquipmentFilter));
  const currentCounters = visibleCounters.filter((row) => operationFilter === "Todas" || row.operacao === operationFilter);
  const controlled = currentCounters.filter((row) => row.contador === "Operações controladas").reduce((sum, row) => sum + numeric(row.valor), 0);
  const uncontrolled = currentCounters.filter((row) => row.contador === "Operações não controladas").reduce((sum, row) => sum + numeric(row.valor), 0);
  const reignitions = currentCounters.filter((row) => row.contador === "Reignição controlada" || row.contador === "Reignição não controlada").reduce((sum, row) => sum + numeric(row.valor), 0);

  const equipmentSelect = (value: string, onChange: (value: string) => void, label: string) => <label className="grid gap-1 text-xs font-medium text-slate-500"><span>{label}</span><select className="h-9 min-w-[250px] rounded-md border bg-white px-3 text-sm text-slate-700" value={value} onChange={(event) => onChange(event.target.value)}>{dashboard?.equipamentos.map((item) => <option key={item.id_equipamento} value={item.id_equipamento}>{equipmentLabel(item)}</option>)}</select></label>;

  return <div className="mx-auto grid max-w-[1500px] gap-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Activity className="text-blue-600" size={24} /><h1 className="m-0 text-2xl font-semibold text-slate-900">Operação do disjuntor</h1></div><p className="mt-1 text-sm text-slate-500">Gráficos operacionais e série histórica dos contadores CSD100.</p></div><div className="flex gap-2"><Button variant="outline" asChild><Link to="/csd-monitor/controle">Controle de arquivos</Link></Button><Button variant="outline" onClick={() => void loadReports()} disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Atualizar</Button></div></div>
    {dashboard && <>
      <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Operações controladas</p><strong className="mt-1 block text-2xl text-slate-900">{formatNumber(controlled)}</strong></div><Activity size={21} className="text-blue-600" /></CardContent></Card><Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Operações não controladas</p><strong className="mt-1 block text-2xl text-slate-900">{formatNumber(uncontrolled)}</strong></div><Activity size={21} className="text-sky-400" /></CardContent></Card><Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reignições</p><strong className="mt-1 block text-2xl text-slate-900">{formatNumber(reignitions)}</strong></div><BarChart3 size={21} className="text-red-500" /></CardContent></Card></div>
      <Card><CardHeader className="flex-row flex-wrap items-center justify-between gap-4"><div><CardTitle>Filtros da operação</CardTitle><CardDescription>Selecione o equipamento e a operação para atualizar os contadores.</CardDescription></div><div className="flex flex-wrap gap-2"><select className="h-9 rounded-md border bg-white px-3 text-sm" value={equipmentFilter} onChange={(event) => setEquipmentFilter(event.target.value)}><option value="all">Todos os equipamentos</option>{dashboard.equipamentos.map((item) => <option key={item.id_equipamento} value={item.id_equipamento}>{equipmentLabel(item)}</option>)}</select><select className="h-9 rounded-md border bg-white px-3 text-sm" value={operationFilter} onChange={(event) => setOperationFilter(event.target.value)}><option value="Open">Abertura</option><option value="Close">Fechamento</option><option value="Todas">Todas</option></select></div></CardHeader></Card>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"><Card><CardHeader><CardTitle>Contadores por fase</CardTitle><CardDescription>Operações controladas, não controladas e reignições por fase.</CardDescription></CardHeader><CardContent><CounterReport rows={currentCounters} operation={operationFilter} /></CardContent></Card><Card><CardHeader><CardTitle>Distribuição das aberturas</CardTitle><CardDescription>Operações controladas e não controladas.</CardDescription></CardHeader><CardContent><CsdOperationsPieChart rows={currentCounters} operation={operationFilter} /></CardContent></Card></div>
      <Card><CardHeader className="flex-row flex-wrap items-end justify-between gap-4"><div><CardTitle>Informações da última operação</CardTitle><CardDescription>Grandezas organizadas por operação e fase, como no relatório CSD100.</CardDescription></div>{equipmentSelect(latestEquipmentFilter, setLatestEquipmentFilter, "Equipamento da última operação")}</CardHeader><CardContent><CsdLatestOperationTable rows={latestMeasures} /></CardContent></Card>
      <Card><CardHeader className="flex-row flex-wrap items-end justify-between gap-4"><div><CardTitle>Série histórica de operações do disjuntor</CardTitle><CardDescription>Os quatro tipos de contador do equipamento selecionado.</CardDescription></div>{equipmentSelect(historyEquipmentFilter, setHistoryEquipmentFilter, "Equipamento da série histórica")}</CardHeader><CardContent><CsdHistoricalOperationsChart rows={equipmentHistory} /></CardContent></Card>
    </>}
  </div>;
}

