import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Factory,
  RefreshCw,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import Container from "../components/Container";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

type StatusProjecao = "CONCLUIDA" | "CRIADA" | "A_GERAR" | "VENCIDA_NAO_CRIADA";

type Contagem = {
  total: number;
  concluidas: number;
  criadas: number;
  a_gerar: number;
  vencidas_nao_criadas: number;
};

type Mes = Contagem & { mes: number; nome: string };
type Ranking = Contagem & { id: number | null; nome: string };

type OrdemSimulada = {
  id_plano_manutencao: number;
  plano: string;
  id_ativo: number;
  ativo: string;
  id_subestacao: number | null;
  subestacao: string;
  tipo_ativo: string;
  data_prevista: string;
  data_liberacao: string;
  mes: number;
  antecedencia: number;
  quantidade_itens: number;
  itens: { id_plano_item: number; nome_item: string; periodicidade: string; intervalo: number }[];
  periodicidades: string[];
  status_projecao: StatusProjecao;
  os_existentes: { id_os: number; numero_os: string; status: string }[];
};

type Resposta = {
  ano: number;
  somente_leitura: boolean;
  gerado_em: string;
  resumo: Contagem & { planos: number; ativos: number };
  meses: Mes[];
  ranking_planos: Ranking[];
  ranking_subestacoes: Ranking[];
  opcoes: {
    planos: { id: number; nome: string }[];
    subestacoes: { id: number; nome: string }[];
    periodicidades: string[];
  };
  paginacao: { pagina: number; por_pagina: number; total: number; total_paginas: number };
  ordens: OrdemSimulada[];
};

const cores = {
  CONCLUIDA: "#059669",
  CRIADA: "#2563eb",
  A_GERAR: "#d97706",
  VENCIDA_NAO_CRIADA: "#dc2626",
};

const rotulosStatus: Record<StatusProjecao, string> = {
  CONCLUIDA: "Concluída",
  CRIADA: "Criada",
  A_GERAR: "A gerar",
  VENCIDA_NAO_CRIADA: "Vencida não criada",
};

const classesStatus: Record<StatusProjecao, string> = {
  CONCLUIDA: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CRIADA: "border-blue-200 bg-blue-50 text-blue-700",
  A_GERAR: "border-amber-200 bg-amber-50 text-amber-700",
  VENCIDA_NAO_CRIADA: "border-red-200 bg-red-50 text-red-700",
};

function numero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor || 0);
}

function dataCurta(valor?: string | null) {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

function periodicidade(valor: string) {
  const nomes: Record<string, string> = {
    SEMANAL: "Semanal", MENSAL: "Mensal", BIMESTRAL: "Bimestral",
    TRIMESTRAL: "Trimestral", SEMESTRAL: "Semestral", ANUAL: "Anual",
    "3_ANOS": "3 anos", "5_ANOS": "5 anos", "6_ANOS": "6 anos",
  };
  return nomes[valor] ?? valor;
}

function mensagemErro(error: unknown) {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return typeof detail === "string" ? detail : "Não foi possível calcular a simulação anual.";
}

function CardKpi({ titulo, valor, detalhe, cor, icone: Icone }: {
  titulo: string; valor: string; detalhe: string; cor: string;
  icone: typeof CalendarRange;
}) {
  return (
    <article className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: cor }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{titulo}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{valor}</p>
          <p className="mt-1 truncate text-xs text-slate-500" title={detalhe}>{detalhe}</p>
        </div>
        <span className="rounded-xl p-2.5" style={{ backgroundColor: `${cor}12`, color: cor }}><Icone size={19} /></span>
      </div>
    </article>
  );
}

function SelectFiltro({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500"><span>{label}</span>{children}</label>;
}

export default function PlanoSimulacaoAnualPage() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [plano, setPlano] = useState("");
  const [subestacao, setSubestacao] = useState("");
  const [periodicidadeFiltro, setPeriodicidadeFiltro] = useState("");
  const [status, setStatus] = useState("");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(1);
  const [revisao, setRevisao] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<Resposta | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBuscaAplicada(busca.trim());
      setPagina(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    let ativo = true;
    setLoading(true);
    api.get<Resposta>("/planos-manutencao/simulacao-anual", {
      params: {
        ano,
        id_plano_manutencao: plano || undefined,
        id_subestacao: subestacao || undefined,
        periodicidade: periodicidadeFiltro || undefined,
        status: status || undefined,
        busca: buscaAplicada || undefined,
        pagina,
        por_pagina: 50,
      },
    }).then(({ data }) => {
      if (ativo) setDados(data);
    }).catch((error: unknown) => {
      if (ativo) toast.error(mensagemErro(error));
    }).finally(() => {
      if (ativo) setLoading(false);
    });
    return () => { ativo = false; };
  }, [ano, plano, subestacao, periodicidadeFiltro, status, buscaAplicada, pagina, revisao]);

  const maximoMes = useMemo(() => Math.max(1, ...(dados?.meses.map((mes) => mes.total) ?? [1])), [dados]);
  const resumo = dados?.resumo ?? {
    total: 0, concluidas: 0, criadas: 0, a_gerar: 0,
    vencidas_nao_criadas: 0, planos: 0, ativos: 0,
  };
  const possuiFiltro = Boolean(plano || subestacao || periodicidadeFiltro || status || busca);

  function alterarFiltro(setter: (valor: string) => void, valor: string) {
    setter(valor);
    setPagina(1);
  }

  function limparFiltros() {
    setPlano("");
    setSubestacao("");
    setPeriodicidadeFiltro("");
    setStatus("");
    setBusca("");
    setBuscaAplicada("");
    setPagina(1);
  }

  return (
    <Container>
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-[#f3f5f8] shadow-sm">
        <header className="relative overflow-hidden bg-[#14213d] px-5 py-5 text-white md:px-7">
          <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-blue-600/30 to-transparent" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link to="/planos-manutencao/dashboard" className="mb-2 inline-flex items-center gap-1 text-xs text-blue-200 hover:text-white"><ArrowLeft size={14} /> Dashboard dos planos</Link>
              <h1 className="m-0 flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl"><CalendarRange size={27} /> Simulação anual do plano</h1>
              <p className="mt-1 text-sm text-slate-300">Todas as OS previstas no ano, calculadas pelas recorrências dos planos de manutenção.</p>
            </div>
            <div className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-100">
              <strong className="flex items-center gap-1.5 text-sm text-white"><ShieldCheck size={16} /> Consulta somente leitura</strong>
              Nenhuma OS é criada ou alterada nesta página.
            </div>
          </div>
        </header>

        <section className="border-b border-slate-300 bg-white px-5 py-4 md:px-7">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">Filtros da projeção</h2>
              <p className="text-xs text-slate-500">As seleções são aplicadas automaticamente.</p>
            </div>
            <div className="flex items-center gap-2">
              {possuiFiltro && <Button variant="ghost" size="sm" onClick={limparFiltros}>Limpar filtros</Button>}
              <Button variant="outline" size="sm" onClick={() => setRevisao((valor) => valor + 1)} disabled={loading}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Atualizar</Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[110px_minmax(230px,1.5fr)_minmax(190px,1fr)_180px_200px]">
            <SelectFiltro label="Ano">
              <select value={ano} onChange={(event) => { setAno(Number(event.target.value)); setPagina(1); }} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900">
                {Array.from({ length: 9 }, (_, indice) => anoAtual - 2 + indice).map((valor) => <option key={valor} value={valor}>{valor}</option>)}
              </select>
            </SelectFiltro>
            <SelectFiltro label="Plano de manutenção">
              <select value={plano} onChange={(event) => alterarFiltro(setPlano, event.target.value)} className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900">
                <option value="">Todos os planos</option>
                {dados?.opcoes.planos.map((opcao) => <option key={opcao.id} value={opcao.id}>#{opcao.id} — {opcao.nome}</option>)}
              </select>
            </SelectFiltro>
            <SelectFiltro label="Subestação">
              <select value={subestacao} onChange={(event) => alterarFiltro(setSubestacao, event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900">
                <option value="">Todas as subestações</option>
                {dados?.opcoes.subestacoes.map((opcao) => <option key={opcao.id} value={opcao.id}>{opcao.nome}</option>)}
              </select>
            </SelectFiltro>
            <SelectFiltro label="Periodicidade">
              <select value={periodicidadeFiltro} onChange={(event) => alterarFiltro(setPeriodicidadeFiltro, event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900">
                <option value="">Todas</option>
                {dados?.opcoes.periodicidades.map((opcao) => <option key={opcao} value={opcao}>{periodicidade(opcao)}</option>)}
              </select>
            </SelectFiltro>
            <SelectFiltro label="Situação da OS">
              <select value={status} onChange={(event) => alterarFiltro(setStatus, event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900">
                <option value="">Todas as situações</option>
                {(Object.keys(rotulosStatus) as StatusProjecao[]).map((opcao) => <option key={opcao} value={opcao}>{rotulosStatus[opcao]}</option>)}
              </select>
            </SelectFiltro>
          </div>
        </section>

        <main className="space-y-4 p-4 md:p-6">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Indicadores anuais">
            <CardKpi titulo="OS previstas" valor={numero(resumo.total)} detalhe={`${numero(resumo.planos)} planos no recorte`} cor="#0f4cbd" icone={CalendarRange} />
            <CardKpi titulo="Concluídas" valor={numero(resumo.concluidas)} detalhe="OS encerradas no ano" cor={cores.CONCLUIDA} icone={CheckCircle2} />
            <CardKpi titulo="Já criadas" valor={numero(resumo.criadas)} detalhe="Abertas ou em execução" cor={cores.CRIADA} icone={ClipboardList} />
            <CardKpi titulo="A gerar" valor={numero(resumo.a_gerar)} detalhe="Ainda dentro da antecedência" cor={cores.A_GERAR} icone={Clock3} />
            <CardKpi titulo="Vencidas não criadas" valor={numero(resumo.vencidas_nao_criadas)} detalhe="Data de liberação alcançada" cor={cores.VENCIDA_NAO_CRIADA} icone={AlertTriangle} />
            <CardKpi titulo="Ativos cobertos" valor={numero(resumo.ativos)} detalhe="Ativos com OS no recorte" cor="#7c3aed" icone={Factory} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-sm font-bold text-slate-900">Distribuição mensal das OS</h2><p className="text-xs text-slate-500">Volume previsto e situação em cada mês de {ano}</p></div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                  {(Object.keys(rotulosStatus) as StatusProjecao[]).map((item) => <span key={item} className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cores[item] }} />{rotulosStatus[item]}</span>)}
                </div>
              </div>
              <div className="mt-5 grid h-56 grid-cols-12 gap-2 border-b border-slate-200 px-1">
                {dados?.meses.map((mes) => {
                  const altura = (mes.total / maximoMes) * 100;
                  const partes = [
                    ["CONCLUIDA", mes.concluidas], ["CRIADA", mes.criadas],
                    ["A_GERAR", mes.a_gerar], ["VENCIDA_NAO_CRIADA", mes.vencidas_nao_criadas],
                  ] as [StatusProjecao, number][];
                  return <div key={mes.mes} className="group relative flex min-w-0 flex-col justify-end text-center">
                    <span className="mb-1 text-[10px] font-semibold text-slate-600">{numero(mes.total)}</span>
                    <div className="mx-auto flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-sm bg-slate-100 transition-opacity group-hover:opacity-80" style={{ height: `${Math.max(altura, mes.total ? 3 : 0)}%` }} title={`${mes.nome}: ${numero(mes.total)} OS`}>
                      {partes.map(([chave, valor]) => valor > 0 && <span key={chave} style={{ height: `${(valor / mes.total) * 100}%`, backgroundColor: cores[chave] }} />)}
                    </div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500">{mes.nome}</span>
                  </div>;
                })}
              </div>
              <div className="h-6" />
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Carga por subestação</h2>
              <p className="text-xs text-slate-500">Participação no total previsto</p>
              <div className="mt-4 space-y-3">
                {dados?.ranking_subestacoes.slice(0, 7).map((item) => <div key={`${item.id}-${item.nome}`}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium text-slate-700" title={item.nome}>{item.nome}</span><strong className="text-slate-900">{numero(item.total)}</strong></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${resumo.total ? (item.total / resumo.total) * 100 : 0}%` }} /></div>
                </div>)}
                {!dados?.ranking_subestacoes.length && <p className="py-8 text-center text-sm text-slate-400">Sem dados para o recorte.</p>}
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Planos com maior volume</h2>
              <p className="text-xs text-slate-500">Quantidade de OS simuladas no ano</p>
              <div className="mt-4 space-y-3">
                {dados?.ranking_planos.slice(0, 8).map((item) => <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_70px] items-center gap-3">
                  <div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800" title={item.nome}>#{item.id} — {item.nome}</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${dados.ranking_planos[0]?.total ? (item.total / dados.ranking_planos[0].total) * 100 : 0}%` }} /></div></div>
                  <strong className="text-right text-sm text-slate-900">{numero(item.total)}</strong>
                </div>)}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-end justify-between gap-3">
                <div><h2 className="text-sm font-bold text-slate-900">Localizar uma OS simulada</h2><p className="text-xs text-slate-500">Busque por plano, ativo, subestação, item ou número da OS</p></div>
                <span className="text-xs text-slate-500">{numero(dados?.paginacao.total ?? 0)} resultados</span>
              </div>
              <div className="relative mt-4"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Ex.: Plano #17, GOR-BJD ou OS-GOR..." className="pl-9" /></div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
                {(Object.keys(rotulosStatus) as StatusProjecao[]).map((item) => <button type="button" key={item} onClick={() => alterarFiltro(setStatus, status === item ? "" : item)} className={`rounded-md border px-2 py-2 text-left transition ${status === item ? classesStatus[item] : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}><span className="block font-semibold">{rotulosStatus[item]}</span><span>{numero(item === "CONCLUIDA" ? resumo.concluidas : item === "CRIADA" ? resumo.criadas : item === "A_GERAR" ? resumo.a_gerar : resumo.vencidas_nao_criadas)}</span></button>)}
              </div>
            </article>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div><h2 className="text-sm font-bold text-slate-900">Calendário detalhado das OS</h2><p className="text-xs text-slate-500">Uma linha representa uma OS que o plano deverá gerar para o ativo e a data indicados.</p></div>
              {loading && <span className="flex items-center gap-1.5 text-xs text-blue-700"><RefreshCw size={14} className="animate-spin" /> Recalculando...</span>}
            </header>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="bg-slate-50">
                  <TableHead>Data prevista</TableHead><TableHead>Liberação</TableHead><TableHead>Plano</TableHead><TableHead>Subestação / ativo</TableHead><TableHead>Itens</TableHead><TableHead>Situação</TableHead><TableHead>OS existente</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {dados?.ordens.map((ordem) => <TableRow key={`${ordem.id_plano_manutencao}-${ordem.id_ativo}-${ordem.data_prevista}`}>
                    <TableCell className="whitespace-nowrap font-semibold text-slate-900">{dataCurta(ordem.data_prevista)}</TableCell>
                    <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700">{dataCurta(ordem.data_liberacao)}</span><span className="block text-[11px] text-slate-400">{ordem.antecedencia}d antes</span></TableCell>
                    <TableCell className="min-w-[230px]"><Link to={`/planos-manutencao/${ordem.id_plano_manutencao}/editar`} className="font-semibold text-blue-700 hover:underline">Plano #{ordem.id_plano_manutencao}</Link><span className="block line-clamp-2 text-xs text-slate-600" title={ordem.plano}>{ordem.plano}</span></TableCell>
                    <TableCell className="min-w-[180px]"><span className="font-medium text-slate-800">{ordem.subestacao}</span><span className="block text-xs text-slate-500">{ordem.ativo} · {ordem.tipo_ativo}</span></TableCell>
                    <TableCell className="min-w-[210px]"><span className="font-semibold text-slate-800">{ordem.quantidade_itens} {ordem.quantidade_itens === 1 ? "item" : "itens"}</span><span className="block line-clamp-2 text-xs text-slate-500" title={ordem.itens.map((item) => item.nome_item).join("; ")}>{ordem.itens.map((item) => item.nome_item).join("; ") || "Itens não recuperados da OS existente"}</span><span className="block text-[11px] text-slate-400">{ordem.periodicidades.map(periodicidade).join(" · ")}</span></TableCell>
                    <TableCell><span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[11px] font-semibold ${classesStatus[ordem.status_projecao]}`}>{rotulosStatus[ordem.status_projecao]}</span></TableCell>
                    <TableCell className="min-w-[140px]">{ordem.os_existentes.length ? ordem.os_existentes.map((os) => <Link key={os.id_os} to={`/os/${os.id_os}`} className="block font-semibold text-blue-700 hover:underline">{os.numero_os}<small className="ml-1 font-normal text-slate-400">{os.status}</small></Link>) : <span className="text-slate-400">Ainda não criada</span>}</TableCell>
                  </TableRow>)}
                  {!loading && !dados?.ordens.length && <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500">Nenhuma OS encontrada para os filtros selecionados.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              <span>Página {dados?.paginacao.pagina ?? 1} de {dados?.paginacao.total_paginas ?? 1} · {numero(dados?.paginacao.total ?? 0)} OS</span>
              <div className="flex gap-2"><Button variant="outline" size="sm" disabled={loading || pagina <= 1} onClick={() => setPagina((valor) => Math.max(1, valor - 1))}><ChevronLeft size={14} /> Anterior</Button><Button variant="outline" size="sm" disabled={loading || pagina >= (dados?.paginacao.total_paginas ?? 1)} onClick={() => setPagina((valor) => valor + 1)}>Próxima <ChevronRight size={14} /></Button></div>
            </footer>
          </section>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400"><Wrench size={13} /> A simulação usa a próxima execução atual de cada item e repete a periodicidade até o fim do ano selecionado.</p>
        </main>
      </div>
    </Container>
  );
}
