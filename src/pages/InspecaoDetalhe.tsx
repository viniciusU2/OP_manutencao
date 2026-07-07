import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  ExternalLink,
  FileText,
  ImageIcon,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { OnlyAdmin, OnlyMaintainerOrAdmin } from "../components/onlyAdmin";

interface Resultado {
  id_resultado: number;
  id_plano_item: number;
  nome_item?: string;
  valor_referencia?: string | number | null;
  tolerancia?: string | number | null;
  valor_medido?: string | number | null;
  unidade?: string;
  status_item: "OK" | "NOK" | "NA";
  observacao_item?: string;
  foto?: string | null;
}

interface InspecaoDetalheData {
  id_inspecao: number;
  id_ativo: number;
  id_os?: number | null;
  numero_os?: string | null;
  numero_apr?: string | null;
  data_inspecao: string;
  periodicidade: string;
  responsavel?: string;
  ficha_inspecao_url?: string | null;
  observacao_geral?: string;
  status_geral: "OK" | "NOK" | "NA";
  codigo_ativo?: string;
  fabricante?: string;
  modelo?: string;
  fase?: string;
  bay?: string;
  instalacao?: string;
  tipo_ativo?: string;
  resultados?: Resultado[];
}

function statusClass(status: string) {
  if (status === "OK") return "bg-green-100 text-green-700";
  if (status === "NOK") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

function formatarData(data?: string) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeMediaUrl(url?: string | null) {
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

function isImageUrl(url?: string | null) {
  return Boolean(url && /^(data:image\/|blob:|.*\.(png|jpe?g|webp|gif)(\?.*)?$)/i.test(url));
}

function isPdfUrl(url?: string | null) {
  return Boolean(url && /\.pdf(\?.*)?$/i.test(url));
}

function canPreviewInFrame(url?: string | null) {
  return Boolean(url && (/^https?:\/\//i.test(url) || isPdfUrl(url)));
}

export function InspecaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspecao, setInspecao] = useState<InspecaoDetalheData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [mediaLoadErrors, setMediaLoadErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api
      .get(`/inspecoes/${id}`)
      .then((res) => {
        setInspecao(res.data);
        setCurrentPhoto(0);
        setMediaLoadErrors({});
      })
      .catch(() => toast.error("Erro ao carregar inspeção"))
      .finally(() => setLoading(false));
  }, [id]);

  const fotosInspecao = useMemo(() => {
    return (inspecao?.resultados ?? [])
      .filter((resultado) => Boolean(resultado.foto?.trim()))
      .map((resultado) => ({
        url: resultado.foto?.trim() ?? "",
        src: normalizeMediaUrl(resultado.foto),
        item: resultado.nome_item || "Item inspecionado",
        status: resultado.status_item,
        observacao: resultado.observacao_item,
      }));
  }, [inspecao]);

  useEffect(() => {
    setCurrentPhoto(0);
  }, [fotosInspecao.length]);

  const fotoAtual = fotosInspecao[currentPhoto] ?? fotosInspecao[0];
  const fichaUrl = inspecao?.ficha_inspecao_url?.trim() ?? "";
  const fichaPreviewUrl = normalizeMediaUrl(fichaUrl);
  const fichaComErro = fichaUrl ? mediaLoadErrors[fichaUrl] : false;

  async function excluir() {
    if (!id || !confirm(`Deseja excluir a inspeção #${id}?`)) return;

    try {
      await api.delete(`/inspecoes/${id}`);
      toast.success("Inspeção excluída");
      navigate("/inspecoes");
    } catch {
      toast.error("Erro ao excluir inspeção");
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando inspeção...</div>;
  if (!inspecao) {
    return <div className="p-8 text-center text-red-600">Inspeção não encontrada</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/inspecoes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Inspeção #{inspecao.id_inspecao}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatarData(inspecao.data_inspecao)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <OnlyMaintainerOrAdmin>
            <Button asChild variant="outline">
              <Link to={`/inspecoes/${id}/editar`}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Link>
            </Button>
          </OnlyMaintainerOrAdmin>
          <OnlyAdmin>
            <Button variant="destructive" onClick={excluir}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          </OnlyAdmin>
        </div>
      </div>

      <Separator />

      <div className="flex items-center gap-4">
        <span className="text-lg font-medium">Status Geral:</span>
        <Badge className={`${statusClass(inspecao.status_geral)} text-lg px-5 py-1`}>
          {inspecao.status_geral}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ativo Inspecionado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="font-semibold">{inspecao.codigo_ativo || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{inspecao.tipo_ativo || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Instalação</p>
              <p className="font-medium">{inspecao.instalacao || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fase / Bay</p>
              <p className="font-medium">
                {[inspecao.fase, inspecao.bay].filter(Boolean).join(" - ") || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">OS relacionada</p>
              {inspecao.id_os && inspecao.numero_os ? (
                <Link className="font-medium text-blue-700 underline" to={`/os/${inspecao.id_os}`}>
                  {inspecao.numero_os}
                </Link>
              ) : (
                <p className="font-medium">-</p>
              )}
              {inspecao.numero_apr && (
                <p className="text-sm text-muted-foreground">{inspecao.numero_apr}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Inspeção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Periodicidade</p>
              <p className="font-medium text-lg">{inspecao.periodicidade}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Responsável
              </p>
              <p className="font-medium">{inspecao.responsavel || "Não informado"}</p>
            </div>
          </div>

          {inspecao.ficha_inspecao_url && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Ficha de inspeção física
              </p>
              <a
                href={inspecao.ficha_inspecao_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-blue-700 underline"
              >
                Abrir ficha
              </a>
            </div>
          )}

          {inspecao.observacao_geral && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Observação Geral</p>
              <div className="bg-muted/60 rounded-lg p-5 text-[15px] leading-relaxed">
                {inspecao.observacao_geral}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {fichaUrl && (
        <Card className="overflow-hidden py-0">
          <CardHeader className="border-b py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pre-visualizacao da ficha
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ficha fisica vinculada a esta inspecao.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={fichaUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Abrir ficha
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative min-h-[420px] bg-slate-100">
              {!fichaComErro && isImageUrl(fichaUrl) ? (
                <img
                  src={fichaPreviewUrl}
                  alt="Pre-visualizacao da ficha de inspecao"
                  className="h-full max-h-[720px] min-h-[420px] w-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setMediaLoadErrors((prev) => ({
                      ...prev,
                      [fichaUrl]: true,
                    }))
                  }
                />
              ) : !fichaComErro && canPreviewInFrame(fichaUrl) ? (
                <iframe
                  title="Pre-visualizacao da ficha de inspecao"
                  src={fichaPreviewUrl}
                  className="h-[70vh] min-h-[420px] w-full"
                  onError={() =>
                    setMediaLoadErrors((prev) => ({
                      ...prev,
                      [fichaUrl]: true,
                    }))
                  }
                />
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 p-6 text-center text-slate-600">
                  <FileText className="h-12 w-12" />
                  <div>
                    <p className="font-medium">
                      {fichaComErro ? "Previa bloqueada pelo link" : "Previa indisponivel"}
                    </p>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                      Abra a ficha em uma nova aba para visualizar o arquivo completo.
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <a href={fichaUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Abrir ficha
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Fotos da inspecao
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {fotosInspecao.length
                ? `${fotosInspecao.length} foto${fotosInspecao.length === 1 ? "" : "s"} registrada${fotosInspecao.length === 1 ? "" : "s"} nos itens.`
                : "Nenhuma foto registrada nos itens desta inspecao."}
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {fotoAtual ? (
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="relative min-h-[360px] bg-slate-950">
                {mediaLoadErrors[fotoAtual.url] ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 p-6 text-center text-white">
                    <ImageIcon className="h-12 w-12" />
                    <p className="font-medium">Previa da foto indisponivel</p>
                    <Button asChild variant="secondary">
                      <a href={fotoAtual.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Abrir foto
                      </a>
                    </Button>
                  </div>
                ) : (
                  <img
                    src={fotoAtual.src}
                    alt={`Foto da inspecao - ${fotoAtual.item}`}
                    className="h-full max-h-[640px] min-h-[360px] w-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setMediaLoadErrors((prev) => ({
                        ...prev,
                        [fotoAtual.url]: true,
                      }))
                    }
                  />
                )}

                {fotosInspecao.length > 1 && (
                  <>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="secondary"
                      className="absolute left-4 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setCurrentPhoto((prev) =>
                          prev === 0 ? fotosInspecao.length - 1 : prev - 1
                        )
                      }
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="secondary"
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setCurrentPhoto((prev) =>
                          prev >= fotosInspecao.length - 1 ? 0 : prev + 1
                        )
                      }
                    >
                      <ChevronRight />
                    </Button>
                    <Badge className="absolute right-4 top-4 bg-black/65 text-white">
                      {currentPhoto + 1}/{fotosInspecao.length}
                    </Badge>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-4 border-t p-4 lg:border-l lg:border-t-0">
                <div>
                  <p className="text-sm text-muted-foreground">Item</p>
                  <p className="font-medium">{fotoAtual.item}</p>
                  {fotoAtual.observacao && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {fotoAtual.observacao}
                    </p>
                  )}
                </div>
                <Badge className={`${statusClass(fotoAtual.status)} w-fit`}>
                  {fotoAtual.status}
                </Badge>
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <a href={fotoAtual.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Abrir foto
                  </a>
                </Button>

                {fotosInspecao.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 lg:grid-cols-3">
                    {fotosInspecao.map((foto, index) => (
                      <button
                        key={`${foto.url}-${index}`}
                        type="button"
                        className={`aspect-square overflow-hidden rounded-md border bg-slate-100 ${
                          index === currentPhoto
                            ? "border-primary ring-2 ring-primary/25"
                            : "border-border"
                        }`}
                        onClick={() => setCurrentPhoto(index)}
                        title={foto.item}
                      >
                        <img
                          src={foto.src}
                          alt={foto.item}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setMediaLoadErrors((prev) => ({
                              ...prev,
                              [foto.url]: true,
                            }))
                          }
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12" />
              <p className="font-medium">Sem fotos para exibir</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens Inspecionados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(inspecao.resultados ?? []).length === 0 ? (
              <p className="text-muted-foreground">Nenhum item registrado.</p>
            ) : (
              (inspecao.resultados ?? []).map((resultado) => (
                <div
                  key={resultado.id_resultado}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{resultado.nome_item || "-"}</p>
                    <p className="text-sm text-muted-foreground">
                      Medido: {resultado.valor_medido ?? "-"} {resultado.unidade || ""} | Ref:{" "}
                      {resultado.valor_referencia ?? "-"} | Tol: {resultado.tolerancia ?? "-"}
                    </p>
                    {resultado.observacao_item && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {resultado.observacao_item}
                      </p>
                    )}
                    {resultado.foto && (
                      <div className="mt-3">
                        <a
                          href={resultado.foto}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-blue-700 underline"
                        >
                          Abrir foto
                        </a>
                        {/^(https?:|data:image\/)/i.test(resultado.foto) && (
                          <img
                            src={resultado.foto}
                            alt={`Foto do item ${resultado.nome_item || ""}`}
                            className="mt-2 max-h-40 rounded-md border object-contain"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <Badge className={statusClass(resultado.status_item)}>
                    {resultado.status_item}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" asChild>
          <Link to={`/ativo/${inspecao.id_ativo}`}>Ver Ativo</Link>
        </Button>
        <Button variant="outline" onClick={() => navigate("/inspecoes")}>
          Voltar
        </Button>
      </div>
    </div>
  );
}
