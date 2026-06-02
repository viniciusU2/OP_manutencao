import { useEffect, useMemo, useState } from "react";
import { Edit, RefreshCw, Search } from "lucide-react";
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
  const [somenteVencidas, setSomenteVencidas] = useState(false);
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

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return execucoes.filter((execucao) => {
      if (somenteVencidas && !isVencida(execucao)) return false;
      if (!termo) return true;

      return [
        execucao.codigo_ativo,
        execucao.nome_item,
        execucao.periodicidade,
        execucao.plano_descricao,
        execucao.instalacao,
        execucao.tipo_ativo,
        execucao.vao,
        execucao.fase,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(termo));
    });
  }, [busca, execucoes, somenteVencidas]);

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
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                className="pl-9"
                placeholder="Buscar por ativo, item, instalacao ou periodicidade..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={somenteVencidas}
                onChange={(event) => setSomenteVencidas(event.target.checked)}
              />
              Somente vencidas
            </label>
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
                          {[execucao.instalacao, execucao.vao]
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
                        <div>{execucao.periodicidade.replace("_", " ")}</div>
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
