import { useEffect, useMemo, useState } from "react";
import { CalendarDays, RefreshCcw } from "lucide-react";
import api from "../api/api";
import { Button } from "./ui/button";

type ResumoPlano = {
  id_plano_manutencao: number;
  plano?: string | null;
  periodicidade: string;
  intervalo: number;
  id_tipo_ativo: number;
  tipo_ativo: string;
  ultima_execucao: string | null;
  proxima_execucao: string | null;
  total_ativos: number;
  ativos_com_execucao: number;
};

const PERIODICIDADES: Record<string, string> = {
  SEMANAL: "Semanal", MENSAL: "Mensal", BIMESTRAL: "Bimestral", TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral", ANUAL: "Anual", "3_ANOS": "A cada 3 anos", "5_ANOS": "A cada 5 anos", "6_ANOS": "A cada 6 anos",
};
const DIA = 86400000;
const POR_PAGINA = 8;

function timestamp(value: string | null) {
  if (!value) return null;
  const result = new Date(value).getTime();
  return Number.isNaN(result) ? null : result;
}

function dataLabel(value: string | null) {
  const date = timestamp(value);
  return date === null ? "Sem registro" : new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "short",
  }).format(date);
}

function chave(row: ResumoPlano) {
  return `${row.id_plano_manutencao}:${row.periodicidade}:${row.intervalo}:${row.id_tipo_ativo}`;
}

export default function PlanoExecucoesDashboardChart({ idSubestacao }: { idSubestacao: string }) {
  const [dados, setDados] = useState<ResumoPlano[]>([]);
  const [carregado, setCarregado] = useState<string | null>(null);
  const [erro, setErro] = useState(false);
  const [revisao, setRevisao] = useState(0);
  const [tipo, setTipo] = useState("");
  const [periodicidade, setPeriodicidade] = useState("");
  const [plano, setPlano] = useState("");
  const [pagina, setPagina] = useState(1);
  const [agora, setAgora] = useState(() => Date.now());

  const requisicao = `${idSubestacao}:${revisao}`;
  const loading = carregado !== requisicao;

  useEffect(() => {
    let ativo = true;
    api.get<ResumoPlano[]>("/planos-manutencao/execucoes/resumo-dashboard", {
      params: idSubestacao ? { id_subestacao: Number(idSubestacao) } : {},
    }).then(({ data }) => {
      if (ativo) { setDados(data); setErro(false); setAgora(Date.now()); }
    }).catch(() => { if (ativo) { setErro(true); setDados([]); } })
      .finally(() => { if (ativo) setCarregado(requisicao); });
    return () => { ativo = false; };
  }, [idSubestacao, requisicao]);

  const opcoes = useMemo(() => ({
    tipos: [...new Map(dados.map((row) => [row.id_tipo_ativo, row.tipo_ativo])).entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")),
    planos: [...new Map(dados.map((row) => [row.id_plano_manutencao, row.plano || `Plano #${row.id_plano_manutencao}`])).entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")),
    periodicidades: [...new Set(dados.map((row) => row.periodicidade))],
  }), [dados]);

  const filtrados = useMemo(() => dados.filter((row) =>
    (!tipo || row.id_tipo_ativo === Number(tipo)) && (!plano || row.id_plano_manutencao === Number(plano)) &&
    (!periodicidade || row.periodicidade === periodicidade),
  ), [dados, tipo, plano, periodicidade]);

  const escala = useMemo(() => {
    const hoje = agora;
    const datas = [hoje, ...filtrados.flatMap((row) => [timestamp(row.ultima_execucao), timestamp(row.proxima_execucao)]).filter((value): value is number => value !== null)];
    const menor = Math.min(...datas);
    const maior = Math.max(...datas);
    const margem = Math.max((maior - menor) * 0.08, 7 * DIA);
    const inicio = menor - margem;
    const fim = maior + margem;
    const x = (value: number) => 20 + ((value - inicio) / (fim - inicio)) * 460;
    return { hoje, x, ticks: Array.from({ length: 5 }, (_, index) => ({
      value: inicio + ((fim - inicio) / 4) * index, x: 20 + 115 * index,
    })) };
  }, [filtrados, agora]);

  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, paginas);
  const linhas = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  const selectClass = "h-9 max-w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700";
  const legenda = (color: string, label: string, diamond = false) => <span className="inline-flex items-center gap-2 text-xs text-slate-600">
    <span style={{ background: color, transform: diamond ? "rotate(45deg)" : undefined }} className={`inline-block h-2.5 w-2.5 ${diamond ? "rounded-sm" : "rounded-full"}`} />{label}
  </span>;

  return <section aria-label="Execuções dos planos de manutenção" className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><CalendarDays size={18} />Execuções dos planos de manutenção</h2>
        <p className="mt-1 text-xs text-slate-500">Última: registro mais recente dos ativos. Próxima: menor data prevista no recorte selecionado.</p>
      </div>
      <Button variant="outline" size="sm" disabled={loading} onClick={() => setRevisao((value) => value + 1)}><RefreshCcw size={14} />Atualizar gráfico</Button>
    </div>
    <div className="flex flex-wrap items-end gap-3 p-4">
      <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-600">Plano
        <select aria-label="Plano do gráfico" className={`${selectClass} w-64`} value={plano} disabled={loading} onChange={(event) => { setPlano(event.target.value); setPagina(1); }}>
          <option value="">Todos os planos</option>{opcoes.planos.map(([id, nome]) => <option key={id} value={id}>#{id} — {nome}</option>)}
        </select>
      </label>
      <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-600">Tipo de equipamento
        <select aria-label="Tipo de equipamento do gráfico" className={selectClass} value={tipo} disabled={loading} onChange={(event) => { setTipo(event.target.value); setPagina(1); }}>
          <option value="">Todos os tipos</option>{opcoes.tipos.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </select>
      </label>
      <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-600">Periodicidade
        <select aria-label="Periodicidade do gráfico" className={selectClass} value={periodicidade} disabled={loading} onChange={(event) => { setPeriodicidade(event.target.value); setPagina(1); }}>
          <option value="">Todas as periodicidades</option>{opcoes.periodicidades.map((value) => <option key={value} value={value}>{PERIODICIDADES[value] ?? value}</option>)}
        </select>
      </label>
    </div>
    {loading ? <p role="status" className="p-6 text-sm text-slate-500">Carregando execuções dos planos...</p>
      : erro ? <p role="alert" className="p-6 text-sm text-red-700">Não foi possível carregar o gráfico. Use Atualizar gráfico para tentar novamente.</p>
      : !filtrados.length ? <p className="p-6 text-sm text-slate-500">Nenhuma execução de plano encontrada para os filtros selecionados.</p>
      : <>
        <div className="flex flex-wrap items-center gap-5 px-4 pb-3">
          {legenda("#2563eb", "Última execução")}{legenda("#d97706", "Próxima execução", true)}{legenda("#dc2626", "Próxima execução vencida", true)}
          <span className="inline-flex items-center gap-2 text-xs text-slate-500"><span className="w-4 border-t border-dashed border-slate-500" />Hoje</span>
        </div>
        <div className="overflow-x-auto px-4" tabIndex={0} aria-label="Calendário das execuções dos planos">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[280px_minmax(420px,1fr)_260px] items-center gap-4 border-b border-slate-200 text-xs font-semibold text-slate-500">
              <span>Plano / equipamento / periodicidade</span>
              <svg viewBox="0 0 500 38" className="w-full" aria-label="Escala de datas do gráfico">
                {escala.ticks.map((tick, index) => <text key={index} x={tick.x} y={22} textAnchor={index === 0 ? "start" : index === 4 ? "end" : "middle"} fill="#64748b" fontSize={11}>{new Intl.DateTimeFormat("pt-BR").format(tick.value)}</text>)}
              </svg>
              <span>Datas de execução</span>
            </div>
            {linhas.map((row) => {
              const ultima = timestamp(row.ultima_execucao);
              const proxima = timestamp(row.proxima_execucao);
              const vencida = proxima !== null && proxima < escala.hoje;
              const corProxima = vencida ? "#dc2626" : "#d97706";
              const ultimaX = ultima === null ? null : escala.x(ultima);
              const proximaX = proxima === null ? null : escala.x(proxima);
              return <div key={chave(row)} data-testid="plano-execucao-grafico" className="grid grid-cols-[280px_minmax(420px,1fr)_260px] items-center gap-4 border-b border-slate-100 py-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900" title={row.plano ?? undefined}>#{row.id_plano_manutencao} — {row.plano || "Plano de manutenção"}</div>
                  <div className="mt-2 flex flex-wrap gap-2"><span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{row.tipo_ativo}</span>
                    <span className="rounded bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">{PERIODICIDADES[row.periodicidade] ?? row.periodicidade}{row.intervalo > 1 ? ` · intervalo ${row.intervalo}` : ""}</span></div>
                  <p className="mt-2 text-xs text-slate-500">{row.ativos_com_execucao} de {row.total_ativos} ativos com execução registrada</p>
                </div>
                <svg role="img" aria-label={`Plano ${row.id_plano_manutencao}, ${row.tipo_ativo}, ${PERIODICIDADES[row.periodicidade] ?? row.periodicidade}. Última: ${dataLabel(row.ultima_execucao)}. Próxima: ${dataLabel(row.proxima_execucao)}${vencida ? ", vencida" : ""}.`} viewBox="0 0 500 54" className="w-full">
                  <title>{row.plano}: última {dataLabel(row.ultima_execucao)}; próxima {dataLabel(row.proxima_execucao)}</title>
                  {escala.ticks.map((tick, index) => <line key={index} x1={tick.x} x2={tick.x} y1={0} y2={54} stroke="#e2e8f0" />)}
                  <line x1={20} x2={480} y1={27} y2={27} stroke="#f1f5f9" strokeWidth={2} />
                  <line x1={escala.x(escala.hoje)} x2={escala.x(escala.hoje)} y1={0} y2={54} stroke="#64748b" strokeDasharray="4 4" />
                  {ultimaX !== null && proximaX !== null && <line x1={ultimaX} x2={proximaX} y1={27} y2={27} stroke="#cbd5e1" strokeWidth={5} strokeLinecap="round" />}
                  {ultimaX !== null && <circle cx={ultimaX} cy={27} r={6} fill="#2563eb" stroke="white" strokeWidth={2}><title>Última execução: {dataLabel(row.ultima_execucao)}</title></circle>}
                  {proximaX !== null && <path d={`M ${proximaX} 18 L ${proximaX + 8} 27 L ${proximaX} 36 L ${proximaX - 8} 27 Z`} fill={corProxima} stroke="white" strokeWidth={2}><title>Próxima execução: {dataLabel(row.proxima_execucao)}</title></path>}
                </svg>
                <div className="grid gap-1.5 text-xs">
                  <div className="flex justify-between gap-2"><span className="text-slate-500">Última</span><strong className="text-blue-700">{dataLabel(row.ultima_execucao)}</strong></div>
                  <div className="flex justify-between gap-2"><span className="text-slate-500">Próxima</span><strong style={{ color: corProxima }}>{dataLabel(row.proxima_execucao)}</strong></div>
                  {vencida && <span className="justify-self-end rounded bg-red-50 px-2 py-0.5 font-medium text-red-700">Vencida</span>}
                </div>
              </div>;
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-slate-500">
          <span>{filtrados.length} grupo{filtrados.length === 1 ? "" : "s"} de plano · página {paginaAtual} de {paginas}</span>
          {paginas > 1 && <div className="flex gap-2"><Button variant="outline" size="sm" disabled={paginaAtual <= 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={paginaAtual >= paginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima página</Button></div>}
        </div>
      </>}
  </section>;
}
