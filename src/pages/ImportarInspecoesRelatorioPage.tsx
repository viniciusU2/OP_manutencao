import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, FileText, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import api from "../api/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAuth } from "../context/AuthContext";
import { filtroInicialInstalacao } from "../lib/instalacaoPreferida";
import type { Subestacao } from "../types/Subestacao";
import type { TipoAtivo } from "../types/TipoAtivo";

const FUNCOES_CORPO_TECNICO = [
  "Engenheiro(a) Eletricista",
  "Engenheiro(a) de Manutenção",
  "Supervisor(a) de Manutenção",
  "Técnico(a) Eletrotécnico(a)",
  "Técnico(a) de Manutenção",
  "Eletricista",
  "Mantenedor(a)",
  "Operador(a)",
  "Auxiliar Técnico(a)",
];

type InspecaoDisponivel = {
  id_inspecao: number;
  id_ativo: number;
  codigo_ativo: string | null;
  fase: string | null;
  data_inspecao: string;
  periodicidade: string;
  responsavel: string | null;
  numero_os: string | null;
  numero_apr: string | null;
  itens: number;
  fotos_backend: number;
  fotos_link: number;
};

type Sugestoes = {
  data_referencia: string;
  periodo_capa: string;
  texto_introducao: string;
  responsaveis: string[];
  numero_os: string | null;
  numero_apr: string | null;
  id_subestacao: number | null;
  id_tipo_ativo: number | null;
  periodicidade: string;
};

type ListaInspecoes = {
  inspecoes: InspecaoDisponivel[];
  total_inspecoes: number;
  total_fotos_backend: number;
  total_fotos_link: number;
  sugestoes: Sugestoes | null;
};

type PessoaCorpoTecnico = { nome: string; funcao: string };
type ErroApi = { response?: { data?: { detail?: unknown } }; message?: string };

const selectClass = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const selectLayoutClass = "h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function erro(error: unknown, fallback: string) {
  const detalhe = (error as ErroApi).response?.data?.detail;
  if (typeof detalhe === "string") return detalhe;
  if (Array.isArray(detalhe)) return detalhe.map((item) => {
    if (typeof item === "object" && item && "msg" in item) return String(item.msg);
    return String(item);
  }).join("; ");
  return (error as ErroApi).message ?? fallback;
}

function dataHoraBr(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" })
    .format(new Date(valor.includes("T") ? valor : `${valor}T12:00:00`));
}

export default function ImportarInspecoesRelatorioPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);
  const [periodicidades, setPeriodicidades] = useState<string[]>([]);

  const [idSubestacao, setIdSubestacao] = useState("");
  const [idTipoAtivo, setIdTipoAtivo] = useState("");
  const [periodicidade, setPeriodicidade] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [lista, setLista] = useState<ListaInspecoes | null>(null);
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());
  const [buscando, setBuscando] = useState(false);
  const [gerando, setGerando] = useState(false);

  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().slice(0, 10));
  const [periodoCapa, setPeriodoCapa] = useState("");
  const [concessao, setConcessao] = useState("Rialma Transmissora de Energia - RTV");
  const [numeroOS, setNumeroOS] = useState("");
  const [numeroAPR, setNumeroAPR] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [temperaturaInicio, setTemperaturaInicio] = useState("");
  const [temperaturaFim, setTemperaturaFim] = useState("");
  const [frequenciaInicio, setFrequenciaInicio] = useState("60");
  const [frequenciaFim, setFrequenciaFim] = useState("60");
  const [tensaoInicio, setTensaoInicio] = useState("");
  const [tensaoFim, setTensaoFim] = useState("");
  const [textoIntroducao, setTextoIntroducao] = useState("");
  const [corpoTecnico, setCorpoTecnico] = useState<PessoaCorpoTecnico[]>([{ nome: "", funcao: "" }]);
  const [observacao, setObservacao] = useState("");

  const [fotosPorPagina, setFotosPorPagina] = useState(2);
  const [tamanhoFoto, setTamanhoFoto] = useState(100);

  useEffect(() => {
    Promise.all([
      api.get<Subestacao[]>("/subestacao/ativas"),
      api.get<TipoAtivo[]>("/tipo-ativo"),
      api.get<string[]>("/relatorios-manutencao/periodicidades"),
    ])
      .then(([subs, tipos, periodos]) => {
        setSubestacoes(subs.data);
        setTiposAtivo(tipos.data);
        setPeriodicidades(periodos.data);
        const inicial = filtroInicialInstalacao(usuario, subs.data);
        setIdSubestacao(inicial === "all" ? "" : inicial);
      })
      .catch((e) => toast.error(erro(e, "Não foi possível carregar os filtros.")));
  }, [usuario]);

  const preencherCapa = useCallback((sugestoes: Sugestoes) => {
    setDataReferencia(sugestoes.data_referencia);
    setPeriodoCapa(sugestoes.periodo_capa);
    setTextoIntroducao(sugestoes.texto_introducao);
    setNumeroOS(sugestoes.numero_os ?? "");
    setNumeroAPR(sugestoes.numero_apr ?? "");
    setCorpoTecnico(
      sugestoes.responsaveis.length
        ? sugestoes.responsaveis.map((nome) => ({ nome, funcao: "" }))
        : [{ nome: "", funcao: "" }],
    );
  }, []);

  async function buscar() {
    setBuscando(true);
    try {
      const { data } = await api.get<ListaInspecoes>("/relatorios-manutencao/inspecoes-disponiveis", {
        params: {
          id_subestacao: idSubestacao || undefined,
          id_tipo_ativo: idTipoAtivo || undefined,
          periodicidade: periodicidade || undefined,
          data_inicio: dataInicio || undefined,
          data_fim: dataFim || undefined,
        },
      });
      setLista(data);
      setSelecionadas(new Set(data.inspecoes.filter((item) => item.fotos_backend > 0).map((item) => item.id_inspecao)));
      if (data.sugestoes) preencherCapa(data.sugestoes);
      if (!data.inspecoes.length) toast.info("Nenhuma inspeção encontrada para os filtros.");
    } catch (e) {
      toast.error(erro(e, "Não foi possível buscar as inspeções."));
    } finally {
      setBuscando(false);
    }
  }

  const selecionadasInfo = useMemo(
    () => (lista?.inspecoes ?? []).filter((item) => selecionadas.has(item.id_inspecao)),
    [lista, selecionadas],
  );
  const totalFotosSelecionadas = selecionadasInfo.reduce((total, item) => total + item.fotos_backend, 0);

  function alternar(id: number) {
    setSelecionadas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  function alternarTodas() {
    if (!lista) return;
    const comFoto = lista.inspecoes.filter((item) => item.fotos_backend > 0).map((item) => item.id_inspecao);
    setSelecionadas((atual) => (atual.size === comFoto.length ? new Set() : new Set(comFoto)));
  }

  async function gerar() {
    if (!selecionadas.size) {
      toast.error("Selecione ao menos uma inspeção.");
      return;
    }
    if (!totalFotosSelecionadas) {
      toast.error("As inspeções selecionadas não têm fotos salvas no backend.");
      return;
    }
    setGerando(true);
    try {
      const { data } = await api.post<{ id_relatorio_manutencao: number }>("/relatorios-manutencao/de-inspecoes", {
        ids_inspecao: Array.from(selecionadas),
        data_referencia: dataReferencia || null,
        periodo_capa: periodoCapa.trim() || null,
        concessao: concessao.trim() || null,
        numero_os: numeroOS.trim() || null,
        numero_apr: numeroAPR.trim() || null,
        texto_introducao: textoIntroducao.trim() || null,
        observacao: observacao.trim() || null,
        corpo_tecnico: corpoTecnico.filter((pessoa) => pessoa.nome.trim() || pessoa.funcao.trim()),
        hora_inicio: horaInicio.trim(),
        hora_fim: horaFim.trim(),
        temperatura_inicio: temperaturaInicio.trim(),
        temperatura_fim: temperaturaFim.trim(),
        frequencia_inicio: frequenciaInicio.trim(),
        frequencia_fim: frequenciaFim.trim(),
        tensao_inicio: tensaoInicio.trim(),
        tensao_fim: tensaoFim.trim(),
      });

      toast.success("Relatório gerado a partir das inspeções.");
      try {
        const arquivo = await api.get(`/relatorios-manutencao/${data.id_relatorio_manutencao}/arquivo-word`, {
          responseType: "blob",
          params: { fotos_por_pagina: fotosPorPagina, tamanho_foto: tamanhoFoto },
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(arquivo.data);
        link.download = `RELATORIO-${periodicidade || "INSPECOES"}-${dataReferencia}.docx`;
        link.click();
        URL.revokeObjectURL(link.href);
      } catch {
        toast.warning("Relatório criado, mas o Word não pôde ser baixado agora. Use a lista de relatórios.");
      }
      navigate("/relatorios-manutencao");
    } catch (e) {
      toast.error(erro(e, "Não foi possível gerar o relatório."));
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 px-2 py-4 sm:px-4 xl:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-semibold text-slate-900">Relatório a partir das inspeções</h1>
          <p className="mt-1 text-sm text-slate-500">
            Importa itens, valores, status, observações e as fotos salvas no backend nas inspeções.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/relatorios-manutencao")}>
          <ArrowLeft size={16} />Voltar
        </Button>
      </header>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Subestação
              <select className={selectClass} value={idSubestacao} onChange={(e) => setIdSubestacao(e.target.value)}>
                <option value="">Todas</option>
                {subestacoes.map((sub) => <option key={sub.id_subestacao} value={sub.id_subestacao}>{sub.nome}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Tipo de ativo
              <select className={selectClass} value={idTipoAtivo} onChange={(e) => setIdTipoAtivo(e.target.value)}>
                <option value="">Todos</option>
                {tiposAtivo.map((tipo) => <option key={tipo.id_tipo_ativo} value={tipo.id_tipo_ativo}>{tipo.nome}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Periodicidade
              <select className={selectClass} value={periodicidade} onChange={(e) => setPeriodicidade(e.target.value)}>
                <option value="">Todas</option>
                {periodicidades.map((valor) => <option key={valor} value={valor}>{valor.replace(/_/g, " ")}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">De
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Até
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={buscar} disabled={buscando}>
              {buscando ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}Buscar inspeções
            </Button>
            {lista && (
              <span className="text-xs text-slate-500">
                {lista.total_inspecoes} inspeções encontradas · {lista.total_fotos_backend} fotos no backend
                {lista.total_fotos_link > 0 && ` · ${lista.total_fotos_link} fotos apenas como link (não importadas)`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {lista && lista.inspecoes.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700">Inspeções</span>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{selecionadas.size} selecionadas · {totalFotosSelecionadas} fotos</span>
                <Button variant="outline" onClick={alternarTodas}>Marcar/desmarcar</Button>
              </div>
            </div>
            <div className="max-h-[360px] overflow-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Ativo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Periodicidade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Itens</TableHead>
                    <TableHead className="text-right">Fotos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.inspecoes.map((item) => {
                    const marcada = selecionadas.has(item.id_inspecao);
                    return (
                      <TableRow key={item.id_inspecao} className={marcada ? "bg-blue-50/60" : undefined}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={marcada}
                            onChange={() => alternar(item.id_inspecao)}
                            disabled={item.fotos_backend === 0}
                            title={item.fotos_backend === 0 ? "Sem foto no backend" : undefined}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{item.codigo_ativo} {item.fase}</TableCell>
                        <TableCell>{dataHoraBr(item.data_inspecao)}</TableCell>
                        <TableCell>{item.periodicidade.replace(/_/g, " ")}</TableCell>
                        <TableCell>{item.responsavel || "—"}</TableCell>
                        <TableCell className="text-right">{item.itens}</TableCell>
                        <TableCell className="text-right">
                          <span className={item.fotos_backend ? "font-semibold text-emerald-700" : "text-slate-400"}>
                            {item.fotos_backend}
                          </span>
                          {item.fotos_link > 0 && (
                            <span className="ml-1 text-[11px] text-amber-600" title="Fotos apenas como link externo (SharePoint/Drive), não importadas">
                              +{item.fotos_link} link
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {lista.total_fotos_link > 0 && (
              <p className="text-xs text-amber-700">
                Fotos salvas apenas como link externo (SharePoint/Drive) não são importadas. Apenas as fotos
                enviadas ao backend entram no relatório.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileText size={16} className="text-blue-600" />Dados da capa
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Data de referência
              <Input type="date" value={dataReferencia} onChange={(e) => setDataReferencia(e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Período
              <Input value={periodoCapa} onChange={(e) => setPeriodoCapa(e.target.value)} placeholder="Setembro/ 2026" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Concessão
              <Input value={concessao} onChange={(e) => setConcessao(e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Nº da OS
              <Input value={numeroOS} onChange={(e) => setNumeroOS(e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Nº da APR
              <Input value={numeroAPR} onChange={(e) => setNumeroAPR(e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Hora inicial *
              <Input value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} placeholder="08:00" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Hora final *
              <Input value={horaFim} onChange={(e) => setHoraFim(e.target.value)} placeholder="16:00" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Temperatura inicial *
              <Input value={temperaturaInicio} onChange={(e) => setTemperaturaInicio(e.target.value)} placeholder="30" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Temperatura final *
              <Input value={temperaturaFim} onChange={(e) => setTemperaturaFim(e.target.value)} placeholder="35" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Frequência inicial *
              <Input value={frequenciaInicio} onChange={(e) => setFrequenciaInicio(e.target.value)} placeholder="60" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Frequência final *
              <Input value={frequenciaFim} onChange={(e) => setFrequenciaFim(e.target.value)} placeholder="60" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Tensão inicial *
              <Input value={tensaoInicio} onChange={(e) => setTensaoInicio(e.target.value)} placeholder="530" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Tensão final *
              <Input value={tensaoFim} onChange={(e) => setTensaoFim(e.target.value)} placeholder="530" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Observação
              <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </label>
          </div>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">Texto da introdução
            <textarea
              className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={textoIntroducao}
              onChange={(e) => setTextoIntroducao(e.target.value)}
            />
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Corpo técnico *</span>
              <Button
                variant="outline"
                onClick={() => setCorpoTecnico((atual) => [...atual, { nome: "", funcao: "" }])}
              >
                <Plus size={14} />Adicionar
              </Button>
            </div>
            {corpoTecnico.map((pessoa, indice) => (
              <div key={indice} className="grid gap-2 sm:grid-cols-[1fr_260px_40px]">
                <Input
                  placeholder="Nome"
                  value={pessoa.nome}
                  onChange={(e) => setCorpoTecnico((atual) => atual.map((item, i) => (i === indice ? { ...item, nome: e.target.value } : item)))}
                />
                <select
                  className={selectClass}
                  value={pessoa.funcao}
                  onChange={(e) => setCorpoTecnico((atual) => atual.map((item, i) => (i === indice ? { ...item, funcao: e.target.value } : item)))}
                >
                  <option value="">Função</option>
                  {FUNCOES_CORPO_TECNICO.map((funcao) => <option key={funcao} value={funcao}>{funcao}</option>)}
                </select>
                <Button
                  variant="outline"
                  onClick={() => setCorpoTecnico((atual) => (atual.length === 1 ? atual : atual.filter((_, i) => i !== indice)))}
                  aria-label="Remover pessoa"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Camera size={15} className="text-blue-600" />Layout do Word
            </span>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">Fotos por página
              <select className={`${selectLayoutClass} w-36`} value={fotosPorPagina} onChange={(e) => setFotosPorPagina(Number(e.target.value))}>
                <option value={1}>1 por página</option>
                <option value={2}>2 por página</option>
                <option value={3}>3 por página</option>
                <option value={4}>4 por página</option>
                <option value={6}>6 por página (3 + 3)</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">Tamanho da foto
              <select className={`${selectLayoutClass} w-40`} value={tamanhoFoto} onChange={(e) => setTamanhoFoto(Number(e.target.value))}>
                <option value={100}>100% (padrão)</option>
                <option value={90}>90%</option>
                <option value={80}>80%</option>
                <option value={70}>70%</option>
                <option value={60}>60%</option>
                <option value={50}>50%</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="mr-auto text-xs text-slate-500">
              {selecionadas.size} inspeções · {totalFotosSelecionadas} fotos
            </span>
            <Button variant="outline" onClick={() => navigate("/relatorios-manutencao")}>Cancelar</Button>
            <Button onClick={gerar} disabled={gerando || !selecionadas.size || !totalFotosSelecionadas}>
              {gerando ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Gerar relatório
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
