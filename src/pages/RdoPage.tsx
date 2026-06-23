import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  History,
  ListChecks,
  Plus,
  RefreshCcw,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import Container from "../components/Container";
import { useAuth } from "../context/AuthContext";
import { OnlyAdmin } from "../components/onlyAdmin";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { canDelete } from "../lib/permissions";
import type { Rdo, RdoConfiguracaoSistema, RdoEvento, RdoHistorico } from "../types/Rdo";

type RdoForm = {
  data_rdo: string;
  titulo: string;
  codigo_procedimento: string;
  revisao: string;
  sistema: string;
  emissor: string;
  arquivo_pdf: string;
  status: string;
};

const rdoInicial: RdoForm = {
  data_rdo: new Date().toISOString().slice(0, 10),
  titulo: "RDO - RELATORIO DIARIO DA OPERACAO",
  codigo_procedimento: "PR-OP.COS.002",
  revisao: "00",
  sistema: "RIALMA V",
  emissor: "",
  arquivo_pdf: "",
  status: "RASCUNHO",
};

const configuracaoInicial: RdoConfiguracaoSistema = {
  periodo_inicio: "00:00",
  periodo_fim: "07:00",
  subestacao: "",
  equipamento: "",
  estado: "Ligada",
  ordem: 0,
};

const periodosConfiguracao = [
  { label: "00h00min às 07h00min", inicio: "00:00", fim: "07:00" },
  { label: "07h00min às 15h00min", inicio: "07:00", fim: "15:00" },
  { label: "15h00min às 23h59min", inicio: "15:00", fim: "23:59" },
];

const equipamentosConfiguracao = [
  { label: "LT 500kV 05C2", equipamento: "LT 500kV 05C2", subestacao: "", ordem: 1 },
  { label: "LT 500kV 05C4", equipamento: "LT 500kV 05C4", subestacao: "", ordem: 2 },
  { label: "SE GOR: Reator 05E6", equipamento: "SE GOR: Reator 05E6", subestacao: "GOR", ordem: 3 },
  { label: "SE GOR: Reator 05E7", equipamento: "SE GOR: Reator 05E7", subestacao: "GOR", ordem: 4 },
  { label: "SE GOR: Reator 05E8", equipamento: "SE GOR: Reator 05E8", subestacao: "GOR", ordem: 5 },
  { label: "SE GOR: Reator 05E9", equipamento: "SE GOR: Reator 05E9", subestacao: "GOR", ordem: 6 },
  { label: "SE BJD: Reator 05E8", equipamento: "SE BJD: Reator 05E8", subestacao: "BJD", ordem: 7 },
  { label: "SE BJD: Reator 05E9", equipamento: "SE BJD: Reator 05E9", subestacao: "BJD", ordem: 8 },
  { label: "SE BJD: Reator 05E10", equipamento: "SE BJD: Reator 05E10", subestacao: "BJD", ordem: 9 },
  { label: "SE BJD: Reator 05E11", equipamento: "SE BJD: Reator 05E11", subestacao: "BJD", ordem: 10 },
  { label: "SE BJD: Reator 05E12", equipamento: "SE BJD: Reator 05E12", subestacao: "BJD", ordem: 11 },
  { label: "SE BJD: Reator 05E13", equipamento: "SE BJD: Reator 05E13", subestacao: "BJD", ordem: 12 },
  { label: "SE JAB: Reator 9138", equipamento: "SE JAB: Reator 9138", subestacao: "JAB", ordem: 13 },
  { label: "SE JAB: Reator 9168", equipamento: "SE JAB: Reator 9168", subestacao: "JAB", ordem: 14 },
];

const estadosConfiguracao = ["Ligada", "Ligado", "Desligada", "Desligado"];

const tabelasRdo = [
  "Desligamento Automático",
  "Alarmes",
  "Intervenções",
  "Manobras para Conveniência Operativa",
  "Eventos em Sistemas de Comunicação de Voz e Dados",
  "Eventos no Centro de Operação",
  "Eventos para Atendimento a Terceiros",
  "Outros Temas",
  "Documentos Operativos Recebidos ou Alterados",
  "Ocorrências",
];

const eventoInicial: RdoEvento = {
  categoria: "Desligamento Automático",
  sistema: "RIALMA V",
  subestacao: "",
  hora_inicio: "",
  hora_fim: "",
  titulo: "",
  descricao: "",
  status_evento: "INFORMATIVO",
  ordem: 0,
};

const telasRdo = [
  { key: "consulta", label: "RDOs", icon: FileText },
  { key: "dados", label: "Dados gerais", icon: Save },
  { key: "configuracao", label: "Configuracao", icon: Settings2 },
  { key: "registros", label: "Registros", icon: ListChecks },
  { key: "resumo", label: "Resumo", icon: Eye },
] as const;

type TelaRdo = (typeof telasRdo)[number]["key"];

function normalizarHora(valor?: string | null) {
  return valor ? valor.slice(0, 5) : "";
}

function formatarData(valor?: string | null) {
  if (!valor) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${valor}T00:00:00`));
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

function badgeVariant(status: string) {
  if (status === "VALIDADO") return "default";
  if (status === "CANCELADO") return "destructive";
  return "secondary";
}

export default function RdoPage() {
  const { usuario } = useAuth();
  const podeAlterar = canDelete(usuario?.role);
  const [rdos, setRdos] = useState<Rdo[]>([]);
  const [selecionado, setSelecionado] = useState<Rdo | null>(null);
  const [historico, setHistorico] = useState<RdoHistorico[]>([]);
  const [form, setForm] = useState<RdoForm>(rdoInicial);
  const [configForm, setConfigForm] = useState<RdoConfiguracaoSistema>(configuracaoInicial);
  const [eventoForm, setEventoForm] = useState<RdoEvento>(eventoInicial);
  const [filtros, setFiltros] = useState({ data: "", sistema: "all", status: "all", busca: "" });
  const [telaAtiva, setTelaAtiva] = useState<TelaRdo>("consulta");
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [modalHistorico, setModalHistorico] = useState(false);

  const sistemas = useMemo(() => {
    const valores = new Set(rdos.map((rdo) => rdo.sistema).filter(Boolean));
    return Array.from(valores);
  }, [rdos]);

  const totaisSelecionado = useMemo(() => {
    const eventos = selecionado?.eventos ?? [];
    return {
      configuracoes: selecionado?.configuracoes?.length ?? 0,
      eventos: eventos.length,
      tabelas: new Set(eventos.map((evento) => evento.categoria)).size,
    };
  }, [selecionado]);

  async function carregarRdos() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filtros.data) params.data = filtros.data;
      if (filtros.sistema !== "all") params.sistema = filtros.sistema;
      if (filtros.status !== "all") params.status = filtros.status;
      if (filtros.busca.trim()) params.busca = filtros.busca.trim();

      const { data } = await api.get<Rdo[]>("/rdo/", { params });
      setRdos(data);
    } catch {
      toast.error("Erro ao carregar RDOs");
    } finally {
      setLoading(false);
    }
  }

  async function carregarDetalhe(id: number) {
    try {
      const { data } = await api.get<Rdo>(`/rdo/${id}`);
      setSelecionado(data);
      setTelaAtiva("dados");
      setForm({
        data_rdo: data.data_rdo,
        titulo: data.titulo,
        codigo_procedimento: data.codigo_procedimento,
        revisao: data.revisao,
        sistema: data.sistema,
        emissor: data.emissor,
        arquivo_pdf: data.arquivo_pdf ?? "",
        status: data.status,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Erro ao abrir RDO");
    }
  }

  async function carregarHistorico(id: number) {
    try {
      const { data } = await api.get<RdoHistorico[]>(`/rdo/${id}/historico`);
      setHistorico(data);
      setModalHistorico(true);
    } catch {
      toast.error("Erro ao carregar historico");
    }
  }

  useEffect(() => {
    void carregarRdos();
  }, []);

  async function salvarRdo() {
    if (!podeAlterar) return;
    if (!form.data_rdo || !form.emissor.trim()) {
      toast.error("Informe a data e o emissor do RDO");
      return;
    }

    setSalvando(true);
    const payload = {
      ...form,
      arquivo_pdf: form.arquivo_pdf.trim() || null,
    };

    try {
      if (selecionado) {
        const { data } = await api.put<Rdo>(`/rdo/${selecionado.id_rdo}`, payload);
        setSelecionado(data);
        toast.success("RDO atualizado");
      } else {
        const { data } = await api.post<Rdo>("/rdo/", {
          ...payload,
          configuracoes: [],
          eventos: [],
        });
        setSelecionado(data);
        setTelaAtiva("configuracao");
        toast.success("RDO criado");
      }

      await carregarRdos();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Erro ao salvar RDO");
    } finally {
      setSalvando(false);
    }
  }

  async function validarRdo() {
    if (!podeAlterar) return;
    if (!selecionado) return;

    try {
      const { data } = await api.post<Rdo>(`/rdo/${selecionado.id_rdo}/validar`);
      setSelecionado(data);
      setForm((prev) => ({ ...prev, status: data.status }));
      await carregarRdos();
      toast.success("RDO validado");
    } catch {
      toast.error("Erro ao validar RDO");
    }
  }

  async function exportarPdf() {
    if (!selecionado) return;

    try {
      const response = await api.get(`/rdo/${selecionado.id_rdo}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `RDO_COS_${selecionado.sistema}_${selecionado.data_rdo}.pdf`.replace(
        /[^A-Za-z0-9_.-]+/g,
        "_"
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Erro ao exportar PDF do RDO");
    }
  }

  async function excluirRdo() {
    if (!podeAlterar) return;
    if (!selecionado) return;

    const confirmar = window.confirm(
      `Deseja apagar o RDO #${selecionado.id_rdo}? Esta ação não pode ser desfeita.`
    );
    if (!confirmar) return;

    try {
      await api.delete(`/rdo/${selecionado.id_rdo}`);
      toast.success("RDO apagado");
      setSelecionado(null);
      setHistorico([]);
      setForm(rdoInicial);
      setConfigForm(configuracaoInicial);
      setEventoForm(eventoInicial);
      setTelaAtiva("consulta");
      await carregarRdos();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Erro ao apagar RDO");
    }
  }

  async function adicionarConfiguracao() {
    if (!podeAlterar) return;
    if (!selecionado || !configForm.equipamento.trim() || !configForm.estado.trim()) {
      toast.error("Selecione equipamento e estado");
      return;
    }

    try {
      await api.post(`/rdo/${selecionado.id_rdo}/configuracoes`, {
        ...configForm,
        subestacao: configForm.subestacao?.trim() || null,
        ordem: Number(configForm.ordem ?? 0),
      });
      setConfigForm(configuracaoInicial);
      await carregarDetalhe(selecionado.id_rdo);
      toast.success("Configuracao adicionada");
    } catch {
      toast.error("Erro ao adicionar configuracao");
    }
  }

  async function removerConfiguracao(id: number) {
    if (!podeAlterar) return;
    if (!selecionado) return;

    try {
      await api.delete(`/rdo/configuracoes/${id}`);
      await carregarDetalhe(selecionado.id_rdo);
      toast.success("Configuracao removida");
    } catch {
      toast.error("Erro ao remover configuracao");
    }
  }

  async function adicionarEvento() {
    if (!podeAlterar) return;
    if (!selecionado || !eventoForm.descricao.trim()) {
      toast.error("Informe a descricao do evento");
      return;
    }

    try {
      await api.post(`/rdo/${selecionado.id_rdo}/eventos`, {
        ...eventoForm,
        sistema: eventoForm.sistema?.trim() || null,
        subestacao: eventoForm.subestacao?.trim() || null,
        hora_inicio: eventoForm.hora_inicio || null,
        hora_fim: eventoForm.hora_fim || null,
        titulo: eventoForm.titulo?.trim() || null,
        ordem: Number(eventoForm.ordem ?? 0),
      });
      setEventoForm(eventoInicial);
      await carregarDetalhe(selecionado.id_rdo);
      toast.success("Evento adicionado");
    } catch {
      toast.error("Erro ao adicionar evento");
    }
  }

  async function removerEvento(id: number) {
    if (!podeAlterar) return;
    if (!selecionado) return;

    try {
      await api.delete(`/rdo/eventos/${id}`);
      await carregarDetalhe(selecionado.id_rdo);
      toast.success("Evento removido");
    } catch {
      toast.error("Erro ao remover evento");
    }
  }

  function novoRdo() {
    if (!podeAlterar) return;
    setSelecionado(null);
    setHistorico([]);
    setTelaAtiva("dados");
    setForm(rdoInicial);
    setConfigForm(configuracaoInicial);
    setEventoForm(eventoInicial);
  }

  return (
    <Container>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0 text-2xl font-semibold text-slate-900">RDO</h2>
            {selecionado && (
              <Badge variant={badgeVariant(form.status)}>{form.status}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {selecionado
              ? `${formatarData(form.data_rdo)} - ${form.sistema}`
              : "Selecione um RDO existente ou inicie um novo relatório diário."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {selecionado && (
            <>
              <Button type="button" variant="outline" onClick={exportarPdf}>
                <Download size={16} />
                Exportar PDF
              </Button>
              <OnlyAdmin>
                <Button type="button" variant="destructive" onClick={excluirRdo}>
                  <Trash2 size={16} />
                  Apagar
                </Button>
              </OnlyAdmin>
              {podeAlterar && (
                <Button type="button" variant="outline" onClick={validarRdo} disabled={form.status === "VALIDADO"}>
                  <CheckCircle2 size={16} />
                  Validar
                </Button>
              )}
            </>
          )}
          {podeAlterar && (
            <Button type="button" onClick={novoRdo}>
              <Plus size={16} />
              Novo RDO
            </Button>
          )}
        </div>
      </div>

      {selecionado && (
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Settings2 size={16} />
              Configurações
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {totaisSelecionado.configuracoes}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <FileText size={16} />
              Registros
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {totaisSelecionado.eventos}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <CalendarDays size={16} />
              Tabelas com dados
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {totaisSelecionado.tabelas}
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 overflow-x-auto rounded-lg border bg-white p-2">
        <div className="flex min-w-max gap-2">
          {telasRdo.map((tela) => {
            const Icon = tela.icon;
            const bloqueada = !selecionado && !["consulta", "dados"].includes(tela.key);
            const ativa = telaAtiva === tela.key;

            return (
              <button
                key={tela.key}
                type="button"
                disabled={bloqueada}
                onClick={() => setTelaAtiva(tela.key)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                  ativa
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                }`}
              >
                <Icon size={16} />
                {tela.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className={telaAtiva === "consulta" ? "space-y-4" : "hidden"}>
          <Card className="rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle>Consulta</CardTitle>
              <CardDescription>Filtre e abra relatórios anteriores.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Data
                  <Input
                    type="date"
                    value={filtros.data}
                    onChange={(event) => setFiltros((prev) => ({ ...prev, data: event.target.value }))}
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Status
                  <select
                    value={filtros.status}
                    onChange={(event) => setFiltros((prev) => ({ ...prev, status: event.target.value }))}
                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="RASCUNHO">Em elaboração</option>
                    <option value="IMPORTADO">Importado</option>
                    <option value="VALIDADO">Validado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Sistema
                  <select
                    value={filtros.sistema}
                    onChange={(event) => setFiltros((prev) => ({ ...prev, sistema: event.target.value }))}
                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="all">Todos</option>
                    {sistemas.map((sistema) => (
                      <option key={sistema} value={sistema}>
                        {sistema}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Busca
                  <Input
                    value={filtros.busca}
                    onChange={(event) => setFiltros((prev) => ({ ...prev, busca: event.target.value }))}
                    placeholder="Emissor, titulo ou procedimento"
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setFiltros({ data: "", sistema: "all", status: "all", busca: "" })}>
                  Limpar
                </Button>
                <Button type="button" variant="outline" onClick={carregarRdos} disabled={loading}>
                  <RefreshCcw size={16} />
                  {loading ? "Carregando..." : "Filtrar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>{rdos.length} registro{rdos.length === 1 ? "" : "s"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Sistema</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Emissor</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rdos.map((rdo) => (
                      <TableRow
                        key={rdo.id_rdo}
                        className={selecionado?.id_rdo === rdo.id_rdo ? "bg-blue-50" : ""}
                      >
                        <TableCell>
                          <div className="font-medium">{formatarData(rdo.data_rdo)}</div>
                          <div className="text-xs text-slate-500">#{rdo.id_rdo}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{rdo.sistema}</div>
                          <div className="max-w-[180px] truncate text-xs text-slate-500">{rdo.titulo}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badgeVariant(rdo.status)}>{rdo.status}</Badge>
                        </TableCell>
                        <TableCell>{rdo.emissor}</TableCell>
                        <TableCell className="text-right">
                          <Button type="button" size="sm" variant="outline" onClick={() => carregarDetalhe(rdo.id_rdo)}>
                            <Eye size={15} />
                            Abrir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!rdos.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                          Nenhum RDO encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={telaAtiva === "dados" ? "space-y-4" : "hidden"}>
          <Card className="rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle>{selecionado ? `RDO #${selecionado.id_rdo}` : "Novo RDO"}</CardTitle>
              <CardDescription>Identificação e controle do relatório.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Data
                  <Input disabled={!podeAlterar} type="date" value={form.data_rdo} onChange={(event) => setForm((prev) => ({ ...prev, data_rdo: event.target.value }))} />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Sistema
                  <Input disabled={!podeAlterar} value={form.sistema} onChange={(event) => setForm((prev) => ({ ...prev, sistema: event.target.value }))} />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">
                  Titulo
                  <Input disabled={!podeAlterar} value={form.titulo} onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))} />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Procedimento
                  <Input disabled={!podeAlterar} value={form.codigo_procedimento} onChange={(event) => setForm((prev) => ({ ...prev, codigo_procedimento: event.target.value }))} />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Revisao
                  <Input disabled={!podeAlterar} value={form.revisao} onChange={(event) => setForm((prev) => ({ ...prev, revisao: event.target.value }))} />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Emissor
                  <Input disabled={!podeAlterar} value={form.emissor} onChange={(event) => setForm((prev) => ({ ...prev, emissor: event.target.value }))} />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Status
                  <select
                    value={form.status}
                    disabled={!podeAlterar}
                    onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="RASCUNHO">Em elaboração</option>
                    <option value="IMPORTADO">Importado</option>
                    <option value="VALIDADO">Validado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">
                  Arquivo PDF
                  <Input disabled={!podeAlterar} value={form.arquivo_pdf} onChange={(event) => setForm((prev) => ({ ...prev, arquivo_pdf: event.target.value }))} placeholder="Nome ou caminho do PDF importado" />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {selecionado && (
                  <Button type="button" variant="outline" onClick={() => carregarHistorico(selecionado.id_rdo)}>
                    <History size={16} />
                    Historico
                  </Button>
                )}
                {podeAlterar && (
                  <Button type="button" onClick={salvarRdo} disabled={salvando}>
                    <Save size={16} />
                    {salvando ? "Salvando..." : "Salvar"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {!selecionado && (
            <div className="rounded-lg border border-dashed bg-slate-50 p-6 text-center text-sm text-slate-500">
              Salve os dados gerais para liberar as telas de configuracao,
              registros e resumo do RDO.
            </div>
          )}
        </div>

        {selecionado && telaAtiva === "configuracao" && (
              <Card className="rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle>Configuracao do sistema</CardTitle>
                  <CardDescription>Estados operacionais por periodo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-6">
                    <label className="grid gap-1 text-xs font-medium text-slate-600 md:col-span-2">
                      Período
                      <select
                        disabled={!podeAlterar}
                        value={`${configForm.periodo_inicio}-${configForm.periodo_fim}`}
                        onChange={(event) => {
                          const periodo = periodosConfiguracao.find((item) => `${item.inicio}-${item.fim}` === event.target.value);
                          if (!periodo) return;
                          setConfigForm((prev) => ({
                            ...prev,
                            periodo_inicio: periodo.inicio,
                            periodo_fim: periodo.fim,
                          }));
                        }}
                        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                      >
                        {periodosConfiguracao.map((periodo) => (
                          <option key={periodo.label} value={`${periodo.inicio}-${periodo.fim}`}>
                            {periodo.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-slate-600 md:col-span-2">
                      Equipamento
                      <select
                        disabled={!podeAlterar}
                        value={configForm.equipamento}
                        onChange={(event) => {
                          const equipamento = equipamentosConfiguracao.find((item) => item.equipamento === event.target.value);
                          setConfigForm((prev) => ({
                            ...prev,
                            equipamento: event.target.value,
                            subestacao: equipamento?.subestacao ?? "",
                            ordem: equipamento?.ordem ?? prev.ordem,
                          }));
                        }}
                        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                      >
                        <option value="">Selecione</option>
                        {equipamentosConfiguracao.map((item) => (
                          <option key={item.equipamento} value={item.equipamento}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-slate-600">
                      Estado
                      <select
                        disabled={!podeAlterar}
                        value={configForm.estado}
                        onChange={(event) => setConfigForm((prev) => ({ ...prev, estado: event.target.value }))}
                        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                      >
                        {estadosConfiguracao.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-slate-600">
                      Ordem
                      <Input
                        disabled={!podeAlterar}
                        type="number"
                        value={configForm.ordem ?? 0}
                        onChange={(event) => setConfigForm((prev) => ({ ...prev, ordem: Number(event.target.value) }))}
                      />
                    </label>
                  </div>
                  {podeAlterar && (
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" onClick={adicionarConfiguracao}>
                        <Plus size={16} />
                        Adicionar
                      </Button>
                    </div>
                  )}
                  <TabelaConfiguracoes configuracoes={selecionado.configuracoes ?? []} onRemove={removerConfiguracao} canRemove={podeAlterar} />
                </CardContent>
              </Card>
        )}

        {selecionado && telaAtiva === "registros" && (
              <Card className="rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle>Tabelas do RDO</CardTitle>
                  <CardDescription>Registros por tabela operacional do relatorio.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {tabelasRdo.map((tabela) => {
                      const total = selecionado.eventos?.filter((evento) => evento.categoria === tabela).length ?? 0;
                      const active = eventoForm.categoria === tabela;
                      return (
                        <button
                          key={tabela}
                          type="button"
                          onClick={() => setEventoForm((prev) => ({ ...prev, categoria: tabela }))}
                          className={`shrink-0 rounded-md border px-3 py-2 text-left text-xs font-medium ${
                            active
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <span className="block max-w-[210px] truncate">{tabela}</span>
                          <span className="text-[11px] text-slate-500">{total} registro{total === 1 ? "" : "s"}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <select
                      disabled={!podeAlterar}
                      value={eventoForm.categoria}
                      onChange={(event) => setEventoForm((prev) => ({ ...prev, categoria: event.target.value }))}
                      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm md:col-span-2"
                    >
                      {tabelasRdo.map((tabela) => (
                        <option key={tabela} value={tabela}>
                          {tabela}
                        </option>
                      ))}
                    </select>
                    <Input disabled={!podeAlterar} value={eventoForm.sistema ?? ""} onChange={(event) => setEventoForm((prev) => ({ ...prev, sistema: event.target.value }))} placeholder="Sistema" />
                    <Input disabled={!podeAlterar} value={eventoForm.subestacao ?? ""} onChange={(event) => setEventoForm((prev) => ({ ...prev, subestacao: event.target.value }))} placeholder="SE" />
                    <Input disabled={!podeAlterar} value={eventoForm.status_evento ?? ""} onChange={(event) => setEventoForm((prev) => ({ ...prev, status_evento: event.target.value }))} placeholder="Status" />
                    <Input disabled={!podeAlterar} type="time" value={eventoForm.hora_inicio ?? ""} onChange={(event) => setEventoForm((prev) => ({ ...prev, hora_inicio: event.target.value }))} />
                    <Input disabled={!podeAlterar} type="time" value={eventoForm.hora_fim ?? ""} onChange={(event) => setEventoForm((prev) => ({ ...prev, hora_fim: event.target.value }))} />
                    <Input disabled={!podeAlterar} className="md:col-span-2" value={eventoForm.titulo ?? ""} onChange={(event) => setEventoForm((prev) => ({ ...prev, titulo: event.target.value }))} placeholder="Titulo" />
                    <Textarea disabled={!podeAlterar} className="md:col-span-4" value={eventoForm.descricao} onChange={(event) => setEventoForm((prev) => ({ ...prev, descricao: event.target.value }))} placeholder="Descricao do evento" />
                  </div>
                  {podeAlterar && (
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" onClick={adicionarEvento}>
                        <Plus size={16} />
                        Adicionar registro
                      </Button>
                    </div>
                  )}
                  <TabelaEventos eventos={selecionado.eventos ?? []} onRemove={removerEvento} canRemove={podeAlterar} />
                </CardContent>
              </Card>
        )}

        {selecionado && telaAtiva === "resumo" && (
          <div className="space-y-4">
            <Card className="rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle>Resumo do RDO</CardTitle>
                <CardDescription>
                  Conferencia final antes de validar ou exportar o PDF.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border bg-slate-50 p-4">
                    <div className="text-xs font-medium uppercase text-slate-500">Data</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{formatarData(form.data_rdo)}</div>
                  </div>
                  <div className="rounded-md border bg-slate-50 p-4">
                    <div className="text-xs font-medium uppercase text-slate-500">Sistema</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{form.sistema || "-"}</div>
                  </div>
                  <div className="rounded-md border bg-slate-50 p-4">
                    <div className="text-xs font-medium uppercase text-slate-500">Emissor</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{form.emissor || "-"}</div>
                  </div>
                  <div className="rounded-md border bg-slate-50 p-4">
                    <div className="text-xs font-medium uppercase text-slate-500">Status</div>
                    <div className="mt-1">
                      <Badge variant={badgeVariant(form.status)}>{form.status}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle>Configuracao do sistema</CardTitle>
                <CardDescription>{totaisSelecionado.configuracoes} registro{totaisSelecionado.configuracoes === 1 ? "" : "s"}</CardDescription>
              </CardHeader>
              <CardContent>
                <TabelaConfiguracoes configuracoes={selecionado.configuracoes ?? []} onRemove={removerConfiguracao} canRemove={podeAlterar} />
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle>Tabelas do RDO</CardTitle>
                <CardDescription>{totaisSelecionado.eventos} registro{totaisSelecionado.eventos === 1 ? "" : "s"}</CardDescription>
              </CardHeader>
              <CardContent>
                <TabelaEventos eventos={selecionado.eventos ?? []} onRemove={removerEvento} canRemove={podeAlterar} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={modalHistorico} onOpenChange={setModalHistorico}>
        <DialogContent className="max-h-[86vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Historico do RDO</DialogTitle>
          </DialogHeader>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Acao</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Observacao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((item) => (
                  <TableRow key={item.id_historico}>
                    <TableCell>{formatarDataHora(item.criado_em)}</TableCell>
                    <TableCell>{item.acao}</TableCell>
                    <TableCell>{item.campo_alterado ?? "-"}</TableCell>
                    <TableCell>{item.observacao ?? item.valor_novo ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

function TabelaConfiguracoes({
  configuracoes,
  onRemove,
  canRemove = true,
}: {
  configuracoes: RdoConfiguracaoSistema[];
  onRemove: (id: number) => void;
  canRemove?: boolean;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Periodo</TableHead>
            <TableHead>Subestacao</TableHead>
            <TableHead>Equipamento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {configuracoes.map((item) => (
            <TableRow key={item.id_configuracao}>
              <TableCell>{normalizarHora(item.periodo_inicio)} - {normalizarHora(item.periodo_fim)}</TableCell>
              <TableCell>{item.subestacao || "-"}</TableCell>
              <TableCell>{item.equipamento}</TableCell>
              <TableCell>{item.estado}</TableCell>
              <TableCell className="text-right">
                {canRemove && item.id_configuracao && (
                  <Button type="button" size="sm" variant="outline" onClick={() => onRemove(item.id_configuracao!)}>
                    <Trash2 size={15} />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!configuracoes.length && (
            <TableRow>
              <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                Nenhuma configuracao adicionada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function TabelaEventos({
  eventos,
  onRemove,
  canRemove = true,
}: {
  eventos: RdoEvento[];
  onRemove: (id: number) => void;
  canRemove?: boolean;
}) {
  const eventosPorTabela = tabelasRdo
    .map((tabela) => ({
      tabela,
      eventos: eventos.filter((evento) => evento.categoria === tabela),
    }))
    .filter((grupo) => grupo.eventos.length > 0);

  return (
    <div className="space-y-3">
      {!eventos.length && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-slate-500">
          Nenhum registro adicionado.
        </div>
      )}

      {eventosPorTabela.map((grupo) => (
        <div key={grupo.tabela} className="rounded-md border bg-white">
          <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
            <div className="font-medium text-slate-900">{grupo.tabela}</div>
            <Badge variant="secondary">
              {grupo.eventos.length} registro{grupo.eventos.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Horario</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {grupo.eventos.map((item) => (
                <TableRow key={item.id_evento}>
                  <TableCell>
                    <div className="font-medium">{normalizarHora(item.hora_inicio) || "-"}</div>
                    {item.hora_fim && (
                      <div className="text-xs text-slate-500">até {normalizarHora(item.hora_fim)}</div>
                    )}
                    <div className="mt-1 text-xs text-slate-500">
                      {[item.sistema, item.subestacao].filter(Boolean).join(" / ") || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[420px] whitespace-normal">
                    <div className="font-medium">{item.titulo ?? "-"}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.descricao}</div>
                  </TableCell>
                  <TableCell>{item.status_evento ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {canRemove && item.id_evento && (
                      <Button type="button" size="sm" variant="outline" onClick={() => onRemove(item.id_evento!)}>
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
