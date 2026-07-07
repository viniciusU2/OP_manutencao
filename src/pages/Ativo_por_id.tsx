import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Gauge,
  ImageIcon,
  Layers,
  PenLine,
  Wrench,
} from "lucide-react";

import api from "../api/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import type { Ativo } from "../types/Ativo";
import type { SI } from "../types/SI";
import type { SS } from "../types/SS";
import { OsAtivoTable } from "./OsAtivoTable";

interface Inspecao {
  id_inspecao: number;
  data_inspecao: string;
  data_proxima_inspecao?: string | null;
  periodicidade: string;
  status_geral: string;
  responsavel?: string | null;
  observacao_geral?: string | null;
}

interface FotoInspecao {
  url: string;
  id_inspecao: number;
  data_inspecao: string;
  item?: string | null;
  status?: string | null;
}

const PAGE_SIZE = 5;

type PanelKey = "os" | "inspecoes" | "ss" | "si";

function getFaseBadge(fase?: string) {
  switch ((fase ?? "").toUpperCase()) {
    case "VM":
      return <Badge className="bg-red-100 text-red-800">VM</Badge>;
    case "AZ":
      return <Badge className="bg-blue-100 text-blue-800">AZ</Badge>;
    case "BR":
      return <Badge className="bg-gray-100 text-gray-800">BR</Badge>;
    default:
      return <Badge variant="outline">{fase || "-"}</Badge>;
  }
}

function getStatusBadge(status?: string) {
  const normalized = (status ?? "").toUpperCase();

  if (["OK", "CONCLUIDA", "ENCERRADA", "ATENDIDA", "ATIVO"].includes(normalized)) {
    return <Badge className="bg-green-100 text-green-800">{status || "OK"}</Badge>;
  }

  if (["NOK", "ABERTA", "PENDENTE", "INATIVO"].includes(normalized)) {
    return <Badge className="bg-red-100 text-red-800">{status || "NOK"}</Badge>;
  }

  if (["PROGRAMADA", "EM ANDAMENTO"].includes(normalized)) {
    return <Badge className="bg-amber-100 text-amber-800">{status}</Badge>;
  }

  return <Badge variant="outline">{status || "-"}</Badge>;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR");
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value) => value && value.trim()) ?? null;
}

function getAtivoImage(ativo: Ativo) {
  return firstText(ativo.foto_url, ativo.imagem_url, ativo.foto, ativo.imagem);
}

function normalizePhotoUrl(url?: string | null) {
  const value = url?.trim();
  if (!value) return "";

  if (/^(data:image\/|blob:)/i.test(value)) return value;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("sharepoint.com") || host.includes("onedrive.live.com")) {
      parsed.searchParams.set("download", "1");
      return parsed.toString();
    }

    return value;
  } catch {
    return value;
  }
}

function getTipoAtivo(ativo: Ativo) {
  const tipo = (ativo as Ativo & { tipo_ativo?: string | { nome?: string | null } | null }).tipo_ativo;

  if (typeof tipo === "string") return tipo;
  if (tipo?.nome) return tipo.nome;

  return ativo.id_tipo_ativo ? `Tipo ${ativo.id_tipo_ativo}` : "-";
}

function sortByDateDesc<T>(items: T[], pickDate: (item: T) => string | null | undefined) {
  return [...items].sort((a, b) => {
    const dateA = new Date(pickDate(a) ?? "").getTime() || 0;
    const dateB = new Date(pickDate(b) ?? "").getTime() || 0;
    return dateB - dateA;
  });
}

function paginateItems<T>(items: T[], page: number) {
  const start = page * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}

export function AtivoDetalhe() {
  const { id } = useParams<{ id: string }>();

  const [ativo, setAtivo] = useState<Ativo | null>(null);
  const [inspecoes, setInspecoes] = useState<Inspecao[]>([]);
  const [fotosInspecao, setFotosInspecao] = useState<FotoInspecao[]>([]);
  const [solicitacoesServico, setSolicitacoesServico] = useState<SS[]>([]);
  const [solicitacoesIntervencao, setSolicitacoesIntervencao] = useState<SI[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspecoesPage, setInspecoesPage] = useState(0);
  const [ssPage, setSsPage] = useState(0);
  const [siPage, setSiPage] = useState(0);
  const [activePanel, setActivePanel] = useState<PanelKey>("os");
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [photoLoadErrors, setPhotoLoadErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setFotosInspecao([]);
    setPhotoLoadErrors({});

    Promise.allSettled([
      api.get(`/ativo/${id}`),
      api.get(`/inspecoes/ativo/${id}`),
      api.get("/ss"),
      api.get("/si"),
    ])
      .then(([ativoRes, inspecoesRes, ssRes, siRes]) => {
        if (ativoRes.status === "fulfilled") {
          setAtivo(ativoRes.value.data);
        } else {
          console.error("Erro ao carregar ativo", ativoRes.reason);
        }

        if (inspecoesRes.status === "fulfilled") {
          const listaInspecoes: Inspecao[] = inspecoesRes.value.data ?? [];
          setInspecoes(listaInspecoes);

          Promise.allSettled(
            listaInspecoes.map((inspecao) => api.get(`/inspecoes/${inspecao.id_inspecao}`))
          ).then((detalhes) => {
            const fotos = detalhes.flatMap((detalhe) => {
              if (detalhe.status !== "fulfilled") return [];

              const inspecaoDetalhe = detalhe.value.data;
              return (inspecaoDetalhe.resultados ?? [])
                .filter((resultado: any) => Boolean(resultado.foto?.trim()))
                .map((resultado: any) => ({
                  url: resultado.foto.trim(),
                  id_inspecao: inspecaoDetalhe.id_inspecao,
                  data_inspecao: inspecaoDetalhe.data_inspecao,
                  item: resultado.nome_item,
                  status: resultado.status_item,
                }));
            });

            setFotosInspecao(fotos);
          });
        } else {
          console.error("Erro ao carregar inspecoes", inspecoesRes.reason);
        }

        if (ssRes.status === "fulfilled") {
          setSolicitacoesServico(
            (ssRes.value.data ?? []).filter((ss: SS) => Number(ss.id_ativo) === Number(id))
          );
        } else {
          console.error("Erro ao carregar SS", ssRes.reason);
        }

        if (siRes.status === "fulfilled") {
          setSolicitacoesIntervencao(
            (siRes.value.data ?? []).filter((si: SI) => Number(si.id_ativo) === Number(id))
          );
        } else {
          console.error("Erro ao carregar SI", siRes.reason);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const inspecoesOrdenadas = useMemo(
    () => sortByDateDesc(inspecoes, (inspecao) => inspecao.data_inspecao),
    [inspecoes]
  );

  const ssOrdenadas = useMemo(
    () => sortByDateDesc(solicitacoesServico, (ss) => ss.data_hora_solicitacao ?? ss.data_hora_abertura),
    [solicitacoesServico]
  );

  const siOrdenadas = useMemo(
    () => sortByDateDesc(solicitacoesIntervencao, (si) => si.data_inicio_preriodo_total ?? si.criado_em),
    [solicitacoesIntervencao]
  );

  useEffect(() => {
    setInspecoesPage(0);
  }, [inspecoes.length]);

  useEffect(() => {
    setSsPage(0);
  }, [solicitacoesServico.length]);

  useEffect(() => {
    setSiPage(0);
  }, [solicitacoesIntervencao.length]);

  const inspecoesPaginadas = useMemo(
    () => paginateItems(inspecoesOrdenadas, inspecoesPage),
    [inspecoesOrdenadas, inspecoesPage]
  );

  const ssPaginadas = useMemo(
    () => paginateItems(ssOrdenadas, ssPage),
    [ssOrdenadas, ssPage]
  );

  const siPaginadas = useMemo(
    () => paginateItems(siOrdenadas, siPage),
    [siOrdenadas, siPage]
  );

  useEffect(() => {
    setCurrentPhoto(0);
  }, [fotosInspecao.length]);

  const fotosGaleria = useMemo(() => {
    if (fotosInspecao.length > 0) return fotosInspecao;

    const fallback = ativo ? getAtivoImage(ativo) : null;
    return fallback
      ? [
          {
            url: fallback,
            id_inspecao: 0,
            data_inspecao: "",
            item: "Foto cadastrada",
            status: null,
          },
        ]
      : [];
  }, [ativo, fotosInspecao]);

  const fotoAtual = fotosGaleria[currentPhoto] ?? fotosGaleria[0];
  const fotoAtualSrc = normalizePhotoUrl(fotoAtual?.url);
  const fotoAtualComErro = fotoAtual ? photoLoadErrors[fotoAtual.url] : false;

  const totalInspecoes = inspecoes.length;
  const inspecoesOk = inspecoes.filter(
    (inspecao) => (inspecao.status_geral ?? "").toUpperCase() === "OK"
  ).length;
  const inspecoesNok = inspecoes.filter(
    (inspecao) => (inspecao.status_geral ?? "").toUpperCase() === "NOK"
  ).length;
  const aderenciaInspecao = totalInspecoes ? Math.round((inspecoesOk / totalInspecoes) * 100) : 0;

  if (loading && !ativo) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Carregando ativo...</div>;
  }

  if (!ativo) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Ativo nao encontrado</p>
        <Button asChild className="mt-4">
          <Link to="/ativo">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" size="sm" asChild className="w-fit">
          <Link to="/ativo">Voltar</Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/ativo/${ativo.id_ativo}/editar`}>
              <PenLine />
              Editar cadastro
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to={`/inspecoes/nova?id_ativo=${ativo.id_ativo}`}>
              <ClipboardList />
              Nova inspecao
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="overflow-hidden py-0">
          <div className="relative aspect-[4/3] bg-slate-100">
            {fotoAtual && !fotoAtualComErro ? (
              <img
                src={fotoAtualSrc}
                alt={`Foto do ativo ${ativo.codigo_ativo}`}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={() =>
                  setPhotoLoadErrors((prev) => ({
                    ...prev,
                    [fotoAtual.url]: true,
                  }))
                }
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                <ImageIcon className="h-14 w-14" />
                <span className="text-sm font-medium">
                  {fotoAtualComErro ? "Previa bloqueada pelo SharePoint" : "Sem foto cadastrada"}
                </span>
                {fotoAtual?.url && (
                  <Button asChild size="sm" variant="outline">
                    <a href={fotoAtual.url} target="_blank" rel="noreferrer">
                      Abrir foto
                    </a>
                  </Button>
                )}
              </div>
            )}
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {getFaseBadge(ativo.fase)}
              {getStatusBadge(ativo.status)}
            </div>

            {fotosGaleria.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {fotoAtual?.item ?? "Foto do ativo"}
                    </p>
                    <p className="text-xs text-white/80">
                      {fotoAtual?.id_inspecao
                        ? `Inspecao #${fotoAtual.id_inspecao} - ${formatDate(fotoAtual.data_inspecao)}`
                        : "Foto cadastrada no ativo"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {fotoAtual?.url && (
                      <Button size="icon-sm" variant="secondary" asChild>
                        <a href={fotoAtual.url} target="_blank" rel="noreferrer" title="Abrir foto">
                          <ExternalLink />
                        </a>
                      </Button>
                    )}
                    {fotoAtual?.id_inspecao ? (
                      <Button size="icon-sm" variant="secondary" asChild>
                        <Link to={`/inspecoes/${fotoAtual.id_inspecao}`} title="Abrir inspeção">
                          <ClipboardList />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {fotosGaleria.length > 1 && (
              <>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setCurrentPhoto((prev) =>
                      prev === 0 ? fotosGaleria.length - 1 : prev - 1
                    )
                  }
                >
                  <ChevronLeft />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setCurrentPhoto((prev) =>
                      prev >= fotosGaleria.length - 1 ? 0 : prev + 1
                    )
                  }
                >
                  <ChevronRight />
                </Button>
                <Badge className="absolute right-4 top-4 bg-black/60 text-white">
                  {currentPhoto + 1}/{fotosGaleria.length}
                </Badge>
              </>
            )}
          </div>

          <CardContent className="space-y-4 py-5">
            <div>
              <h1 className="break-words text-2xl font-bold">{ativo.codigo_ativo}</h1>
              <p className="text-sm text-muted-foreground">
                {[getTipoAtivo(ativo), ativo.fabricante, ativo.modelo].filter(Boolean).join(" - ")}
              </p>
            </div>
            <Separator />
            {fotosGaleria.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {fotosGaleria.map((foto, index) => (
                  <button
                    key={`${foto.id_inspecao}-${foto.url}-${index}`}
                    type="button"
                    className={`h-14 w-16 shrink-0 overflow-hidden rounded-md border ${
                      index === currentPhoto ? "border-primary ring-2 ring-primary/20" : "border-border"
                    }`}
                    onClick={() => setCurrentPhoto(index)}
                    title={foto.item ?? `Foto ${index + 1}`}
                  >
                    <img
                      src={normalizePhotoUrl(foto.url)}
                      alt={foto.item ?? `Foto ${index + 1}`}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setPhotoLoadErrors((prev) => ({
                          ...prev,
                          [foto.url]: true,
                        }))
                      }
                    />
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Subestacao" value={ativo.id_subestacao} />
              <Info label="Bay" value={ativo.bay} />
              <Info label="Tensao" value={ativo.tensao_nominal_kv ? `${ativo.tensao_nominal_kv} kV` : "-"} />
              <Info label="Serie" value={ativo.numero_serie} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              icon={<ClipboardList />}
              label="Inspecoes realizadas"
              value={totalInspecoes}
              detail={`${aderenciaInspecao}% com status OK`}
            />
            <MetricCard
              icon={<AlertTriangle />}
              label="Inspecoes NOK"
              value={inspecoesNok}
              detail={inspecoesNok === 1 ? "1 registro exige atencao" : `${inspecoesNok} registros exigem atencao`}
            />
            <MetricCard
              icon={<Wrench />}
              label="Solicitacoes de servico"
              value={solicitacoesServico.length}
              detail={ssOrdenadas[0]?.status ? `Ultima: ${ssOrdenadas[0].status}` : "Sem SS vinculada"}
            />
            <MetricCard
              icon={<CalendarClock />}
              label="Solicitacoes de intervencao"
              value={solicitacoesIntervencao.length}
              detail={siOrdenadas[0]?.status_manutencao ? `Ultima: ${siOrdenadas[0].status_manutencao}` : "Sem SI vinculada"}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-4 w-4" />
                  Cadastro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Info label="Codigo" value={ativo.codigo_ativo} />
                <Info label="Tipo" value={getTipoAtivo(ativo)} />
                <Info label="Status" value={ativo.status} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="h-4 w-4" />
                  Tecnico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Info label="Fabricante" value={ativo.fabricante} />
                <Info label="Modelo" value={ativo.modelo} />
                <Info label="Data instalacao" value={formatDate(ativo.data_instalacao)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  Operacional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Info label="Fase" value={ativo.fase} />
                <Info label="Bay" value={ativo.bay} />
                <Info label="Ultima inspecao" value={formatDate(inspecoesOrdenadas[0]?.data_inspecao)} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Historico operacional</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Consulte OS, inspecoes, SS e SI vinculadas a este ativo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={activePanel === "os" ? "default" : "outline"}
                onClick={() => setActivePanel("os")}
              >
                OS
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activePanel === "inspecoes" ? "default" : "outline"}
                onClick={() => setActivePanel("inspecoes")}
              >
                Inspecoes
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activePanel === "ss" ? "default" : "outline"}
                onClick={() => setActivePanel("ss")}
              >
                SS
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activePanel === "si" ? "default" : "outline"}
                onClick={() => setActivePanel("si")}
              >
                SI
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {activePanel === "os" && (
            <OsAtivoTable idAtivo={Number(ativo.id_ativo)} />
          )}

          {activePanel === "inspecoes" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button asChild size="sm">
                  <Link to={`/inspecoes/nova?id_ativo=${ativo.id_ativo}`}>Nova inspecao</Link>
                </Button>
              </div>

              {inspecoesOrdenadas.length === 0 ? (
                <EmptyState>Nenhuma inspecao encontrada</EmptyState>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Periodicidade</TableHead>
                        <TableHead>Responsavel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-20 text-right">Acao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inspecoesPaginadas.map((insp) => (
                        <TableRow key={insp.id_inspecao}>
                          <TableCell className="font-medium">{formatDate(insp.data_inspecao)}</TableCell>
                          <TableCell>{insp.periodicidade || "-"}</TableCell>
                          <TableCell>{insp.responsavel || "-"}</TableCell>
                          <TableCell>{getStatusBadge(insp.status_geral)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/inspecoes/${insp.id_inspecao}`}>Ver</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    page={inspecoesPage}
                    totalItems={inspecoesOrdenadas.length}
                    onPageChange={setInspecoesPage}
                  />
                </div>
              )}
            </div>
          )}

          {activePanel === "ss" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button asChild size="sm">
                  <Link to={`/ss/nova?id_ativo=${ativo.id_ativo}`}>Nova SS</Link>
                </Button>
              </div>

              {ssOrdenadas.length === 0 ? (
                <EmptyState>Nenhuma SS vinculada</EmptyState>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SS</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Limite</TableHead>
                        <TableHead className="w-20 text-right">Acao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ssPaginadas.map((ss) => (
                        <TableRow key={ss.id_ss}>
                          <TableCell className="font-medium">{ss.numero_ss}</TableCell>
                          <TableCell>
                            <div className="max-w-[520px] truncate">
                              {firstText(ss.descricao_problema, ss.causa, ss.localizacao) ?? "-"}
                            </div>
                          </TableCell>
                          <TableCell>{ss.prioridade || "-"}</TableCell>
                          <TableCell>{getStatusBadge(ss.status)}</TableCell>
                          <TableCell>{formatDate(ss.data_hora_limite ?? ss.data_hora_solicitacao)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/ss/${ss.id_ss}`}>Ver</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    page={ssPage}
                    totalItems={ssOrdenadas.length}
                    onPageChange={setSsPage}
                  />
                </div>
              )}
            </div>
          )}

          {activePanel === "si" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button asChild size="sm">
                  <Link to={`/si/nova?id_ativo=${ativo.id_ativo}`}>Nova SI</Link>
                </Button>
              </div>

              {siOrdenadas.length === 0 ? (
                <EmptyState>Nenhuma SI vinculada</EmptyState>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SI</TableHead>
                        <TableHead>Servico</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status manut.</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead className="w-20 text-right">Acao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {siPaginadas.map((si) => (
                        <TableRow key={si.id_si}>
                          <TableCell className="font-medium">{si.numero_si}</TableCell>
                          <TableCell>
                            <div className="max-w-[520px] truncate">
                              {firstText(si.descricao_servicos, si.natureza, si.justificativa) ?? "-"}
                            </div>
                          </TableCell>
                          <TableCell>{si.tipo || "-"}</TableCell>
                          <TableCell>{getStatusBadge(si.status_manutencao)}</TableCell>
                          <TableCell>{formatDate(si.data_inicio_preriodo_total ?? si.criado_em)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/si/${si.id_si}`}>Ver</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    page={siPage}
                    totalItems={siOrdenadas.length}
                    onPageChange={setSiPage}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="break-words font-medium">{value ?? "-"}</p>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card className="min-h-[116px] gap-3 py-4">
      <CardContent className="flex h-full items-start gap-4 px-4">
        <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          {icon}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium leading-snug text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold leading-none">{value}</p>
          <p className="text-xs leading-snug text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PaginationControls({
  page,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const from = totalItems === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const to = Math.min((currentPage + 1) * PAGE_SIZE, totalItems);

  return (
    <div className="flex flex-col gap-2 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {from}-{to} de {totalItems}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage >= totalPages - 1}
        >
          Proxima
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
