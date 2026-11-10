/**
 * UnifilarSelecaoPage - indice dos diagramas unifilares salvos.
 * Rota: /unifilar - navegacao liberada para todos os perfis autenticados.
 *
 * Cada cartao leva ao editor/visualizador da subestacao
 * (/subestacoes/:id/unifilar), no mesmo diagrama gravado no servidor.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Cable, Clock3, Network, Search } from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";

type ResumoDiagrama = {
  id_subestacao: number;
  nome: string;
  tipo_instalacao?: string | null;
  total_componentes: number;
  total_ligacoes: number;
  atualizado_em: string | null;
};

type Filtro = "SUBESTACAO" | "LINHA_TRANSMISSAO" | "TODAS";

const TIPO_ROTULO: Record<string, string> = {
  SUBESTACAO: "Subestação",
  LINHA_TRANSMISSAO: "Linha de transmissão",
};

function ehLinha(tipo?: string | null) {
  return (tipo ?? "").toUpperCase().startsWith("LINHA");
}

function rotuloTipo(tipo?: string | null) {
  const chave = (tipo ?? "SUBESTACAO").toUpperCase();
  if (ehLinha(chave)) return TIPO_ROTULO.LINHA_TRANSMISSAO;
  return TIPO_ROTULO[chave] ?? chave;
}

function dataCurta(iso: string | null) {
  if (!iso) return "sem data";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return data.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function UnifilarSelecaoPage() {
  const navigate = useNavigate();
  const [diagramas, setDiagramas] = useState<ResumoDiagrama[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("SUBESTACAO");

  useEffect(() => {
    let ativo = true;
    api.get<ResumoDiagrama[]>("/unifilar/diagramas")
      .then(({ data }) => { if (ativo) setDiagramas(Array.isArray(data) ? data : []); })
      .catch(() => { if (ativo) toast.error("Não foi possível carregar os diagramas unifilares."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return diagramas.filter((d) => {
      const combinaTipo = filtro === "TODAS" ||
        (filtro === "LINHA_TRANSMISSAO" ? ehLinha(d.tipo_instalacao) : !ehLinha(d.tipo_instalacao));
      if (!combinaTipo) return false;
      if (!termo) return true;
      return d.nome?.toLowerCase().includes(termo) || String(d.id_subestacao) === termo;
    });
  }, [busca, diagramas, filtro]);

  const totalSubestacoes = diagramas.filter((d) => !ehLinha(d.tipo_instalacao)).length;
  const totalLinhas = diagramas.length - totalSubestacoes;
  const opcoes: { chave: Filtro; rotulo: string; total: number }[] = [
    { chave: "SUBESTACAO", rotulo: "Subestações", total: totalSubestacoes },
    { chave: "LINHA_TRANSMISSAO", rotulo: "Linhas", total: totalLinhas },
    { chave: "TODAS", rotulo: "Todas", total: diagramas.length },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Network className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Unifilares</h1>
            <p className="text-sm text-gray-500">
              {carregando
                ? "Carregando diagramas…"
                : `${totalSubestacoes} ${totalSubestacoes === 1 ? "subestação" : "subestações"} · ${totalLinhas} ${totalLinhas === 1 ? "linha" : "linhas"} com diagrama`}
            </p>
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar subestação por nome ou número…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {!carregando && (
        <div className="flex flex-wrap gap-1.5">
          {opcoes.map((o) => (
            <Button
              key={o.chave}
              size="sm"
              variant={filtro === o.chave ? "default" : "outline"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setFiltro(o.chave)}
            >
              {o.rotulo}
              <span className={`ml-1.5 rounded px-1 text-[10px] font-semibold ${filtro === o.chave ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>
                {o.total}
              </span>
            </Button>
          ))}
        </div>
      )}

      {!carregando && !diagramas.length && (
        <Card className="p-8 text-center">
          <Network className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">Nenhum diagrama unifilar salvo.</p>
          <p className="mt-1 text-xs text-slate-500">
            Abra uma subestação em Instalações e use o botão “Unifilar” para montar o diagrama.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/subestacaoPage")}>
            <Building2 className="mr-1.5 h-4 w-4" />
            Ir para Instalações
          </Button>
        </Card>
      )}

      {!carregando && !!diagramas.length && !filtrados.length && (
        <p className="text-sm text-slate-500">
          {busca.trim()
            ? `Nenhuma instalação encontrada para “${busca}”.`
            : filtro === "LINHA_TRANSMISSAO"
              ? "Nenhuma linha de transmissão com diagrama salvo."
              : "Nenhuma subestação com diagrama salvo neste filtro."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtrados.map((d) => (
          <Card key={d.id_subestacao} className="flex flex-col p-5 transition hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{d.nome}</h3>
                  <p className="flex items-center gap-1.5 font-mono text-xs text-gray-400">
                    <span>#{d.id_subestacao}</span>
                    <span className={`rounded px-1.5 py-0.5 font-sans text-[10px] font-semibold ${ehLinha(d.tipo_instalacao) ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                      {rotuloTipo(d.tipo_instalacao)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Network className="h-3.5 w-3.5" />
                {d.total_componentes} componentes
              </span>
              <span className="flex items-center gap-1">
                <Cable className="h-3.5 w-3.5" />
                {d.total_ligacoes} ligações
              </span>
              <span className="flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {dataCurta(d.atualizado_em)}
              </span>
            </div>

            <div className="mt-4 flex justify-end border-t pt-3">
              <Button size="sm" onClick={() => navigate(`/subestacoes/${d.id_subestacao}/unifilar`)}>
                Abrir unifilar
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
