import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ListChecks } from "lucide-react";
import { toast } from "sonner";
import api from "../api/api";
import Container from "../components/Container";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

type OsPrevista = {
  id_plano_manutencao: number;
  id_ativo: number;
  id_subestacao: number;
  subestacao?: string | null;
  plano?: string | null;
  tipo_ativo?: string | null;
  ativo?: string | null;
  fase?: string | null;
  bay?: string | null;
  data_programada?: string | null;
  esquema_servicos?: string | null;
  responsavel?: string | null;
  substituto?: string | null;
  itens_plano?: { id_plano_item: number; nome_item?: string | null }[];
};

function chaveOs(os: OsPrevista) {
  return `${os.id_plano_manutencao}:${os.id_ativo}`;
}

function mensagemErro(error: unknown, fallback: string) {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

function formatarData(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "short",
  }).format(date);
}

function Marcador({ ordens, selecionadas, onChange, label, disabled }: {
  ordens: OsPrevista[];
  selecionadas: Set<string>;
  onChange: (ordens: OsPrevista[], checked: boolean) => void;
  label: string;
  disabled: boolean;
}) {
  const total = ordens.filter((os) => selecionadas.has(chaveOs(os))).length;
  const parcial = total > 0 && total < ordens.length;
  return <input type="checkbox" className="h-4 w-4 shrink-0 cursor-pointer accent-blue-600"
    aria-label={label} aria-checked={parcial ? "mixed" : total > 0}
    checked={ordens.length > 0 && total === ordens.length}
    ref={(element) => { if (element) element.indeterminate = parcial; }}
    disabled={disabled || !ordens.length}
    onChange={(event) => onChange(ordens, event.target.checked)} />;
}

export default function PlanoOsPrevistasPage() {
  const [params, setParams] = useSearchParams();
  const dataReferencia = params.get("data") ?? "";
  const [dataInput, setDataInput] = useState(dataReferencia);
  const [ordens, setOrdens] = useState<OsPrevista[]>([]);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [revisao, setRevisao] = useState(0);

  useEffect(() => {
    let ativo = true;
    setDataInput(dataReferencia);
    setOrdens([]);
    setSelecionadas(new Set());
    setErro("");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataReferencia)) {
      setLoading(false);
      if (dataReferencia) setErro("Informe uma data válida.");
      return;
    }
    setLoading(true);
    api.post("/os/gerar-os-planos", {
      data_simulacao: `${dataReferencia}T23:59:59`, simular: true,
    }).then(({ data }) => {
      if (ativo) setOrdens(data.os_previstas ?? []);
    }).catch((error: unknown) => {
      if (ativo) setErro(mensagemErro(error, "Erro ao carregar as OS previstas. Tente novamente."));
    }).finally(() => { if (ativo) setLoading(false); });
    return () => { ativo = false; };
  }, [dataReferencia, revisao]);

  const planos = useMemo(() => {
    const grupos = new Map<number, { id: number; nome: string; ordens: OsPrevista[];
      subestacoes: Map<number, { id: number; nome: string; ordens: OsPrevista[] }> }>();
    for (const os of ordens) {
      let plano = grupos.get(os.id_plano_manutencao);
      if (!plano) {
        plano = { id: os.id_plano_manutencao, nome: os.plano || `Plano #${os.id_plano_manutencao}`,
          ordens: [], subestacoes: new Map() };
        grupos.set(plano.id, plano);
      }
      plano.ordens.push(os);
      let subestacao = plano.subestacoes.get(os.id_subestacao);
      if (!subestacao) {
        subestacao = { id: os.id_subestacao, nome: os.subestacao || `Subestação #${os.id_subestacao}`, ordens: [] };
        plano.subestacoes.set(subestacao.id, subestacao);
      }
      subestacao.ordens.push(os);
    }
    return [...grupos.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [ordens]);

  function marcar(orders: OsPrevista[], checked: boolean) {
    setSelecionadas((previous) => {
      const next = new Set(previous);
      for (const os of orders) {
        if (checked) next.add(chaveOs(os)); else next.delete(chaveOs(os));
      }
      return next;
    });
  }

  function consultar(event: FormEvent) {
    event.preventDefault();
    if (!dataInput || gerando) return;
    setParams({ data: dataInput });
    if (dataInput === dataReferencia) setRevisao((value) => value + 1);
  }

  async function gerar() {
    const selection = ordens.filter((os) => selecionadas.has(chaveOs(os)));
    if (!selection.length || gerando || loading) return;
    setGerando(true);
    try {
      const { data } = await api.post("/os/gerar-os-planos", {
        data_simulacao: `${dataReferencia}T23:59:59`, simular: false,
        os_selecionadas: selection.map((os) => ({
          id_plano_manutencao: os.id_plano_manutencao, id_ativo: os.id_ativo,
        })),
      });
      const total = data.total_os ?? 0;
      toast.success(`Geração concluída: ${total} OS criada${total === 1 ? "" : "s"}.`);
      if (total < selection.length) toast.info("Algumas OS selecionadas já não estavam disponíveis para geração. A lista será atualizada.");
      setOrdens([]);
      setSelecionadas(new Set());
      setRevisao((value) => value + 1);
    } catch (error: unknown) {
      toast.error(mensagemErro(error, "Erro ao gerar as OS selecionadas."));
    } finally { setGerando(false); }
  }

  const bloqueado = loading || gerando;
  const count = (orders: OsPrevista[]) => orders.filter((os) => selecionadas.has(chaveOs(os))).length;
  return <Container>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <Button asChild variant="ghost" size="sm"><Link to="/planos-manutencao"><ArrowLeft size={16} />Voltar aos planos</Link></Button>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">OS previstas</h2>
        <p className="mt-1 text-sm text-slate-500">Selecione as OS que deseja gerar por plano e subestação.</p>
      </div>
      <form onSubmit={consultar} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Gerar para o dia
          <input type="date" required value={dataInput} disabled={gerando}
            onChange={(event) => setDataInput(event.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
        </label>
        <Button type="submit" variant="outline" disabled={bloqueado}><ListChecks size={16} />{loading ? "Consultando..." : "Consultar OS"}</Button>
      </form>
    </div>
    <div className="sticky top-16 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4 shadow-sm">
      <label className="flex items-center gap-3 text-sm font-medium">
        <Marcador ordens={ordens} selecionadas={selecionadas} onChange={marcar} label="Selecionar todas as OS" disabled={bloqueado} />
        Selecionar todas
      </label>
      <span role="status" className="text-sm text-slate-600">{selecionadas.size} de {ordens.length} OS selecionadas</span>
      <Button type="button" onClick={gerar} disabled={bloqueado || !selecionadas.size}>
        {gerando ? "Gerando..." : `Gerar OS selecionadas (${selecionadas.size})`}
      </Button>
    </div>
    {erro && <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</div>}
    {loading ? <p className="rounded-md border bg-white p-6 text-sm text-slate-500">Carregando OS previstas...</p>
      : !ordens.length && !erro ? <p className="rounded-md border bg-white p-6 text-sm text-slate-500">
        {dataReferencia ? "Nenhuma OS prevista para a data informada." : "Informe uma data para consultar as OS previstas."}
      </p> : null}
    <div className="space-y-5">
      {planos.map((plano) => <Card key={plano.id}>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-3">
              <Marcador ordens={plano.ordens} selecionadas={selecionadas} onChange={marcar} label={`Selecionar todas as OS do plano ${plano.nome}`} disabled={bloqueado} />
              <CardTitle className="text-base">Plano #{plano.id} — {plano.nome}</CardTitle>
            </label>
            <span className="text-sm text-slate-500">{count(plano.ordens)} de {plano.ordens.length} selecionadas</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...plano.subestacoes.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((subestacao) =>
            <section key={subestacao.id} className="overflow-hidden rounded-md border" aria-label={`Subestação ${subestacao.nome}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3">
                <label className="flex items-center gap-3 text-sm font-semibold">
                  <Marcador ordens={subestacao.ordens} selecionadas={selecionadas} onChange={marcar} label={`Selecionar todas as OS de ${subestacao.nome} no plano ${plano.nome}`} disabled={bloqueado} />
                  Subestação: {subestacao.nome}
                </label>
                <span className="text-xs text-slate-500">{count(subestacao.ordens)} de {subestacao.ordens.length} selecionadas</span>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-12">Marcar</TableHead><TableHead>Ativo</TableHead><TableHead>Tipo</TableHead>
                  <TableHead>Data programada</TableHead><TableHead>Esquema</TableHead><TableHead>Itens</TableHead><TableHead>Equipe</TableHead>
                </TableRow></TableHeader>
                <TableBody>{subestacao.ordens.map((os) => <TableRow key={chaveOs(os)} data-state={selecionadas.has(chaveOs(os)) ? "selected" : undefined}>
                  <TableCell><Marcador ordens={[os]} selecionadas={selecionadas} onChange={marcar} label={`Selecionar OS do ativo ${os.ativo ?? os.id_ativo}, ${os.fase ?? ""}, plano ${plano.nome}`} disabled={bloqueado} /></TableCell>
                  <TableCell><div className="font-medium">{os.ativo ?? "-"}</div><div className="text-xs text-slate-500">{[os.bay, os.fase].filter(Boolean).join(" / ") || "-"}</div></TableCell>
                  <TableCell>{os.tipo_ativo ?? "-"}</TableCell><TableCell>{formatarData(os.data_programada)}</TableCell>
                  <TableCell>{os.esquema_servicos ?? "-"}</TableCell>
                  <TableCell className="min-w-[200px] max-w-[340px] whitespace-normal">
                    <details><summary className="cursor-pointer text-sm text-blue-700">Ver itens ({os.itens_plano?.length ?? 0})</summary>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">{os.itens_plano?.map((item) => <li key={item.id_plano_item}>{item.nome_item ?? "-"}</li>)}</ul>
                    </details>
                  </TableCell>
                  <TableCell><div>{os.responsavel ?? "-"}</div><div className="text-xs text-slate-500">{os.substituto ?? "-"}</div></TableCell>
                </TableRow>)}</TableBody>
              </Table>
            </section>)}
        </CardContent>
      </Card>)}
    </div>
  </Container>;
}
