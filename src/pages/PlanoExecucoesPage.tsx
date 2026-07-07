import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import Container from "../components/Container";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import type {
  PlanoExecucaoPlanilha,
  PlanoExecucaoUpdate,
} from "../types/planoManutencao";

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function toApiDate(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function isVencida(execucao: PlanoExecucaoPlanilha) {
  return new Date(execucao.proxima_execucao).getTime() < Date.now();
}

function normalizeFilterValue(value?: string | null) {
  const text = value?.trim();
  return text || "";
}

function formatPeriodicidade(value?: string | null) {
  return value ? value.replace("_", " ") : "-";
}

function isInsideDateRange(value: string, inicio: string, fim: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  if (inicio) {
    const start = new Date(`${inicio}T00:00:00`);
    if (date.getTime() < start.getTime()) return false;
  }

  if (fim) {
    const end = new Date(`${fim}T23:59:59`);
    if (date.getTime() > end.getTime()) return false;
  }

  return true;
}

function uniqueOptions(
  execucoes: PlanoExecucaoPlanilha[],
  getter: (execucao: PlanoExecucaoPlanilha) => string | null | undefined
) {
  return Array.from(
    new Set(
      execucoes
        .map((execucao) => normalizeFilterValue(getter(execucao)))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function resumo(value?: string | null) {
  const text = value?.trim();
  if (!text) return "-";

  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

export default function PlanoExecucoesPage() {
  const [execucoes, setExecucoes] = useState<PlanoExecucaoPlanilha[]>([]);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState({
    status: "todos",
    instalacao: "todos",
    tipo_ativo: "todos",
    periodicidade: "todos",
    fase: "todos",
    bay: "todos",
    ultima_execucao: "todos",
    proxima_inicio: "",
    proxima_fim: "",
  });
  const [selected, setSelected] = useState<PlanoExecucaoPlanilha | null>(null);
  const [form, setForm] = useState({
    ultima_execucao: "",
    proxima_execucao: "",
  });

  async function carregarExecucoes() {
    setLoading(true);

    try {
      const { data } = await api.get<PlanoExecucaoPlanilha[]>(
        "/planos-manutencao/execucoes"
      );
      setExecucoes(data);
    } catch {
      toast.error("Erro ao carregar plano de execucao");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarExecucoes();
  }, []);

  const opcoes = useMemo(
    () => ({
      instalacoes: uniqueOptions(execucoes, (execucao) => execucao.instalacao),
      tiposAtivo: uniqueOptions(execucoes, (execucao) => execucao.tipo_ativo),
      periodicidades: uniqueOptions(
        execucoes,
        (execucao) => execucao.periodicidade
      ),
      fases: uniqueOptions(execucoes, (execucao) => execucao.fase),
      bays: uniqueOptions(execucoes, (execucao) => execucao.bay),
    }),
    [execucoes]
  );

  const indicadores = useMemo(() => {
    const vencidas = execucoes.filter(isVencida).length;
    const semUltimaExecucao = execucoes.filter(
      (execucao) => !execucao.ultima_execucao
    ).length;

    return {
      total: execucoes.length,
      vencidas,
      programadas: execucoes.length - vencidas,
      semUltimaExecucao,
    };
  }, [execucoes]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return execucoes.filter((execucao) => {
      const vencida = isVencida(execucao);

      if (filtros.status === "vencidas" && !vencida) return false;
      if (filtros.status === "programadas" && vencida) return false;
      if (
        filtros.instalacao !== "todos" &&
        normalizeFilterValue(execucao.instalacao) !== filtros.instalacao
      ) {
        return false;
      }
      if (
        filtros.tipo_ativo !== "todos" &&
        normalizeFilterValue(execucao.tipo_ativo) !== filtros.tipo_ativo
      ) {
        return false;
      }
      if (
        filtros.periodicidade !== "todos" &&
        execucao.periodicidade !== filtros.periodicidade
      ) {
        return false;
      }
      if (
        filtros.fase !== "todos" &&
        normalizeFilterValue(execucao.fase) !== filtros.fase
      ) {
        return false;
      }
      if (
        filtros.bay !== "todos" &&
        normalizeFilterValue(execucao.bay) !== filtros.bay
      ) {
        return false;
      }
      if (filtros.ultima_execucao === "com" && !execucao.ultima_execucao) {
        return false;
      }
      if (filtros.ultima_execucao === "sem" && execucao.ultima_execucao) {
        return false;
      }
      if (
        (filtros.proxima_inicio || filtros.proxima_fim) &&
        !isInsideDateRange(
          execucao.proxima_execucao,
          filtros.proxima_inicio,
          filtros.proxima_fim
        )
      ) {
        return false;
      }

      if (!termo) return true;

      return [
        execucao.codigo_ativo,
        execucao.nome_item,
        execucao.periodicidade,
        execucao.plano_descricao,
        execucao.instalacao,
        execucao.tipo_ativo,
        execucao.bay,
        execucao.fase,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(termo));
    });
  }, [busca, execucoes, filtros]);

  function updateFiltro(name: keyof typeof filtros, value: string) {
    setFiltros((current) => ({ ...current, [name]: value }));
  }

  function limparFiltros() {
    setBusca("");
    setFiltros({
      status: "todos",
      instalacao: "todos",
      tipo_ativo: "todos",
      periodicidade: "todos",
      fase: "todos",
      bay: "todos",
      ultima_execucao: "todos",
      proxima_inicio: "",
      proxima_fim: "",
    });
  }

  function abrirEdicao(execucao: PlanoExecucaoPlanilha) {
    setSelected(execucao);
    setForm({
      ultima_execucao: toDateTimeLocal(execucao.ultima_execucao),
      proxima_execucao: toDateTimeLocal(execucao.proxima_execucao),
    });
  }

  async function sincronizarExecucoes() {
    setSincronizando(true);

    try {
      const { data } = await api.post<{ total_criadas: number }>(
        "/planos-manutencao/execucoes/sincronizar"
      );
      toast.success(`${data.total_criadas} execucao${data.total_criadas === 1 ? "" : "es"} criada${data.total_criadas === 1 ? "" : "s"}.`);
      await carregarExecucoes();
    } catch {
      toast.error("Erro ao sincronizar execucoes");
    } finally {
      setSincronizando(false);
    }
  }

  async function salvarExecucao() {
    if (!selected) return;

    if (!form.proxima_execucao) {
      toast.error("Informe a proxima execucao.");
      return;
    }

    setSaving(true);

    const payload: PlanoExecucaoUpdate = {
      ultima_execucao: toApiDate(form.ultima_execucao),
      proxima_execucao: new Date(form.proxima_execucao).toISOString(),
    };

    try {
      const { data } = await api.put<PlanoExecucaoPlanilha>(
        `/planos-manutencao/execucoes/${selected.id_execucao}`,
        payload
      );

      setExecucoes((current) =>
        current.map((item) =>
          item.id_execucao === data.id_execucao ? data : item
        )
      );
      setSelected(null);
      toast.success("Execucao atualizada com sucesso");
    } catch {
      toast.error("Erro ao atualizar execucao");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-2xl font-semibold text-slate-900">
            Plano de Execucao
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? "Carregando execucoes..."
              : `${filtradas.length} de ${execucoes.length} execucoes`}
          </p>
        </div>

        <Button
          type="button"
          onClick={sincronizarExecucoes}
          disabled={sincronizando}
        >
          <RefreshCw size={16} />
          {sincronizando ? "Sincronizando..." : "Sincronizar"}
        </Button>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Execucoes dos planos</CardTitle>
          <CardDescription>
            Ajuste as datas que controlam a geracao automatica das OS preventivas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Total</span>
                <ClipboardList className="h-4 w-4 text-slate-500" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {indicadores.total}
              </div>
            </div>

            <div className="rounded-lg border bg-red-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-red-700">Vencidas</span>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-red-700">
                {indicadores.vencidas}
              </div>
            </div>

            <div className="rounded-lg border bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-emerald-700">Programadas</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-emerald-700">
                {indicadores.programadas}
              </div>
            </div>

            <div className="rounded-lg border bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-amber-700">Sem ultima execucao</span>
                <CalendarDays className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-amber-700">
                {indicadores.semUltimaExecucao}
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-lg border bg-white p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.4fr)_repeat(3,minmax(160px,1fr))]">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Busca
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    className="pl-9"
                    placeholder="Ativo, item, plano, instalacao..."
                  />
                </div>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Status
                <select
                  value={filtros.status}
                  onChange={(event) => updateFiltro("status", event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="vencidas">Vencidas</option>
                  <option value="programadas">Programadas</option>
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Instalacao
                <select
                  value={filtros.instalacao}
                  onChange={(event) =>
                    updateFiltro("instalacao", event.target.value)
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="todos">Todas</option>
                  {opcoes.instalacoes.map((instalacao) => (
                    <option key={instalacao} value={instalacao}>
                      {instalacao}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Tipo equipamento
                <select
                  value={filtros.tipo_ativo}
                  onChange={(event) =>
                    updateFiltro("tipo_ativo", event.target.value)
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="todos">Todos</option>
                  {opcoes.tiposAtivo.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Periodicidade
                <select
                  value={filtros.periodicidade}
                  onChange={(event) =>
                    updateFiltro("periodicidade", event.target.value)
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="todos">Todas</option>
                  {opcoes.periodicidades.map((periodicidade) => (
                    <option key={periodicidade} value={periodicidade}>
                      {formatPeriodicidade(periodicidade)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Fase
                <select
                  value={filtros.fase}
                  onChange={(event) => updateFiltro("fase", event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="todos">Todas</option>
                  {opcoes.fases.map((fase) => (
                    <option key={fase} value={fase}>
                      {fase}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Bay
                <select
                  value={filtros.bay}
                  onChange={(event) => updateFiltro("bay", event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="todos">Todos</option>
                  {opcoes.bays.map((bay) => (
                    <option key={bay} value={bay}>
                      {bay}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Ultima execucao
                <select
                  value={filtros.ultima_execucao}
                  onChange={(event) =>
                    updateFiltro("ultima_execucao", event.target.value)
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="todos">Todas</option>
                  <option value="com">Com ultima</option>
                  <option value="sem">Sem ultima</option>
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Proxima de
                <Input
                  type="date"
                  value={filtros.proxima_inicio}
                  onChange={(event) =>
                    updateFiltro("proxima_inicio", event.target.value)
                  }
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Proxima ate
                <Input
                  type="date"
                  value={filtros.proxima_fim}
                  onChange={(event) =>
                    updateFiltro("proxima_fim", event.target.value)
                  }
                />
              </label>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={limparFiltros}
                >
                  <RotateCcw size={16} />
                  Limpar
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Tipo equipamento</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Periodicidade</TableHead>
                  <TableHead>Ultima execucao</TableHead>
                  <TableHead>Proxima execucao</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-sm text-slate-500">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filtradas.length ? (
                  filtradas.map((execucao) => (
                    <TableRow key={execucao.id_execucao}>
                      <TableCell>
                        {isVencida(execucao) ? (
                          <Badge variant="destructive">Vencida</Badge>
                        ) : (
                          <Badge variant="secondary">Programada</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{execucao.codigo_ativo}</div>
                        <div className="text-xs text-slate-500">
                          {[execucao.instalacao, execucao.bay]
                            .filter(Boolean)
                            .join(" | ") || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{execucao.tipo_ativo ?? "-"}</TableCell>
                      <TableCell>{execucao.fase ?? "-"}</TableCell>
                      <TableCell>
                        <div className="font-medium">{execucao.nome_item}</div>
                      </TableCell>
                      <TableCell className="max-w-[260px] whitespace-normal">
                        {resumo(execucao.plano_descricao)}
                      </TableCell>
                      <TableCell>
                        <div>{formatPeriodicidade(execucao.periodicidade)}</div>
                        <div className="text-xs text-slate-500">
                          Intervalo {execucao.intervalo} | Antecedencia {execucao.antecedencia}d
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(execucao.ultima_execucao)}</TableCell>
                      <TableCell>{formatDateTime(execucao.proxima_execucao)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => abrirEdicao(execucao)}
                        >
                          <Edit size={16} />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-sm text-slate-500">
                      Nenhuma execucao encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar execucao</DialogTitle>
            <DialogDescription>
              {selected?.codigo_ativo} - {selected?.nome_item}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              Ultima execucao
              <Input
                type="datetime-local"
                value={form.ultima_execucao}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ultima_execucao: event.target.value,
                  }))
                }
              />
            </label>

            <label className="grid gap-2 text-sm">
              Proxima execucao
              <Input
                type="datetime-local"
                value={form.proxima_execucao}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    proxima_execucao: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelected(null)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={salvarExecucao} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
