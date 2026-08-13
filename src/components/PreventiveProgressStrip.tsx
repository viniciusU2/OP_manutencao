import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/api";

interface OSProgress {
  status?: string;
  esquema_servicos?: string;
  id_subestacao?: number | null;
  data_inicio_programado?: string | null;
  criado_em?: string | null;
}

const PERIODS = [
  { key: "PREVENTIVA SEMANAL", label: "Semanal", hint: "semana atual", months: 0 },
  { key: "PREVENTIVA MENSAL", label: "Mensal", hint: "último ciclo", months: 1 },
  { key: "PREVENTIVA BIMESTRAL", label: "Bimestral", hint: "último ciclo", months: 2 },
  { key: "PREVENTIVA SEMESTRAL", label: "Semestral", hint: "último ciclo", months: 6 },
  { key: "PREVENTIVA ANUAL", label: "Anual", hint: "último ciclo", months: 12 },
];

const getDate = (ordem: OSProgress) => {
  const value = ordem.data_inicio_programado || ordem.criado_em;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const latestCycle = (items: OSProgress[], monthsPerCycle: number) => {
  const dated = items
    .map((item) => ({ item, date: getDate(item) }))
    .filter((entry): entry is { item: OSProgress; date: Date } => Boolean(entry.date));
  if (!dated.length) return [];

  const latest = dated.reduce((current, entry) => entry.date > current.date ? entry : current);
  const cycle = Math.floor(latest.date.getMonth() / monthsPerCycle);
  return dated
    .filter(({ date }) => date.getFullYear() === latest.date.getFullYear()
      && Math.floor(date.getMonth() / monthsPerCycle) === cycle)
    .map(({ item }) => item);
};

const currentWeek = (items: OSProgress[]) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return items.filter((item) => {
    const date = getDate(item);
    return date && date >= start && date < end;
  });
};

const progressColor = (value: number) =>
  value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-blue-500" : "bg-amber-500";

export function PreventiveProgressStrip({ subestacao }: { subestacao?: string }) {
  const [ordens, setOrdens] = useState<OSProgress[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    api.get("/os")
      .then((response) => setOrdens(Array.isArray(response.data) ? response.data : []))
      .catch(() => setOrdens([]));
  }, []);

  const data = useMemo(() => PERIODS.map((periodo) => {
    const matching = ordens.filter((ordem) => {
      const mesmaSubestacao = !subestacao || subestacao === "all"
        || Number(ordem.id_subestacao) === Number(subestacao);
      return mesmaSubestacao
        && (ordem.esquema_servicos || "").trim().toLocaleUpperCase("pt-BR") === periodo.key;
    });
    const items = periodo.key === "PREVENTIVA SEMANAL"
      ? currentWeek(matching)
      : latestCycle(matching, periodo.months);
    const concluidas = items.filter((ordem) =>
      ["ENCERRADA", "CONCLUIDA", "CONCLUÍDA"].includes(
        (ordem.status || "").toLocaleUpperCase("pt-BR")
      )
    ).length;
    return {
      ...periodo,
      total: items.length,
      concluidas,
      percentual: items.length ? Math.round((concluidas / items.length) * 100) : 0,
    };
  }), [ordens, subestacao]);

  return (
    <section aria-label="Progresso das preventivas" className="relative mb-3 sm:-mt-10">
      <div ref={sliderRef} className="flex cursor-grab snap-x snap-mandatory touch-pan-x overflow-x-auto active:cursor-grabbing rounded-md border border-slate-200/80 bg-white/70 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {data.map((item, index) => (
          <div key={item.key} className={`flex min-w-full snap-start items-center gap-3 px-4 py-2 sm:min-w-[33.333333%] ${index ? "border-l border-slate-100" : ""}`}>
            <div className="min-w-[74px]">
              <span className="block text-[11px] font-semibold leading-tight text-slate-700">{item.label}</span>
              <span className="block text-[9px] leading-tight text-slate-400">{item.hint}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full transition-all duration-300 ${progressColor(item.percentual)}`} style={{ width: `${item.percentual}%` }} />
              </div>
            </div>
            <span className="whitespace-nowrap text-[10px] tabular-nums text-slate-500">
              <strong className="text-xs text-slate-700">{item.percentual}%</strong>{` · ${item.concluidas}/${item.total}`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
