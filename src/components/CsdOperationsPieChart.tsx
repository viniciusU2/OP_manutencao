import { useMemo } from "react";

type CounterRow = { contador?: string; operacao?: string; valor?: number | null };
const numeric = (value: unknown) => Number(value ?? 0);
const colors = { controlled: "#1f6fae", uncontrolled: "#f07f20" };

export function CsdOperationsPieChart({ rows, operation }: { rows: CounterRow[]; operation: string }) {
  const values = useMemo(() => ({
    controlled: rows.filter((row) => row.contador === "Operações controladas" && (operation === "Todas" || row.operacao === operation)).reduce((sum, row) => sum + numeric(row.valor), 0),
    uncontrolled: rows.filter((row) => row.contador === "Operações não controladas" && (operation === "Todas" || row.operacao === operation)).reduce((sum, row) => sum + numeric(row.valor), 0),
  }), [rows, operation]);
  const total = values.controlled + values.uncontrolled;
  const controlledShare = total ? values.controlled / total : 0;
  const uncontrolledShare = total ? values.uncontrolled / total : 0;
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const controlledLength = controlledShare * circumference;
  const uncontrolledLength = uncontrolledShare * circumference;
  const labelPoint = (share: number, start: number) => {
    const angle = (start + share / 2) * Math.PI * 2 - Math.PI / 2;
    return { x: 150 + Math.cos(angle) * 92, y: 150 + Math.sin(angle) * 92 };
  };
  const controlledLabel = labelPoint(controlledShare, 0);
  const uncontrolledLabel = labelPoint(uncontrolledShare, controlledShare);

  if (!total) return <div className="rounded-md border border-dashed p-10 text-center text-sm text-slate-500">Nenhum contador de abertura para distribuir.</div>;

  return <div className="grid gap-4">
    <div className="flex items-center gap-5 text-xs text-slate-600"><span className="flex items-center gap-2"><i className="h-3 w-3" style={{ backgroundColor: colors.controlled }} />Controladas</span><span className="flex items-center gap-2"><i className="h-3 w-3" style={{ backgroundColor: colors.uncontrolled }} />Não controladas</span></div>
    <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-[360px]" role="img" aria-label="Distribuição das aberturas controladas e não controladas">
      <circle cx="150" cy="150" r={radius} fill="none" stroke="#eef2f7" strokeWidth="42" />
      <circle cx="150" cy="150" r={radius} fill="none" stroke={colors.controlled} strokeWidth="42" strokeDasharray={`${controlledLength} ${circumference}`} strokeDashoffset="0" transform="rotate(-90 150 150)" />
      <circle cx="150" cy="150" r={radius} fill="none" stroke={colors.uncontrolled} strokeWidth="42" strokeDasharray={`${uncontrolledLength} ${circumference}`} strokeDashoffset={`${-controlledLength}`} transform="rotate(-90 150 150)" />
      <circle cx="150" cy="150" r="57" fill="white" />
      <text x="150" y="145" textAnchor="middle" className="fill-slate-800 text-[22px] font-semibold">{Math.round(total).toLocaleString("pt-BR")}</text>
      <text x="150" y="164" textAnchor="middle" className="fill-slate-500 text-[11px]">total</text>
      {controlledShare > 0.16 && <text x={controlledLabel.x} y={controlledLabel.y} textAnchor="middle" className="fill-white text-[11px] font-semibold"><tspan x={controlledLabel.x} dy="-2">Controladas</tspan><tspan x={controlledLabel.x} dy="14">{(controlledShare * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</tspan></text>}
      {uncontrolledShare > 0.04 && <text x={uncontrolledLabel.x} y={uncontrolledLabel.y} textAnchor="middle" className="fill-slate-700 text-[10px] font-medium"><tspan x={uncontrolledLabel.x} dy="-2">Não controladas</tspan><tspan x={uncontrolledLabel.x} dy="13">{(uncontrolledShare * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</tspan></text>}
    </svg>
    <p className="text-center text-sm font-semibold text-slate-800">Distribuição das aberturas</p>
  </div>;
}

