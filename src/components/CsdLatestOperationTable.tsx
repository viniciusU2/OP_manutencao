import { useMemo } from "react";

export type LatestOperationMeasure = { id_evento: number; data_evento?: string | null; archive_type?: string | null; fase?: string | null; grandeza?: string | null; unidade?: string | null; valor?: number | null };
const phases = ["L1", "L2", "L3"];
const operations = ["Close", "Open"];
const metrics = [
  ["calculated_angle", "Ângulo calculado"], ["measured_angle", "Ângulo medido"], ["making_time_error", "Erro no tempo de fechamento"],
  ["calculated_prearc_time", "Tempo calculado de pré-arco / arco"], ["measured_prearc_time", "Tempo medido de pré-arco / arco"],
  ["calculated_meca_time_compensation_udc", "Compensação calculada da tensão de controle"], ["calculated_meca_time", "Tempo de operação calculado"], ["measured_meca_time", "Tempo de operação medido"],
] as const;
const operationOf = (value?: string | null) => (value || "").toLowerCase().includes("close") ? "Close" : "Open";
const formatValue = (value?: number | null, unit?: string | null) => value == null || Number.isNaN(Number(value)) ? "-" : `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit || ""}`.trim();

export function CsdLatestOperationTable({ rows }: { rows: LatestOperationMeasure[] }) {
  const latest = useMemo(() => {
    const sorted = [...rows].sort((a, b) => new Date(b.data_evento || 0).getTime() - new Date(a.data_evento || 0).getTime() || b.id_evento - a.id_evento);
    return new Map(sorted.map((row) => [`${operationOf(row.archive_type)}-${row.grandeza}-${row.fase || "Geral"}`, row]));
  }, [rows]);

  return <div className="overflow-x-auto"><table className="w-full min-w-[820px] border-collapse text-sm"><thead><tr className="border-b-2 border-slate-900"><th rowSpan={2} className="w-[265px] px-3 py-3 text-left font-medium text-slate-500">Grandeza</th>{operations.map((operation) => <th key={operation} colSpan={3} className="border-l px-3 py-3 text-center font-semibold text-blue-700">{operation === "Open" ? "Abertura" : "Fechamento"}</th>)}</tr><tr className="border-b text-xs text-slate-500">{operations.flatMap((operation) => phases.map((phase) => <th key={`${operation}-${phase}`} className="border-l px-3 py-2 text-center font-medium">{phase}</th>))}</tr></thead><tbody>{metrics.map(([metric, label]) => <tr key={metric} className="border-b"><td className="px-3 py-3 font-medium text-slate-700">{label}</td>{operations.flatMap((operation) => phases.map((phase) => { const row = latest.get(`${operation}-${metric}-${phase}`); return <td key={`${metric}-${operation}-${phase}`} className="border-l px-3 py-3 text-center tabular-nums text-slate-700">{formatValue(row?.valor, row?.unidade)}</td>; }))}</tr>)}</tbody></table></div>;
}


