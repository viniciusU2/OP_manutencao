import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck,
  Edit3, Loader2, RefreshCw, Save, Search, Send, X, XCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import Container from "../components/Container";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

type CampoValor = string | number | null;
type DadosOs = Record<string, CampoValor>;

type ValidacaoResumo = {
  id_validacao: number;
  tipo_registro: "IMPORTAR" | "ATUALIZAR_EXISTENTE";
  fonte: string | null;
  linha_controle: number | null;
  numero_os: string;
  id_os_destino: number | null;
  bloqueios: string[];
  avisos: string[];
  contexto: Record<string, string | number | null>;
  status_validacao: string;
  observacao_validacao: string | null;
  validado_por: string | null;
  erro_envio: string | null;
  atualizado_em: string | null;
  resumo_os: {
    instalacao?: string | null;
    id_subestacao?: number | null;
    id_ativo?: number | null;
    id_grupo_ativo?: number | null;
    id_plano_manutencao?: number | null;
    emissor?: string | null;
    descricao_servicos?: string | null;
    data_inicio_programado?: string | null;
    status?: string | null;
  };
};

type ValidacaoDetalhe = Omit<ValidacaoResumo, "resumo_os"> & { dados_os: DadosOs };

type ListaResponse = {
  items: ValidacaoResumo[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  resumo: Record<string, number>;
  fontes: string[];
  bloqueios: string[];
};

type Opcoes = {
  subestacoes: { id_subestacao: number; nome: string }[];
  ativos: { id_ativo: number; id_subestacao: number; codigo_ativo: string; bay?: string; fase?: string; tipo_ativo?: string }[];
  grupos: { id_grupo_ativo: number; id_subestacao: number; codigo_ativo: string; bay?: string; descricao?: string; tipo_ativo?: string }[];
  planos: { id_plano_manutencao: number; id_tipo_ativo: number; descricao_geral?: string; tipo_ativo?: string }[];
};

type Campo = {
  key: string;
  label: string;
  type?: "text" | "number" | "datetime-local" | "textarea" | "select";
  options?: { value: string; label: string }[];
  wide?: boolean;
};

const CAMPOS_NUMERICOS = new Set([
  "id_subestacao", "id_ativo", "id_grupo_ativo", "id_funcao_operacao",
  "id_plano_manutencao", "id_plano_item", "id_plano_execucao", "id_frente_servico",
]);

const GRUPOS_CAMPOS: { titulo: string; campos: Campo[] }[] = [
  {
    titulo: "Identificação",
    campos: [
      { key: "numero_os", label: "Número da OS" },
      { key: "numero_si", label: "Número da SI" },
      { key: "numero_ss", label: "Número da SS" },
      { key: "numero_apr", label: "Número da APR" },
      { key: "origem", label: "Origem" },
      { key: "especie", label: "Espécie" },
    ],
  },
  {
    titulo: "Vínculos",
    campos: [
      { key: "id_subestacao", label: "Instalação", type: "select" },
      { key: "id_ativo", label: "Ativo", type: "select" },
      { key: "id_grupo_ativo", label: "Grupo de ativo", type: "select" },
      { key: "id_funcao_operacao", label: "ID função de operação", type: "number" },
      { key: "escopo_ativo", label: "Escopo", type: "select", options: [
        { value: "", label: "Não definido" }, { value: "FUNCAO", label: "Função" },
        { value: "GRUPO", label: "Grupo" }, { value: "FASE", label: "Fase" },
      ] },
      { key: "id_plano_manutencao", label: "Plano de manutenção", type: "select" },
      { key: "id_plano_item", label: "ID item do plano", type: "number" },
      { key: "id_plano_execucao", label: "ID execução do plano", type: "number" },
      { key: "id_frente_servico", label: "ID frente de serviço", type: "number" },
    ],
  },
  {
    titulo: "Localização",
    campos: [
      { key: "instalacao", label: "Instalação" },
      { key: "localizacao", label: "Localização" },
      { key: "complemento", label: "Complemento" },
      { key: "centro_custos", label: "Centro de custos" },
    ],
  },
  {
    titulo: "Serviço",
    campos: [
      { key: "origens", label: "Origens", type: "textarea", wide: true },
      { key: "defeito", label: "Defeito", type: "textarea", wide: true },
      { key: "esquema_servicos", label: "Esquema de serviços" },
      { key: "prioridade", label: "Prioridade", type: "select", options: [
        { value: "NIVEL_1", label: "Nível 1" }, { value: "NIVEL_2", label: "Nível 2" },
        { value: "NIVEL_3", label: "Nível 3" }, { value: "NIVEL_4", label: "Nível 4" },
      ] },
      { key: "descricao_servicos", label: "Descrição dos serviços", type: "textarea", wide: true },
      { key: "observacoes", label: "Observações", type: "textarea", wide: true },
      { key: "causa_primaria", label: "Causa primária", type: "textarea", wide: true },
      { key: "causa_secundaria", label: "Causa secundária", type: "textarea", wide: true },
    ],
  },
  {
    titulo: "Equipe e autoria",
    campos: [
      { key: "responsavel", label: "Responsável" },
      { key: "responsavel_manutencao", label: "Responsável manutenção" },
      { key: "responsavel_operacao", label: "Responsável operação" },
      { key: "substituto", label: "Substituto" },
      { key: "emissor", label: "Emissor" },
      { key: "editado_por", label: "Editado por" },
    ],
  },
  {
    titulo: "Datas e status",
    campos: [
      { key: "data_abertura_ss", label: "Abertura da SS", type: "datetime-local" },
      { key: "data_inicio_programado", label: "Início programado", type: "datetime-local" },
      { key: "data_fim_programado", label: "Fim programado", type: "datetime-local" },
      { key: "data_inicio_execucao", label: "Início da execução", type: "datetime-local" },
      { key: "data_fim_execucao", label: "Fim da execução", type: "datetime-local" },
      { key: "criado_em", label: "Criado em", type: "datetime-local" },
      { key: "status", label: "Status", type: "select", options: [
        { value: "ABERTA", label: "Aberta" }, { value: "INICIADA", label: "Iniciada" },
        { value: "ENCERRADA", label: "Encerrada" }, { value: "CANCELADA", label: "Cancelada" },
      ] },
    ],
  },
];

function mensagemErro(error: unknown, fallback: string) {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

function formatarData(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "short",
  }).format(date);
}

function paraInputData(value: CampoValor) {
  if (!value) return "";
  return String(value).replace(" ", "T").slice(0, 16);
}

function classeStatus(status: string) {
  const classes: Record<string, string> = {
    PENDENTE: "bg-amber-100 text-amber-800",
    EM_REVISAO: "bg-blue-100 text-blue-800",
    CONFIRMADA: "bg-emerald-100 text-emerald-800",
    REJEITADA: "bg-slate-200 text-slate-700",
    ENVIADA: "bg-violet-100 text-violet-800",
    ERRO: "bg-red-100 text-red-800",
  };
  return classes[status] ?? "bg-slate-100 text-slate-700";
}

function rotuloStatus(status: string) {
  return ({
    PENDENTE: "Pendente", EM_REVISAO: "Em revisão", CONFIRMADA: "Confirmada",
    REJEITADA: "Rejeitada", ENVIADA: "Enviada", ERRO: "Erro",
  } as Record<string, string>)[status] ?? status;
}

export default function ValidacaoOsAntigasPage() {
  const { usuario } = useAuth();
  const [lista, setLista] = useState<ListaResponse>({
    items: [], total: 0, page: 1, page_size: 25, total_pages: 1,
    resumo: {}, fontes: [], bloqueios: [],
  });
  const [opcoes, setOpcoes] = useState<Opcoes>({ subestacoes: [], ativos: [], grupos: [], planos: [] });
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [fonte, setFonte] = useState("TODAS");
  const [tipo, setTipo] = useState("TODOS");
  const [bloqueio, setBloqueio] = useState("TODOS");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editorLoading, setEditorLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [detalhe, setDetalhe] = useState<ValidacaoDetalhe | null>(null);
  const [dados, setDados] = useState<DadosOs>({});
  const [observacao, setObservacao] = useState("");
  const revisor = usuario?.nome || usuario?.email || "Usuário";

  async function carregar() {
    setLoading(true);
    try {
      const { data } = await api.get<ListaResponse>("/os-validacao", {
        params: { busca, status, fonte, tipo, bloqueio, page, page_size: 25 },
      });
      setLista(data);
    } catch (error) {
      toast.error(mensagemErro(error, "Erro ao carregar a fila de validação."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get<Opcoes>("/os-validacao/opcoes")
      .then(({ data }) => setOpcoes(data))
      .catch((error) => toast.error(mensagemErro(error, "Erro ao carregar as opções de edição.")));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void carregar(); }, 250);
    return () => window.clearTimeout(timeout);
  }, [busca, status, fonte, tipo, bloqueio, page]);

  useEffect(() => { setPage(1); }, [busca, status, fonte, tipo, bloqueio]);

  const ativosFiltrados = useMemo(() => {
    const id = Number(dados.id_subestacao || 0);
    return id ? opcoes.ativos.filter((item) => item.id_subestacao === id) : opcoes.ativos;
  }, [dados.id_subestacao, opcoes.ativos]);

  const gruposFiltrados = useMemo(() => {
    const id = Number(dados.id_subestacao || 0);
    return id ? opcoes.grupos.filter((item) => item.id_subestacao === id) : opcoes.grupos;
  }, [dados.id_subestacao, opcoes.grupos]);

  async function abrirEditor(id: number) {
    setEditorLoading(true);
    try {
      const { data } = await api.get<ValidacaoDetalhe>(`/os-validacao/${id}`);
      setDetalhe(data);
      setDados(data.dados_os);
      setObservacao(data.observacao_validacao || "");
    } catch (error) {
      toast.error(mensagemErro(error, "Erro ao abrir a OS para validação."));
    } finally {
      setEditorLoading(false);
    }
  }

  function alterarCampo(key: string, rawValue: string) {
    let value: CampoValor = rawValue;
    if (CAMPOS_NUMERICOS.has(key)) value = rawValue === "" ? null : Number(rawValue);
    setDados((current) => {
      const next = { ...current, [key]: value };
      if (key === "id_plano_manutencao") {
        const plano = opcoes.planos.find((item) => item.id_plano_manutencao === Number(value));
        if (plano) {
          const emissorAtual = String(current.emissor || "").trim();
          if (emissorAtual && !emissorAtual.toLowerCase().startsWith("plano #") && !current.editado_por) {
            next.editado_por = emissorAtual;
          }
          next.emissor = `Plano #${plano.id_plano_manutencao} - ${plano.tipo_ativo || plano.descricao_geral || "Manutenção"}`;
        }
      }
      return next;
    });
  }

  async function salvar(acao?: "confirmar" | "rejeitar") {
    if (!detalhe) return;
    setSalvando(true);
    try {
      await api.patch(`/os-validacao/${detalhe.id_validacao}`, {
        dados_os: dados, observacao_validacao: observacao, validado_por: revisor,
      });
      if (acao) {
        await api.post(`/os-validacao/${detalhe.id_validacao}/${acao}`, {
          observacao_validacao: observacao, validado_por: revisor,
        });
      }
      toast.success(acao === "confirmar" ? "OS confirmada para envio." : acao === "rejeitar" ? "OS rejeitada." : "Revisão salva.");
      setDetalhe(null);
      await carregar();
    } catch (error) {
      toast.error(mensagemErro(error, "Não foi possível salvar a validação."));
    } finally {
      setSalvando(false);
    }
  }

  async function enviar(item: ValidacaoResumo) {
    if (!window.confirm(`Enviar ${item.numero_os} para o cadastro definitivo?`)) return;
    try {
      const { data } = await api.post(`/os-validacao/${item.id_validacao}/enviar`);
      toast.success(data.mensagem || "OS enviada com sucesso.");
      await carregar();
    } catch (error) {
      toast.error(mensagemErro(error, "Não foi possível enviar a OS."));
    }
  }

  async function reabrir(item: ValidacaoResumo) {
    try {
      await api.post(`/os-validacao/${item.id_validacao}/reabrir`);
      toast.success("OS reaberta para edição.");
      await carregar();
    } catch (error) {
      toast.error(mensagemErro(error, "Não foi possível reabrir a OS."));
    }
  }

  function renderCampo(campo: Campo) {
    const value = dados[campo.key];
    let options = campo.options;
    if (campo.key === "id_subestacao") options = [
      { value: "", label: "Selecione" },
      ...opcoes.subestacoes.map((item) => ({ value: String(item.id_subestacao), label: `${item.nome} (#${item.id_subestacao})` })),
    ];
    if (campo.key === "id_ativo") options = [
      { value: "", label: "Sem ativo" },
      ...ativosFiltrados.map((item) => ({
        value: String(item.id_ativo),
        label: `${item.codigo_ativo}${item.fase ? ` - ${item.fase}` : ""}${item.tipo_ativo ? ` (${item.tipo_ativo})` : ""} #${item.id_ativo}`,
      })),
    ];
    if (campo.key === "id_grupo_ativo") options = [
      { value: "", label: "Sem grupo" },
      ...gruposFiltrados.map((item) => ({
        value: String(item.id_grupo_ativo),
        label: `${item.codigo_ativo}${item.tipo_ativo ? ` (${item.tipo_ativo})` : ""} #${item.id_grupo_ativo}`,
      })),
    ];
    if (campo.key === "id_plano_manutencao") options = [
      { value: "", label: "Sem plano" },
      ...opcoes.planos.map((item) => ({
        value: String(item.id_plano_manutencao),
        label: `Plano #${item.id_plano_manutencao} - ${item.tipo_ativo || item.descricao_geral || "Manutenção"}`,
      })),
    ];

    const common = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
    return <label key={campo.key} className={campo.wide ? "md:col-span-2" : ""}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{campo.label}</span>
      {campo.type === "textarea" ? (
        <textarea className={`${common} min-h-24 resize-y`} value={String(value ?? "")}
          onChange={(event) => alterarCampo(campo.key, event.target.value)} />
      ) : campo.type === "select" ? (
        <select className={common} value={String(value ?? "")}
          onChange={(event) => alterarCampo(campo.key, event.target.value)}>
          {(options ?? []).map((option) => <option key={`${campo.key}-${option.value}`} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input className={common} type={campo.type || "text"}
          value={campo.type === "datetime-local" ? paraInputData(value) : String(value ?? "")}
          onChange={(event) => alterarCampo(campo.key, event.target.value)} />
      )}
    </label>;
  }

  const totalPendente = (lista.resumo.PENDENTE || 0) + (lista.resumo.EM_REVISAO || 0) + (lista.resumo.ERRO || 0);

  return <Container>
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-700"><ClipboardCheck className="h-5 w-5" /><span className="text-sm font-semibold">Administração</span></div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Validação de OS antigas</h1>
          <p className="mt-1 text-sm text-slate-600">Revise todos os campos, confirme e envie cada OS para o cadastro definitivo.</p>
        </div>
        <Button variant="outline" onClick={() => void carregar()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Atualizar</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["A revisar", totalPendente, "text-amber-700"],
          ["Confirmadas", lista.resumo.CONFIRMADA || 0, "text-emerald-700"],
          ["Enviadas", lista.resumo.ENVIADA || 0, "text-violet-700"],
          ["Rejeitadas", lista.resumo.REJEITADA || 0, "text-slate-700"],
          ["Total", Object.values(lista.resumo).reduce((sum, value) => sum + value, 0), "text-blue-700"],
        ].map(([label, value, color]) => <Card key={String(label)} className="border-slate-200 shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>)}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative xl:col-span-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar OS, ativo, descrição..." className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm" /></label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm"><option value="TODOS">Todos os status</option>{["PENDENTE", "EM_REVISAO", "CONFIRMADA", "REJEITADA", "ENVIADA", "ERRO"].map((item) => <option key={item} value={item}>{rotuloStatus(item)}</option>)}</select>
          <select value={fonte} onChange={(e) => setFonte(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm"><option value="TODAS">Todas as fontes</option>{lista.fontes.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm"><option value="TODOS">Importar e atualizar</option><option value="IMPORTAR">Cadastrar nova</option><option value="ATUALIZAR_EXISTENTE">Atualizar existente</option></select>
          <select value={bloqueio} onChange={(e) => setBloqueio(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm md:col-span-2 xl:col-span-5"><option value="TODOS">Todos os motivos de revisão</option>{lista.bloqueios.map((item) => <option key={item}>{item}</option>)}</select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50/80 py-4"><CardTitle className="text-base">{lista.total} registro(s) encontrado(s)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>OS</TableHead><TableHead>Fonte</TableHead><TableHead>Motivos</TableHead><TableHead>Plano / emissor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="mx-auto animate-spin text-blue-600" /></TableCell></TableRow> : lista.items.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">Nenhum registro encontrado.</TableCell></TableRow> : lista.items.map((item) => <TableRow key={item.id_validacao} className="align-top">
                  <TableCell><p className="font-semibold text-slate-900">{item.numero_os}</p><p className="mt-1 text-xs text-slate-500">{item.tipo_registro === "IMPORTAR" ? "Nova OS" : `Atualizar ID ${item.id_os_destino}`}</p><p className="text-xs text-slate-500">{formatarData(item.resumo_os.data_inicio_programado)}</p></TableCell>
                  <TableCell><p className="text-sm">{item.fonte || "-"}</p>{item.linha_controle && <p className="text-xs text-slate-500">Linha {item.linha_controle}</p>}</TableCell>
                  <TableCell><div className="flex max-w-80 flex-wrap gap-1">{item.bloqueios.map((motivo) => <span key={motivo} className="rounded bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">{motivo.replaceAll("_", " ")}</span>)}</div>{item.erro_envio && <p className="mt-2 max-w-80 text-xs text-red-700">{item.erro_envio}</p>}</TableCell>
                  <TableCell><p className="text-sm font-medium">{item.resumo_os.id_plano_manutencao ? `Plano #${item.resumo_os.id_plano_manutencao}` : "Sem plano"}</p><p className="max-w-72 truncate text-xs text-slate-500" title={item.resumo_os.emissor || ""}>{item.resumo_os.emissor || "Sem emissor"}</p></TableCell>
                  <TableCell><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classeStatus(item.status_validacao)}`}>{rotuloStatus(item.status_validacao)}</span>{item.validado_por && <p className="mt-1 text-xs text-slate-500">{item.validado_por}</p>}</TableCell>
                  <TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => void abrirEditor(item.id_validacao)} disabled={item.status_validacao === "ENVIADA"}><Edit3 />Editar</Button>{item.status_validacao === "CONFIRMADA" && <Button size="sm" onClick={() => void enviar(item)}><Send />Enviar</Button>}{item.status_validacao === "REJEITADA" && <Button size="sm" variant="secondary" onClick={() => void reabrir(item)}>Reabrir</Button>}</div></TableCell>
                </TableRow>)}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-slate-600"><span>Página {lista.page} de {lista.total_pages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft />Anterior</Button><Button size="sm" variant="outline" disabled={page >= lista.total_pages} onClick={() => setPage((value) => value + 1)}>Próxima<ChevronRight /></Button></div></div>
        </CardContent>
      </Card>
    </div>

    {(detalhe || editorLoading) && <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-950/50 backdrop-blur-sm">
      <div className="h-full w-full max-w-5xl overflow-y-auto bg-slate-50 shadow-2xl">
        {editorLoading && !detalhe ? <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : detalhe && <>
          <div className="sticky top-0 z-10 border-b bg-white/95 px-5 py-4 backdrop-blur">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{detalhe.tipo_registro === "IMPORTAR" ? "Cadastrar nova OS" : `Atualizar OS ID ${detalhe.id_os_destino}`}</p><h2 className="text-xl font-bold text-slate-900">{dados.numero_os || detalhe.numero_os}</h2><div className="mt-2 flex flex-wrap gap-1">{detalhe.bloqueios.map((item) => <span key={item} className="rounded bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">{item.replaceAll("_", " ")}</span>)}</div></div><Button size="icon" variant="ghost" onClick={() => setDetalhe(null)}><X /></Button></div>
          </div>
          <div className="space-y-4 p-5">
            <Card className="border-blue-200 bg-blue-50/50"><CardContent className="grid gap-3 p-4 text-sm md:grid-cols-2"><div><span className="font-semibold text-slate-700">Arquivo de origem:</span><p className="break-all text-slate-600">{String(detalhe.contexto.arquivo_origem || "-")}</p></div><div><span className="font-semibold text-slate-700">Proposta:</span><p className="text-slate-600">{String(detalhe.contexto.plano_proposto || "Sem plano proposto")}</p><p className="text-xs text-slate-500">{String(detalhe.contexto.motivo_vinculo_ativo || detalhe.contexto.periodicidade_detectada || "")}</p></div></CardContent></Card>
            {GRUPOS_CAMPOS.map((grupo) => <Card key={grupo.titulo} className="border-slate-200 shadow-sm"><CardHeader className="border-b py-3"><CardTitle className="text-sm uppercase tracking-wide text-slate-700">{grupo.titulo}</CardTitle></CardHeader><CardContent className="grid gap-4 p-4 md:grid-cols-2">{grupo.campos.map(renderCampo)}</CardContent></Card>)}
            <Card className="border-slate-200 shadow-sm"><CardHeader className="border-b py-3"><CardTitle className="text-sm uppercase tracking-wide text-slate-700">Revisão</CardTitle></CardHeader><CardContent className="p-4"><label><span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Observação da validação</span><textarea value={observacao} onChange={(event) => setObservacao(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Registre a decisão, correção ou motivo da rejeição." /></label></CardContent></Card>
          </div>
          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-white/95 px-5 py-4 backdrop-blur"><div className="flex items-center gap-2 text-xs text-slate-500">{detalhe.status_validacao === "ERRO" ? <AlertTriangle className="text-red-600" /> : <ClipboardCheck className="text-blue-600" />}Estado atual: {rotuloStatus(detalhe.status_validacao)}</div><div className="flex flex-wrap justify-end gap-2"><Button variant="destructive" onClick={() => void salvar("rejeitar")} disabled={salvando}><XCircle />Rejeitar</Button><Button variant="outline" onClick={() => void salvar()} disabled={salvando}><Save />Salvar revisão</Button><Button onClick={() => void salvar("confirmar")} disabled={salvando}>{salvando ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}Salvar e confirmar</Button></div></div>
        </>}
      </div>
    </div>}
  </Container>;
}
