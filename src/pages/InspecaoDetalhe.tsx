import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";
import { ArrowLeft, Edit, Trash2, Calendar, User } from "lucide-react";

import api from "../api/api";
import { OnlyAdmin, OnlyMaintainerOrAdmin } from "../components/onlyAdmin";

interface ItemInspecao {
  item: string;
  status: "OK" | "NOK";
  observacao?: string;
}

interface InspecaoDetalhe {
  id_inspecao: number;
  id_ativo: number;
  data_inspecao: string;
  periodicidade: string;
  status_geral: "OK" | "NOK";
  tecnico_responsavel?: string;
  observacoes?: string;
  codigo_ativo?: string;
  fabricante?: string;
  modelo?: string;
  fase?: string;
  itens_inspecionados?: ItemInspecao[];
}

export function InspecaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inspecao, setInspecao] = useState<InspecaoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/inspecoes/${id}`)
      .then(res => {
        setInspecao(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8 text-center">Carregando inspeção...</div>;
  if (!inspecao) return <div className="p-8 text-center text-red-600">Inspeção não encontrada</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Inspeção #{inspecao.id_inspecao}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(inspecao.data_inspecao).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric'
              })}
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
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          </OnlyAdmin>
        </div>
      </div>

      <Separator />

      {/* Status Principal */}
      <div className="flex items-center gap-4">
        <span className="text-lg font-medium">Status Geral da Inspeção:</span>
        {inspecao.status_geral === "OK" ? (
          <Badge className="bg-green-600 text-white text-xl px-6 py-1.5">✅ OK</Badge>
        ) : (
          <Badge className="bg-red-600 text-white text-xl px-6 py-1.5">❌ NOK</Badge>
        )}
      </div>

      {/* Ativo */}
      <Card>
        <CardHeader>
          <CardTitle>Ativo Inspecionado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="font-semibold">{inspecao.codigo_ativo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Equipamento</p>
              <p className="font-medium">{inspecao.fabricante} {inspecao.modelo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fase</p>
              <p className="font-medium">{inspecao.fase || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Inspeção */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Inspeção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Periodicidade</p>
              <p className="font-medium text-lg">{inspecao.periodicidade}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Técnico Responsável
              </p>
              <p className="font-medium">{inspecao.tecnico_responsavel || "Não informado"}</p>
            </div>
          </div>

          {inspecao.observacoes && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Observações Gerais</p>
              <div className="bg-muted/60 p-5 rounded-xl text-[15px] leading-relaxed">
                {inspecao.observacoes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Itens Inspecionados (se existir) */}
      {inspecao.itens_inspecionados && inspecao.itens_inspecionados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Itens Inspecionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inspecao.itens_inspecionados.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border p-4 rounded-lg">
                  <div>
                    <p className="font-medium">{item.item}</p>
                    {item.observacao && (
                      <p className="text-sm text-muted-foreground mt-1">{item.observacao}</p>
                    )}
                  </div>
                  {item.status === "OK" ? (
                    <Badge className="bg-green-100 text-green-700">OK</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">NOK</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações finais */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" asChild>
          <Link to={`/ativos/${inspecao.id_ativo}`}>Ver Ativo Completo</Link>
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
    </div>
  );
}
