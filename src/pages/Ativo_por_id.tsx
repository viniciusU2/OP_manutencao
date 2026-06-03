import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";

import api from "../api/api";
import type { Ativo } from "../types/Ativo";
import { OsAtivoTable } from "./OsAtivoTable";

// ================= TYPES =================
interface Inspecao {
  id_inspecao: number;
  data_inspecao: string;
  periodicidade: string;
  status_geral: string;
}

// ================= HELPERS =================
function getFaseBadge(fase?: string) {
  switch (fase) {
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
  switch (status) {
    case "OK":
      return <Badge className="bg-green-100 text-green-800">OK</Badge>;
    case "NOK":
      return <Badge className="bg-red-100 text-red-800">NOK</Badge>;
    default:
      return <Badge variant="outline">{status || "-"}</Badge>;
  }
}

// ================= COMPONENT =================
export function AtivoDetalhe() {
  const { id } = useParams<{ id: string }>();

  const [ativo, setAtivo] = useState<Ativo | null>(null);
  const [inspecoes, setInspecoes] = useState<Inspecao[]>([]);

  useEffect(() => {
    if (!id) return;

    // 🔹 Carrega ativo
    api.get(`/ativo/${id}`)
      .then((res) => setAtivo(res.data))
      .catch(() => console.error("Erro ao carregar ativo"));

    // 🔹 Carrega inspeções do ativo
    api.get(`/inspecoes/ativo/${id}`)
      .then((res) => setInspecoes(res.data))
      .catch(() => console.error("Erro ao carregar inspeções"));

  }, [id]);

  if (!ativo) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          Ativo não encontrado
        </p>
        <Button asChild className="mt-4">
          <Link to="/ativo">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {ativo.codigo_ativo}
          </h1>
          <p className="text-muted-foreground">
            {ativo.fabricante} • {ativo.modelo}
          </p>
        </div>

        <div className="flex gap-2">
          {getFaseBadge(ativo.fase)}
          <Badge variant="outline">
            Tipo: {ativo.id_tipo_ativo}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* ================= INFO GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Geral */}
        <Card>
          <CardHeader>
            <CardTitle>Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Info label="Código" value={ativo.codigo_ativo} />
            <Info label="Tipo" value={ativo.id_tipo_ativo} />
            <Info label="Status" value={ativo.status} />
          </CardContent>
        </Card>

        {/* Técnico */}
        <Card>
          <CardHeader>
            <CardTitle>Técnico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Info label="Fabricante" value={ativo.fabricante} />
            <Info label="Modelo" value={ativo.modelo} />
            <Info label="Tensão (kV)" value={ativo.tensao_nominal_kv} />
            <Info label="Nº Série" value={ativo.numero_serie} />
        


          </CardContent>
        </Card>

        {/* Operacional */}
        <Card>
          <CardHeader>
            <CardTitle>Operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Info label="Subestação" value={ativo.id_subestacao} />
            <Info label="Fase" value={ativo.fase} />
   
          </CardContent>
        </Card>
      </div>

      {/* ================= INSPEÇÕES ================= */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inspeções</CardTitle>

          <Button asChild size="sm">
            <Link to={`/inspecoes/nova?id_ativo=${ativo.id_ativo}`}>
              Nova Inspeção
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {inspecoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma inspeção encontrada
            </p>
          ) : (
            inspecoes.map((insp) => (
              <div
                key={insp.id_inspecao}
                className="flex justify-between items-center border rounded-lg p-3 hover:bg-muted/50 transition"
              >
                <div>
                  <p className="font-medium">
                    {new Date(insp.data_inspecao).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {insp.periodicidade}
                  </p>
                </div>

                <div className="flex gap-2 items-center">
                  {getStatusBadge(insp.status_geral)}

                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/inspecoes/${insp.id_inspecao}`}>
                      Ver
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ================= OS ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço</CardTitle>
        </CardHeader>

        <CardContent>
          <OsAtivoTable idAtivo={Number(ativo.id_ativo)} />
        </CardContent>
      </Card>

      {/* ================= ACTIONS ================= */}
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link to="/ativos">Voltar</Link>
        </Button>

        <Button asChild>
          <Link to={`/ativo/${ativo.id_ativo}`}>
            Editar
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ================= COMPONENT AUX =================
function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {label}
      </p>
      <p className="font-medium">
        {value ?? "-"}
      </p>
    </div>
  );
}
