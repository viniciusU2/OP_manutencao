import { useMemo } from "react";

export type HistoricalOperationRow = {
  data_operacao?: string | null;
  categoria?: string | null;
  valor?: number | string | null;
};

type SeriesKey = "controladas" | "naoControladas" | "reignicaoControlada" | "reignicaoNaoControlada";
type Point = { label: string } & Record<SeriesKey, number>;

const series: { key: SeriesKey; label: string; color: string }[] = [
  { key: "controladas", label: "Operações controladas", color: "#0b6fca" },
  { key: "naoControladas", label: "Operações não controladas", color: "#8fcaf2" },
  { key: "reignicaoControlada", label: "Reignição controlada", color: "#ff3737" },
  { key: "reignicaoNaoControlada", label: "Reignição não controlada", color: "#ff9b9b" },
];

const numeric = (value: unknown) => Number(value ?? 0);
const formatNumber = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const shortDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

function categoryKey(value?: string | null): SeriesKey | null {
  const text = (value || "").toLowerCase();
  if (text.includes("não controlada") || text.includes("nao controlada")) return text.includes("reignição") || text.includes("reignicao") ? "reignicaoNaoControlada" : "naoControladas";
  if (text.includes("reignição") || text.includes("reignicao")) return "reignicaoControlada";
  if (text.includes("controlada")) return "controladas";
  return null;
}

function linePath(points: Point[], key: SeriesKey, width: number, height: number, left: number, top: number, bottom: number, max: number) {
  const plotWidth = width - left - 24;
  const plotHeight = height - top - bottom;
  return points.map((point, index) => {
    const x = left + (points.length === 1 ? plotWidth / 2 : index * plotWidth / (points.length - 1));
    const y = top + plotHeight - (point[key] / max) * plotHeight;
    return `${x},${y}`;
  }).join(" ");
}

export function CsdHistoricalOperationsChart({ rows }: { rows: HistoricalOperationRow[] }) {
  const points = useMemo(() => {
    const daily = new Map<string, Record<SeriesKey, number>>();
    rows.forEach((row) => {
      if (!row.data_operacao) return;
      const key = categoryKey(row.categoria);
      if (!key) return;
      const current = daily.get(row.data_operacao) || { controladas: 0, naoControladas: 0, reignicaoControlada: 0, reignicaoNaoControlada: 0 };
      current[key] = Math.max(current[key], numeric(row.valor));
      daily.set(row.data_operacao, current);
    });
    return Array.from(daily.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([label, values]) => ({ label, ...values }));
  }, [rows]);

  if (!points.length) return <div className="rounded-md border border-dashed p-10 text-center text-sm text-slate-500">Nenhum contador histórico importado.</div>;

  const width = 920;
  const height = 360;
  const left = 64;
  const top = 28;
  const bottom = 58;
  const maxValue = Math.max(...points.flatMap((point) => series.map(({ key }) => point[key])), 1);
  const plotWidth = width - left - 24;
  const plotHeight = height - top - bottom;
  const grid = [0, 0.25, 0.5, 0.75, 1];
  const xAt = (index: number) => left + (points.length === 1 ? plotWidth / 2 : index * plotWidth / (points.length - 1));
  const yAt = (ratio: number) => top + plotHeight - ratio * plotHeight;

  return <div className="grid gap-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium text-slate-800">Série histórica dos contadores por data</p><p className="text-xs text-slate-500">Maior valor observado por categoria em cada data de operação.</p></div><div className="grid gap-1 text-xs text-slate-600 sm:grid-cols-2">{series.map((item) => <span key={item.key} className="flex items-center gap-2"><i className="h-2.5 w-2.5" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div></div>
    <div className="w-full overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="h-auto min-w-[680px] w-full" role="img" aria-label="Série histórica dos contadores do disjuntor">
      {grid.map((ratio) => <g key={ratio}><line x1={left} x2={width - 24} y1={yAt(ratio)} y2={yAt(ratio)} stroke="#dbe5ef" strokeWidth="1" /><text x={left - 10} y={yAt(ratio) + 4} textAnchor="end" className="fill-slate-400 text-[12px]">{formatNumber(Math.round(maxValue * ratio))}</text></g>)}
      <line x1={left} x2={width - 24} y1={top + plotHeight} y2={top + plotHeight} stroke="#94a3b8" />
      {series.map((item) => <polyline key={item.key} points={linePath(points, item.key, width, height, left, top, bottom, maxValue)} fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}
      {points.map((point, index) => <g key={point.label}><text x={xAt(index)} y={height - 26} textAnchor="middle" className="fill-slate-500 text-[12px]">{shortDate(point.label)}</text>{series.map((item) => <circle key={item.key} cx={xAt(index)} cy={top + plotHeight - (point[item.key] / maxValue) * plotHeight} r="4" fill={item.color}><title>{`${item.label}: ${formatNumber(point[item.key])}`}</title></circle>)}</g>)}
      <text x="16" y={top + plotHeight / 2} transform={`rotate(-90 16 ${top + plotHeight / 2})`} textAnchor="middle" className="fill-slate-500 text-[12px]">Quantidade</text>
      <text x={left + plotWidth / 2} y={height - 5} textAnchor="middle" className="fill-slate-500 text-[12px]">Data da operação</text>
    </svg></div>
  </div>;
}
