import { useMemo, useState } from "react";

type Counter = {
  id_equipamento: number;
  bay_number?: string | null;
  operacao?: string;
  fase?: string;
  contador?: string;
  valor?: number | null;
};

type Props = { rows: Counter[] };

const series = [
  { key: "Operações controladas", color: "#0b6fca" },
  { key: "Operações não controladas", color: "#8fcaf2" },
  { key: "Reignição controlada", color: "#ff3737" },
  { key: "Reignição não controlada", color: "#ff9b9b" },
];
const phases = ["L1", "L2", "L3"];

const valueOf = (rows: Counter[], phase: string, counter: string) => {
  const row = rows.find((item) => item.fase === phase && item.contador === counter);
  return Number(row?.valor ?? 0);
};

export default function CsdCounterChart({ rows }: Props) {
  const operations = useMemo(() => Array.from(new Set(rows.map((row) => row.operacao).filter(Boolean))).sort(), [rows]);
  const [operation, setOperation] = useState("Open");
  const [hidden, setHidden] = useState<string[]>([]);
  const selectedOperation = operations.includes(operation) ? operation : operations[0] || "Open";
  const activeSeries = series.filter((item) => !hidden.includes(item.key));
  const maxValue = Math.max(...activeSeries.flatMap((item) => phases.map((phase) => valueOf(rows.filter((row) => row.operacao === selectedOperation), phase, item.key))), 1);
  const tickStep = Math.max(1, Math.ceil(maxValue / 5));
  const axisMax = tickStep * 5;
  const ticks = Array.from({ length: 6 }, (_, index) => index * tickStep);
  const width = 980;
  const height = 380;
  const left = 60;
  const top = 54;
  const chartWidth = 650;
  const chartHeight = 250;
  const groupWidth = chartWidth / phases.length;
  const barWidth = 28;
  const gap = 9;
  const groupBarsWidth = activeSeries.length * barWidth + Math.max(activeSeries.length - 1, 0) * gap;

  function toggleSeries(key: string) {
    setHidden((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm font-medium text-slate-700">Contadores por fase</p>
        <label className="flex items-center gap-2 text-sm text-slate-500">Operação=<select className="h-8 rounded-md border bg-white px-2 text-sm text-slate-700" value={selectedOperation} onChange={(event) => setOperation(event.target.value)}><option value="Open">Open</option><option value="Close">Close</option>{operations.filter((item) => item !== "Open" && item !== "Close").map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>
      <div className="w-full overflow-x-auto">
        <svg className="min-w-[760px]" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="csd-counter-title csd-counter-description">
          <title id="csd-counter-title">Contadores por fase</title>
          <desc id="csd-counter-description">Comparação dos contadores de operação nas fases L1, L2 e L3.</desc>
          <text x={left} y={20} fill="#334155" fontSize="16" fontWeight="600">Contadores por fase</text>
          <text x={left + chartWidth / 2} y={43} textAnchor="middle" fill="#64748b" fontSize="12">Operação={selectedOperation}</text>
          {ticks.map((tick) => { const y = top + chartHeight - (tick / axisMax) * chartHeight; return <g key={tick}><line x1={left} x2={left + chartWidth} y1={y} y2={y} stroke="#dbe4ee" /><text x={left - 10} y={y + 4} textAnchor="end" fill="#64748b" fontSize="12">{tick}</text></g>; })}
          <text x={16} y={top + chartHeight / 2} transform={`rotate(-90 16 ${top + chartHeight / 2})`} textAnchor="middle" fill="#64748b" fontSize="12">Quantidade</text>
          {phases.map((phase, phaseIndex) => <g key={phase}><text x={left + groupWidth * phaseIndex + groupWidth / 2} y={top + chartHeight + 27} textAnchor="middle" fill="#64748b" fontSize="12">{phase}</text>{activeSeries.map((item, seriesIndex) => { const value = valueOf(rows.filter((row) => row.operacao === selectedOperation), phase, item.key); const x = left + groupWidth * phaseIndex + (groupWidth - groupBarsWidth) / 2 + seriesIndex * (barWidth + gap); const barHeight = (value / axisMax) * chartHeight; const y = top + chartHeight - barHeight; return <g key={item.key}><rect x={x} y={y} width={barWidth} height={Math.max(barHeight, value ? 1 : 0)} fill={item.color} data-tooltip={`${item.key}: ${value}`} /><text x={x + barWidth / 2} y={Math.max(top + 13, y - 7)} textAnchor="middle" fill="#475569" fontSize="11">{value}</text></g>; })}</g>)}
          <text x={left + chartWidth / 2} y={top + chartHeight + 55} textAnchor="middle" fill="#64748b" fontSize="12">Fase</text>
          <g transform={`translate(${left + chartWidth + 36} ${top + 2})`}>{series.map((item, index) => <g key={item.key} transform={`translate(0 ${index * 30})`}><rect x="0" y="-10" width="14" height="14" fill={item.color} /><text x="25" y="1" fill={hidden.includes(item.key) ? "#94a3b8" : "#334155"} fontSize="12">{item.key}</text></g>)}</g>
        </svg>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500" aria-label="Séries do gráfico">{series.map((item) => <button type="button" key={item.key} aria-pressed={!hidden.includes(item.key)} className={`inline-flex min-h-8 items-center gap-2 ${hidden.includes(item.key) ? "opacity-50" : ""}`} onClick={() => toggleSeries(item.key)}><span className="h-3 w-3" style={{ backgroundColor: item.color }} />{item.key}</button>)}</div>
    </div>
  );
}
