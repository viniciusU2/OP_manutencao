import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Download, FileText, Filter, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import api from "../api/api";
import { FilterPageFrame, FilterSidebar } from "../components/FilterSidebar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAuth } from "../context/AuthContext";
import { filtroInicialInstalacao } from "../lib/instalacaoPreferida";
import { hasPersistentFilter, usePersistentFilter } from "../lib/usePersistentFilter";
import { usePersistentSearch } from "../lib/usePersistentSearch";
import type { Subestacao } from "../types/Subestacao";
import type { TipoAtivo } from "../types/TipoAtivo";

type Relatorio = {
  id_relatorio_manutencao: number; id_subestacao: number; id_tipo_ativo: number;
  periodicidade: string; data_referencia: string; observacao: string | null;
  nome_arquivo_original: string; tamanho_bytes: number; quantidade_fotos: number;
  status: string; emissor: string | null; editado_por: string | null; criado_em: string;
};
type Lista = { items: Relatorio[]; total: number };
type ErroApi = { response?: { data?: { detail?: unknown } }; message?: string };

const selectClass = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const itensPagina = 20;

function erro(error: unknown, fallback: string) {
  const detalhe = (error as ErroApi).response?.data?.detail;
  return typeof detalhe === "string" ? detalhe : (error as ErroApi).message ?? fallback;
}
function dataBr(valor: string) { return new Intl.DateTimeFormat("pt-BR").format(new Date(`${valor.slice(0, 10)}T12:00:00`)); }
function bytes(valor: number) { return valor < 1048576 ? `${(valor / 1024).toFixed(1)} KB` : `${(valor / 1048576).toFixed(1)} MB`; }

export default function RelatoriosManutencaoControlePage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [tipos, setTipos] = useState<TipoAtivo[]>([]);
  const [periodicidades, setPeriodicidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [search, setSearch] = usePersistentSearch("relatorios-manutencao");
  const [subestacao, setSubestacao] = usePersistentFilter("relatorios-manutencao", "subestacao", "all");
  const [tipoAtivo, setTipoAtivo] = usePersistentFilter("relatorios-manutencao", "tipo-ativo", "all");
  const [periodicidade, setPeriodicidade] = usePersistentFilter("relatorios-manutencao", "periodicidade", "all");
  const [status, setStatus] = usePersistentFilter("relatorios-manutencao", "status", "all");
  const [emissor, setEmissor] = usePersistentFilter("relatorios-manutencao", "emissor", "all");
  const [dataInicio, setDataInicio] = usePersistentFilter("relatorios-manutencao", "data-inicio", "");
  const [dataFim, setDataFim] = usePersistentFilter("relatorios-manutencao", "data-fim", "");
  const [filtrosAbertos, setFiltrosAbertos] = usePersistentFilter("relatorios-manutencao", "painel-aberto", true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [lista, subs, tiposAtivo, periodos] = await Promise.all([
        api.get<Lista>("/relatorios-manutencao", { params: { page: 1, page_size: 5000 } }),
        api.get<Subestacao[]>("/subestacao/ativas"), api.get<TipoAtivo[]>("/tipo-ativo"),
        api.get<string[]>("/relatorios-manutencao/periodicidades"),
      ]);
      setRelatorios(lista.data.items); setSubestacoes(subs.data); setTipos(tiposAtivo.data); setPeriodicidades(periodos.data);
    } catch (e) { toast.error(erro(e, "Não foi possível carregar os relatórios.")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    if (!hasPersistentFilter("relatorios-manutencao", "subestacao") && subestacoes.length) {
      setSubestacao(filtroInicialInstalacao(usuario, subestacoes));
    }
  }, [subestacoes, usuario, setSubestacao]);

  const emissores = useMemo(() => Array.from(new Set(relatorios.map((item) => item.emissor).filter(Boolean) as string[])).sort(), [relatorios]);
  const filtrados = useMemo(() => {
    const termo = search.trim().toLocaleLowerCase("pt-BR");
    return relatorios.filter((item) => {
      const sub = subestacoes.find((s) => s.id_subestacao === item.id_subestacao)?.nome ?? "";
      const tipo = tipos.find((t) => t.id_tipo_ativo === item.id_tipo_ativo)?.nome ?? "";
      if (subestacao !== "all" && String(item.id_subestacao) !== subestacao) return false;
      if (tipoAtivo !== "all" && String(item.id_tipo_ativo) !== tipoAtivo) return false;
      if (periodicidade !== "all" && item.periodicidade !== periodicidade) return false;
      if (status !== "all" && item.status !== status) return false;
      if (emissor !== "all" && item.emissor !== emissor) return false;
      const data = item.data_referencia.slice(0, 10);
      if (dataInicio && data < dataInicio) return false;
      if (dataFim && data > dataFim) return false;
      return !termo || [sub, tipo, item.periodicidade, item.nome_arquivo_original, item.status, item.emissor ?? "", item.editado_por ?? ""].some((v) => v.toLocaleLowerCase("pt-BR").includes(termo));
    });
  }, [relatorios, search, subestacao, tipoAtivo, periodicidade, status, emissor, dataInicio, dataFim, subestacoes, tipos]);

  useEffect(() => setPagina(1), [search, subestacao, tipoAtivo, periodicidade, status, emissor, dataInicio, dataFim]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / itensPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const itens = filtrados.slice((paginaAtual - 1) * itensPagina, paginaAtual * itensPagina);
  const filtrosAtivos = [subestacao, tipoAtivo, periodicidade, status, emissor].filter((v) => v !== "all").length + Number(Boolean(dataInicio)) + Number(Boolean(dataFim));

  function limparFiltros() { setSubestacao("all"); setTipoAtivo("all"); setPeriodicidade("all"); setStatus("all"); setEmissor("all"); setDataInicio(""); setDataFim(""); setSearch(""); }
  async function baixar(item: Relatorio, word: boolean) {
    try {
      const sufixo = word ? "/arquivo-word" : "/arquivo";
      const { data } = await api.get(`/relatorios-manutencao/${item.id_relatorio_manutencao}${sufixo}`, { responseType: "blob" });
      const link = document.createElement("a"); link.href = URL.createObjectURL(data);
      link.download = word ? `RELATORIO-${item.periodicidade}-${item.data_referencia}.docx` : item.nome_arquivo_original;
      link.click(); URL.revokeObjectURL(link.href);
    } catch (e) { toast.error(erro(e, "Falha ao baixar o arquivo.")); }
  }
  async function excluir(item: Relatorio) {
    if (!window.confirm(`Excluir definitivamente o relatório ${item.nome_arquivo_original}?`)) return;
    try { await api.delete(`/relatorios-manutencao/${item.id_relatorio_manutencao}`); toast.success("Relatório excluído."); carregar(); }
    catch (e) { toast.error(erro(e, "Falha ao excluir o relatório.")); }
  }

  return <FilterPageFrame $filtersOpen={filtrosAbertos}>
    <div className="mx-auto w-full max-w-[1720px] space-y-5 px-2 sm:px-4 xl:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="m-0 text-2xl font-semibold text-slate-900">Controle de relatórios</h1><p className="mt-1 text-sm text-slate-500">Consulte, filtre e gerencie os relatórios de manutenção emitidos.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={carregar}><RefreshCw size={16} />Atualizar</Button><Button onClick={() => navigate("/relatorios-manutencao/novo")}><Plus size={17} />Novo relatório</Button></div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-medium uppercase text-slate-500">Total cadastrado</p><strong className="text-2xl text-slate-900">{relatorios.length}</strong></div><FileText className="text-blue-600" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-medium uppercase text-slate-500">Resultado filtrado</p><strong className="text-2xl text-slate-900">{filtrados.length}</strong></div><Filter className="text-emerald-600" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-medium uppercase text-slate-500">Fotografias</p><strong className="text-2xl text-slate-900">{filtrados.reduce((s, i) => s + i.quantidade_fotos, 0)}</strong></div><Archive className="text-violet-600" /></CardContent></Card>
      </div>

      <div className="relative rounded-xl bg-slate-100 p-3"><Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><Input className="h-11 bg-white pl-11 pr-11" placeholder="Buscar por arquivo, subestação, ativo, emissor ou editor..." value={search} onChange={(e) => setSearch(e.target.value)} />{search && <button className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setSearch("")}><X size={18} /></button>}</div>

      <FilterSidebar open={filtrosAbertos} onOpenChange={setFiltrosAbertos} filters={<>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Status<select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Todos os status</option>{Array.from(new Set(relatorios.map((i) => i.status))).map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Subestação<select className={selectClass} value={subestacao} onChange={(e) => setSubestacao(e.target.value)}><option value="all">Todas as instalações</option>{subestacoes.map((s) => <option key={s.id_subestacao} value={s.id_subestacao}>{s.nome}</option>)}</select></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Tipo de ativo<select className={selectClass} value={tipoAtivo} onChange={(e) => setTipoAtivo(e.target.value)}><option value="all">Todos os tipos</option>{tipos.map((t) => <option key={t.id_tipo_ativo} value={t.id_tipo_ativo}>{t.nome}</option>)}</select></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Periodicidade<select className={selectClass} value={periodicidade} onChange={(e) => setPeriodicidade(e.target.value)}><option value="all">Todas</option>{periodicidades.map((v) => <option key={v}>{v.replaceAll("_", " ")}</option>)}</select></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Emissor<select className={selectClass} value={emissor} onChange={(e) => setEmissor(e.target.value)}><option value="all">Todos os emissores</option>{emissores.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Data inicial<Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Data final<Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></label>
        <Button variant="outline" onClick={limparFiltros}>Limpar filtros {filtrosAtivos ? `(${filtrosAtivos})` : ""}</Button>
      </>}>
        <Card>
          <CardContent className="p-0">
            <Table className="min-w-[1180px]">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Referência</TableHead>
                  <TableHead>Subestação</TableHead>
                  <TableHead>Tipo de ativo</TableHead>
                  <TableHead>Periodicidade</TableHead>
                  <TableHead>Emissor / editor</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead className="text-center">Fotos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="h-40 text-center text-slate-500"><Loader2 className="mx-auto mb-2 animate-spin" />Carregando relatórios...</TableCell></TableRow>
                ) : itens.length ? itens.map((item) => (
                  <TableRow key={item.id_relatorio_manutencao}>
                    <TableCell className="font-medium">{dataBr(item.data_referencia)}</TableCell>
                    <TableCell>{subestacoes.find((s) => s.id_subestacao === item.id_subestacao)?.nome ?? `#${item.id_subestacao}`}</TableCell>
                    <TableCell>{tipos.find((t) => t.id_tipo_ativo === item.id_tipo_ativo)?.nome ?? `#${item.id_tipo_ativo}`}</TableCell>
                    <TableCell>{item.periodicidade.replaceAll("_", " ")}</TableCell>
                    <TableCell><strong className="block font-medium">{item.emissor ?? "Não informado"}</strong><span className="block text-xs text-slate-500">Editor: {item.editado_por ?? "não editado"}</span></TableCell>
                    <TableCell className="max-w-64"><span className="block max-w-64 truncate" title={item.nome_arquivo_original}>{item.nome_arquivo_original}</span><span className="block text-xs text-slate-400">{bytes(item.tamanho_bytes)}</span></TableCell>
                    <TableCell className="text-center">{item.quantidade_fotos}</TableCell>
                    <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => navigate(`/relatorios-manutencao/${item.id_relatorio_manutencao}/editar`)}><Pencil size={16} /></Button>
                        <Button size="icon" variant="ghost" title="Baixar Word" onClick={() => baixar(item, true)}><Download size={16} /></Button>
                        <Button size="icon" variant="ghost" title="Baixar ZIP" onClick={() => baixar(item, false)}><Archive size={16} /></Button>
                        <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" title="Excluir" onClick={() => excluir(item)}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={9} className="h-40 text-center text-slate-500">Nenhum relatório corresponde aos filtros.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {!loading && filtrados.length > itensPagina && <div className="mt-4 flex items-center justify-between text-sm text-slate-600"><span>Página {paginaAtual} de {totalPaginas}</span><div className="flex gap-2"><Button variant="outline" disabled={paginaAtual === 1} onClick={() => setPagina((p) => p - 1)}>Anterior</Button><Button variant="outline" disabled={paginaAtual === totalPaginas} onClick={() => setPagina((p) => p + 1)}>Próxima</Button></div></div>}
      </FilterSidebar>
    </div>
  </FilterPageFrame>;
}

