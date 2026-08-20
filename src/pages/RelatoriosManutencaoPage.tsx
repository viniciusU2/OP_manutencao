import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Archive, CheckCircle2, Download, Eye, FileArchive, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import ReviewEvidenceGrid, { type RevisaoEvidencia } from "../components/ReviewEvidenceGrid";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import type { Subestacao } from "../types/Subestacao";
import type { TipoAtivo } from "../types/TipoAtivo";

type FotoAnalisada = {
  arquivo: string;
  miniatura: string | null;
  id_ativo_sugerido: number | null;
  codigo_ativo_sugerido: string | null;
  id_plano_item_sugerido: number | null;
  item_sugerido: string | null;
  confianca: number;
  possivel_duplicata: boolean;
  duplicata_de: string | null;
  largura: number;
  altura: number;
  requer_confirmacao: boolean;
};

type Analise = {
  periodicidade: string;
  quantidade_fotos: number;
  quantidade_requer_confirmacao: number;
  ativos: { id_ativo: number; codigo_ativo: string; fase: string | null; bay: string | null }[];
  itens: { id_plano_item: number; nome_item: string; unidade: string | null }[];
  fotos: FotoAnalisada[];
};

type Relatorio = {
  id_relatorio_manutencao: number;
  id_subestacao: number;
  id_tipo_ativo: number;
  periodicidade: string;
  data_referencia: string;
  observacao: string | null;
  nome_arquivo_original: string;
  tamanho_bytes: number;
  quantidade_fotos: number;
  status: string;
  emissor: string | null;
  editado_por: string | null;
  criado_em: string;
};

type PessoaCorpoTecnico = { nome: string; funcao: string };

type ListaRelatorios = { items: Relatorio[]; total: number; page: number; page_size: number };

type ErroApi = { response?: { data?: { detail?: unknown } }; message?: string };

function mensagemErro(error: unknown, padrao: string) {
  const erro = error as ErroApi;
  const detalhe = erro.response?.data?.detail;
  if (typeof detalhe === "string") return detalhe;
  if (Array.isArray(detalhe)) return detalhe.map((item) => {
    if (typeof item === "object" && item && "msg" in item) return String(item.msg);
    return String(item);
  }).join("; ");
  return erro.message ?? padrao;
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: valor.includes("T") ? "short" : undefined }).format(new Date(valor.includes("T") ? valor : `${valor}T12:00:00`));
}

function formatarBytes(valor: number) {
  if (valor < 1024 * 1024) return `${(valor / 1024).toFixed(1)} KB`;
  return `${(valor / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RelatoriosManutencaoPage() {
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);
  const [periodicidades, setPeriodicidades] = useState<string[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [idSubestacao, setIdSubestacao] = useState("");
  const [idTipoAtivo, setIdTipoAtivo] = useState("");
  const [periodicidade, setPeriodicidade] = useState("");
  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState("");
  const [textoIntroducao, setTextoIntroducao] = useState("");
  const [corpoTecnico, setCorpoTecnico] = useState<PessoaCorpoTecnico[]>([{ nome: "", funcao: "" }]);
  const [numeroOS, setNumeroOS] = useState("");
  const [numeroAPR, setNumeroAPR] = useState("");
  const [periodoCapa, setPeriodoCapa] = useState("");
  const [concessao, setConcessao] = useState("Rialma Transmissora de Energia - RTV");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [temperaturaInicio, setTemperaturaInicio] = useState("");
  const [temperaturaFim, setTemperaturaFim] = useState("");
  const [frequenciaInicio, setFrequenciaInicio] = useState("60");
  const [frequenciaFim, setFrequenciaFim] = useState("60");
  const [tensaoInicio, setTensaoInicio] = useState("");
  const [tensaoFim, setTensaoFim] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [confirmados, setConfirmados] = useState<Set<string>>(new Set());
  const [revisoesEnvio, setRevisoesEnvio] = useState<Record<string, RevisaoEvidencia>>({});
  const [analisando, setAnalisando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  const carregarRelatorios = useCallback(async () => {
    const { data } = await api.get<ListaRelatorios>("/relatorios-manutencao", { params: { page: 1, page_size: 100 } });
    setRelatorios(data.items);
  }, []);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      try {
        const [subs, tipos, periodos] = await Promise.all([
          api.get<Subestacao[]>("/subestacao/ativas"),
          api.get<TipoAtivo[]>("/tipo-ativo"),
          api.get<string[]>("/relatorios-manutencao/periodicidades"),
        ]);
        setSubestacoes(subs.data);
        setTiposAtivo(tipos.data);
        setPeriodicidades(periodos.data);
        await carregarRelatorios();
      } catch (error) {
        toast.error(mensagemErro(error, "Não foi possível carregar a página."));
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [carregarRelatorios]);


  useEffect(() => {
    const data = dataReferencia ? new Date(`${dataReferencia}T12:00:00`) : null;
    const subestacao = subestacoes.find((item) => item.id_subestacao === Number(idSubestacao))?.nome ?? "[subestação]";
    const tipoAtivo = tiposAtivo.find((item) => item.id_tipo_ativo === Number(idTipoAtivo))?.nome ?? "[tipo do ativo]";
    const dataBr = data && !Number.isNaN(data.getTime()) ? data.toLocaleDateString("pt-BR") : "[data]";
    const mesAno = data && !Number.isNaN(data.getTime())
      ? `${data.toLocaleDateString("pt-BR", { month: "long" }).replace(/^./, (letra) => letra.toUpperCase())}/ ${data.getFullYear()}`
      : "";
    setPeriodoCapa(mesAno);
    setTextoIntroducao(
      `Este relatório reúne inspeções realizadas no dia ${dataBr} na Subestação ${subestacao}, nos equipamentos do tipo ${tipoAtivo}, operados pela Rialma Transmissora de Energia V S.A., referentes ao projeto da RTV.\n` +
      "As inspeções foram realizadas tendo como referência os itens do plano de manutenção cadastrados no Sistema ENGVI.\n" +
      "São apresentadas imagens dos equipamentos inspecionados. Os equipamentos que apresentarem anormalidades deverão ser destacados e vinculados às respectivas Solicitações de Serviço (SS)."
    );
  }, [dataReferencia, idSubestacao, idTipoAtivo, subestacoes, tiposAtivo]);
  const selecaoCompleta = Boolean(idSubestacao && idTipoAtivo && periodicidade && dataReferencia);
  const pendencias = analise?.fotos.filter((foto) => foto.requer_confirmacao && !confirmados.has(foto.arquivo)) ?? [];
  const dadosRelatorioCompletos = Boolean(textoIntroducao.trim() && periodoCapa.trim() && concessao.trim() && corpoTecnico.length && corpoTecnico.every((pessoa) => pessoa.nome.trim() && pessoa.funcao.trim()) && horaInicio && horaFim && temperaturaInicio.trim() && temperaturaFim.trim() && frequenciaInicio.trim() && frequenciaFim.trim() && tensaoInicio.trim() && tensaoFim.trim());
  const podeEnviar = Boolean(analise && arquivo && pendencias.length === 0 && dadosRelatorioCompletos && !enviando);

  const relatoriosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return relatorios;
    return relatorios.filter((relatorio) => {
      const sub = subestacoes.find((item) => item.id_subestacao === relatorio.id_subestacao)?.nome ?? "";
      const tipo = tiposAtivo.find((item) => item.id_tipo_ativo === relatorio.id_tipo_ativo)?.nome ?? "";
      return [sub, tipo, relatorio.periodicidade, relatorio.emissor ?? "", relatorio.editado_por ?? "", relatorio.nome_arquivo_original, relatorio.status].some((valor) => valor.toLowerCase().includes(termo));
    });
  }, [busca, relatorios, subestacoes, tiposAtivo]);

  function selecionarArquivo(file: File | null) {
    setAnalise(null);
    setConfirmados(new Set());
    if (!file) return setArquivo(null);
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("Selecione um arquivo ZIP com as fotografias.");
      if (arquivoRef.current) arquivoRef.current.value = "";
      return setArquivo(null);
    }
    setArquivo(file);
  }

  function montarFormData() {
    if (!arquivo) throw new Error("Selecione o ZIP das fotografias.");
    const form = new FormData();
    form.append("id_subestacao", idSubestacao);
    form.append("id_tipo_ativo", idTipoAtivo);
    form.append("periodicidade", periodicidade);
    form.append("arquivo", arquivo);
    return form;
  }

  async function analisar() {
    if (!selecaoCompleta || !arquivo) return toast.error("Preencha os dados e selecione o ZIP.");
    setAnalisando(true);
    try {
      const { data } = await api.post<Analise>("/relatorios-manutencao/analisar", montarFormData());
      setAnalise(data);
      setConfirmados(new Set(data.fotos.filter((foto) => !foto.requer_confirmacao).map((foto) => foto.arquivo)));
      setRevisoesEnvio(Object.fromEntries(data.fotos.map((foto) => [foto.arquivo, { ativoId: foto.id_ativo_sugerido?.toString() ?? "", itemId: foto.id_plano_item_sugerido?.toString() ?? "", valor: "", status: "OK", observacao: "", incluir: true }])));
      toast.success(`${data.quantidade_fotos} foto${data.quantidade_fotos === 1 ? " analisada" : "s analisadas"}.`);
    } catch (error) {
      setAnalise(null);
      toast.error(mensagemErro(error, "Falha ao analisar as fotografias."));
    } finally {
      setAnalisando(false);
    }
  }

  async function enviar() {
    if (!podeEnviar) return toast.error("Confirme as classificações sinalizadas antes de enviar.");
    setEnviando(true);
    try {
      const form = montarFormData();
      form.append("data_referencia", dataReferencia);
      if (observacao.trim()) form.append("observacao", observacao.trim());
      form.append("texto_introducao", textoIntroducao.trim());
      form.append("corpo_tecnico_json", JSON.stringify(corpoTecnico));
      form.append("numero_os", numeroOS.trim());
      form.append("numero_apr", numeroAPR.trim());
      form.append("periodo_capa", periodoCapa.trim());
      form.append("concessao", concessao.trim());
      form.append("hora_inicio", horaInicio);
      form.append("hora_fim", horaFim);
      form.append("temperatura_inicio", temperaturaInicio.trim());
      form.append("temperatura_fim", temperaturaFim.trim());
      form.append("frequencia_inicio", frequenciaInicio.trim());
      form.append("frequencia_fim", frequenciaFim.trim());
      form.append("tensao_inicio", tensaoInicio.trim());
      form.append("tensao_fim", tensaoFim.trim());
      form.append("revisao_json", JSON.stringify(analise!.fotos.map((foto) => { const revisao = revisoesEnvio[foto.arquivo]; return { arquivo: foto.arquivo, id_ativo: revisao?.ativoId ? Number(revisao.ativoId) : null, id_plano_item: revisao?.itemId ? Number(revisao.itemId) : null, valor: revisao?.valor ?? "", status: revisao?.status ?? "OK", observacao: revisao?.observacao ?? "", incluir: revisao?.incluir ?? true, confianca: foto.confianca }; })));
      await api.post("/relatorios-manutencao", form);
      toast.success("Relatório de manutenção enviado com sucesso.");
      setArquivo(null); setAnalise(null); setConfirmados(new Set()); setRevisoesEnvio({}); setObservacao("");
      if (arquivoRef.current) arquivoRef.current.value = "";
      await carregarRelatorios();
    } catch (error) {
      toast.error(mensagemErro(error, "Falha ao enviar o relatório."));
    } finally {
      setEnviando(false);
    }
  }

  async function excluirRelatorio(relatorio: Relatorio) {
    const confirmou = window.confirm(`Excluir definitivamente o relatório #${relatorio.id_relatorio_manutencao} e seus arquivos ZIP/Word? Esta ação não pode ser desfeita.`);
    if (!confirmou) return;
    try {
      await api.delete(`/relatorios-manutencao/${relatorio.id_relatorio_manutencao}`);
      toast.success("Relatório excluído.");
      await carregarRelatorios();
    } catch (error) {
      toast.error(mensagemErro(error, "Falha ao excluir o relatório."));
    }
  }
  async function editarRelatorio(relatorio: Relatorio) {
    const data = window.prompt("Data de referência (AAAA-MM-DD):", relatorio.data_referencia.slice(0, 10));
    if (data === null) return;
    const observacaoEditada = window.prompt("Observação do relatório:", relatorio.observacao ?? "");
    if (observacaoEditada === null) return;
    try {
      await api.put(`/relatorios-manutencao/${relatorio.id_relatorio_manutencao}/revisao`, {
        data_referencia: data,
        observacao: observacaoEditada,
        fotos: [],
      });
      toast.success("Relatório atualizado.");
      await carregarRelatorios();
    } catch (error) {
      toast.error(mensagemErro(error, "Falha ao editar o relatório."));
    }
  }
  async function baixarWord(relatorio: Relatorio) {
    try {
      const { data } = await api.get(`/relatorios-manutencao/${relatorio.id_relatorio_manutencao}/arquivo-word`, { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `RELATORIO-${relatorio.periodicidade}-${relatorio.data_referencia}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(mensagemErro(error, "Falha ao gerar o relatório Word."));
    }
  }
  async function baixar(relatorio: Relatorio) {
    try {
      const { data } = await api.get(`/relatorios-manutencao/${relatorio.id_relatorio_manutencao}/arquivo`, { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a"); link.href = url; link.download = relatorio.nome_arquivo_original; link.click();
      URL.revokeObjectURL(url);
    } catch (error) { toast.error(mensagemErro(error, "Falha ao baixar o ZIP.")); }
  }

  if (carregando) return <div className="grid min-h-[60vh] place-items-center text-slate-500"><Loader2 className="animate-spin" size={38} /></div>;

  return (
    <div className="mx-auto w-full max-w-[1720px] px-2 sm:px-4 xl:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="m-0 text-2xl font-semibold text-slate-900">Relatórios de manutenção</h1><p className="mt-1 text-sm text-slate-500">Envie, analise e acompanhe as evidências fotográficas das inspeções.</p></div>
        <Button variant="outline" onClick={() => carregarRelatorios().catch(() => toast.error("Falha ao atualizar."))}><RefreshCw size={16} />Atualizar histórico</Button>
      </div>

      <div className="mb-6 grid items-start gap-5 lg:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.8fr)] xl:gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UploadCloud size={19} />Novo envio</CardTitle><CardDescription>Preencha o contexto da manutenção antes de anexar as fotografias.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid min-w-0 gap-4">
              <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700">Subestação<select className="h-10 w-full min-w-0 max-w-full rounded-md border border-slate-300 bg-white px-3" value={idSubestacao} onChange={(e) => { setIdSubestacao(e.target.value); setAnalise(null); }}><option value="">Selecione</option>{subestacoes.map((item) => <option key={item.id_subestacao} value={item.id_subestacao}>{item.nome}</option>)}</select></label>
              <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700">Tipo do ativo<select className="h-10 w-full min-w-0 max-w-full rounded-md border border-slate-300 bg-white px-3" value={idTipoAtivo} onChange={(e) => { setIdTipoAtivo(e.target.value); setAnalise(null); }}><option value="">Selecione</option>{tiposAtivo.map((item) => <option key={item.id_tipo_ativo} value={item.id_tipo_ativo}>{item.nome}</option>)}</select></label>
              <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700">Periodicidade<select className="h-10 w-full min-w-0 max-w-full rounded-md border border-slate-300 bg-white px-3" value={periodicidade} onChange={(e) => { setPeriodicidade(e.target.value); setAnalise(null); }}><option value="">Selecione</option>{periodicidades.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">Data de referência<Input type="date" value={dataReferencia} onChange={(e) => setDataReferencia(e.target.value)} /></label>
            </div>
            <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <div><h3 className="text-sm font-semibold text-slate-900">Corpo técnico</h3><p className="text-xs text-slate-500">Informe todas as pessoas participantes.</p></div>
              {corpoTecnico.map((pessoa, indice) => (
                <div key={indice} className="grid gap-2 rounded-md border bg-white p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="grid gap-1 text-xs font-medium text-slate-600">Nome<Input value={pessoa.nome} onChange={(e) => setCorpoTecnico((atual) => atual.map((item, i) => i === indice ? { ...item, nome: e.target.value } : item))} placeholder="Nome completo" /></label>
                  <label className="grid gap-1 text-xs font-medium text-slate-600">Função<Input value={pessoa.funcao} onChange={(e) => setCorpoTecnico((atual) => atual.map((item, i) => i === indice ? { ...item, funcao: e.target.value } : item))} placeholder="Função" /></label>
                  <Button type="button" size="icon" variant="ghost" className="self-end text-red-600" disabled={corpoTecnico.length === 1} onClick={() => setCorpoTecnico((atual) => atual.filter((_, i) => i !== indice))} aria-label="Remover profissional"><Trash2 size={16} /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setCorpoTecnico((atual) => [...atual, { nome: "", funcao: "" }])}><Plus size={16} />Adicionar pessoa</Button>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-medium text-slate-600">OS<Input value={numeroOS} onChange={(e) => setNumeroOS(e.target.value)} placeholder="Número da OS" /></label>
                <label className="grid gap-1 text-xs font-medium text-slate-600">APR<Input value={numeroAPR} onChange={(e) => setNumeroAPR(e.target.value)} placeholder="Número da APR" /></label>
                <label className="grid gap-1 text-xs font-medium text-slate-600">Período *<Input value={periodoCapa} onChange={(e) => setPeriodoCapa(e.target.value)} /></label>
                <label className="grid gap-1 text-xs font-medium text-slate-600">Concessão *<Input value={concessao} onChange={(e) => setConcessao(e.target.value)} /></label>
              </div>
            </section>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">Texto da introdução *<Textarea className="min-h-40" value={textoIntroducao} onChange={(e) => setTextoIntroducao(e.target.value)} /></label>

            <section className="space-y-3 rounded-lg border border-slate-200 p-4">
              <div><h3 className="text-sm font-semibold text-slate-900">Condições diversas</h3><p className="text-xs text-slate-500">Preencha as medições no início e no fim da inspeção.</p></div>
              <div className="overflow-hidden rounded-md border">
                <div className="grid grid-cols-[1.25fr_1fr_1fr] bg-slate-100 text-xs font-semibold text-slate-700"><span className="p-2">Parâmetro</span><span className="border-l p-2 text-center">Início</span><span className="border-l p-2 text-center">Fim</span></div>
                <div className="grid grid-cols-[1.25fr_1fr_1fr] items-center border-t text-xs"><span className="p-2 font-medium">Horário</span><Input type="time" className="rounded-none border-y-0 border-r-0" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} /><Input type="time" className="rounded-none border-y-0 border-r-0" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} /></div>
                <div className="grid grid-cols-[1.25fr_1fr_1fr] items-center border-t text-xs"><span className="p-2 font-medium">Temperatura (°C)</span><Input inputMode="decimal" className="rounded-none border-y-0 border-r-0" value={temperaturaInicio} onChange={(e) => setTemperaturaInicio(e.target.value)} /><Input inputMode="decimal" className="rounded-none border-y-0 border-r-0" value={temperaturaFim} onChange={(e) => setTemperaturaFim(e.target.value)} /></div>
                <div className="grid grid-cols-[1.25fr_1fr_1fr] items-center border-t text-xs"><span className="p-2 font-medium">Frequência (Hz)</span><Input inputMode="decimal" className="rounded-none border-y-0 border-r-0" value={frequenciaInicio} onChange={(e) => setFrequenciaInicio(e.target.value)} /><Input inputMode="decimal" className="rounded-none border-y-0 border-r-0" value={frequenciaFim} onChange={(e) => setFrequenciaFim(e.target.value)} /></div>
                <div className="grid grid-cols-[1.25fr_1fr_1fr] items-center border-t text-xs"><span className="p-2 font-medium">Tensão barra (kV)</span><Input inputMode="decimal" className="rounded-none border-y-0 border-r-0" value={tensaoInicio} onChange={(e) => setTensaoInicio(e.target.value)} /><Input inputMode="decimal" className="rounded-none border-y-0 border-r-0" value={tensaoFim} onChange={(e) => setTensaoFim(e.target.value)} /></div>
              </div>
            </section>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">Observação<Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Contexto, anormalidades ou observações do lote" /></label>
            <div className={`rounded-lg border-2 border-dashed p-6 text-center transition ${selecaoCompleta ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-slate-50 opacity-60"}`}>
              <FileArchive className="mx-auto mb-2 text-blue-600" size={34} /><p className="m-0 font-medium text-slate-800">ZIP com as fotografias</p><p className="mb-4 mt-1 text-xs text-slate-500">O campo é liberado após selecionar subestação, tipo, periodicidade e data.</p>
              <Input ref={arquivoRef} type="file" accept=".zip,application/zip" disabled={!selecaoCompleta} onChange={(e) => selecionarArquivo(e.target.files?.[0] ?? null)} />
              {arquivo && <div className="mt-3 flex items-center justify-center gap-2 text-sm"><Archive size={15} /><strong>{arquivo.name}</strong><span className="text-slate-500">({formatarBytes(arquivo.size)})</span><button className="text-red-600" onClick={() => selecionarArquivo(null)} aria-label="Remover arquivo"><X size={16} /></button></div>}
            </div>
            <Button className="w-full" disabled={!arquivo || !selecaoCompleta || analisando} onClick={analisar}>{analisando ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />}{analisando ? "Analisando fotografias..." : "Analisar fotografias"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><Eye size={21} />Revisão das evidências</CardTitle><CardDescription>Classificações de baixa confiança e duplicatas precisam de confirmação.</CardDescription></CardHeader>
          <CardContent>
            {!analise ? <div className="grid min-h-64 place-items-center rounded-lg border border-dashed text-center text-sm text-slate-500"><div><Search className="mx-auto mb-2" /><p>Analise um ZIP para revisar as sugestões.</p></div></div> : <div className="space-y-4">
              <ReviewEvidenceGrid
                analise={analise}
                confirmados={confirmados}
                onReviewsChange={setRevisoesEnvio}
                onConfirmChange={(arquivo, confirmado) => setConfirmados((atual) => {
                  const proximo = new Set(atual);
                  if (confirmado) proximo.add(arquivo); else proximo.delete(arquivo);
                  return proximo;
                })}
              />
              {pendencias.length > 0 && <p className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800"><AlertTriangle size={17} />Faltam {pendencias.length} confirmações.</p>}
              <Button className="w-full" disabled={!podeEnviar} onClick={enviar}>{enviando ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}{enviando ? "Enviando..." : "Confirmar e enviar relatório"}</Button>
            </div>}          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between"><div><CardTitle>Histórico de relatórios</CardTitle><CardDescription>{relatorios.length} lote{relatorios.length === 1 ? "" : "s"} registrado{relatorios.length === 1 ? "" : "s"}</CardDescription></div><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><Input className="pl-9 md:w-72" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar no histórico" /></div></CardHeader>
        <CardContent><div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="p-3">Data</th><th className="p-3">Subestação</th><th className="p-3">Tipo de ativo</th><th className="p-3">Periodicidade</th><th className="p-3">Emissor</th><th className="p-3">Editado por</th><th className="p-3">Arquivo</th><th className="p-3">Fotos</th><th className="p-3">Status</th><th className="p-3 text-right">Ação</th></tr></thead><tbody>{relatoriosFiltrados.map((relatorio) => <tr key={relatorio.id_relatorio_manutencao} className="border-t"><td className="p-3 whitespace-nowrap">{formatarData(relatorio.data_referencia)}</td><td className="p-3">{subestacoes.find((item) => item.id_subestacao === relatorio.id_subestacao)?.nome ?? `#${relatorio.id_subestacao}`}</td><td className="p-3">{tiposAtivo.find((item) => item.id_tipo_ativo === relatorio.id_tipo_ativo)?.nome ?? `#${relatorio.id_tipo_ativo}`}</td><td className="p-3">{relatorio.periodicidade.replaceAll("_", " ")}</td><td className="p-3 whitespace-nowrap">{relatorio.emissor ?? "Não informado"}</td><td className="p-3 whitespace-nowrap">{relatorio.editado_por ?? "Não editado"}</td><td className="max-w-52 truncate p-3" title={relatorio.nome_arquivo_original}>{relatorio.nome_arquivo_original}<span className="block text-xs text-slate-400">{formatarBytes(relatorio.tamanho_bytes)}</span></td><td className="p-3">{relatorio.quantidade_fotos}</td><td className="p-3"><Badge variant="secondary">{relatorio.status}</Badge></td><td className="p-3 text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => editarRelatorio(relatorio)}><Pencil size={15} />Editar</Button><Button size="sm" onClick={() => baixarWord(relatorio)}><Download size={15} />Word</Button><Button size="sm" variant="outline" onClick={() => baixar(relatorio)}><Archive size={15} />ZIP</Button><Button size="sm" variant="destructive" onClick={() => excluirRelatorio(relatorio)}><Trash2 size={15} />Excluir</Button></div></td></tr>)}{!relatoriosFiltrados.length && <tr><td colSpan={10} className="p-8 text-center text-slate-500">Nenhum relatório encontrado.</td></tr>}</tbody></table></div></CardContent>
      </Card>
    </div>
  );
}






