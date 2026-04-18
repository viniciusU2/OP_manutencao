import React from "react";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils"
// ================= TYPES =================

export type StatusKey =
  | "OPERACIONAL"
  | "EM_MANUTENCAO"
  | "FORA_DE_SERVICO"
  | "DESATIVADO"
  | "ATIVA"
  | "INATIVA"
  | "ABERTA"
  | "EM_ANALISE"
  | "APROVADA"
  | "REJEITADA"
  | "EM_EXECUCAO"
  | "ENCERRADA"
  | "CANCELADA"
  | "PROGRAMADA"
  | "AGUARDANDO_MATERIAL"
  | "AGUARDANDO_APROVACAO"
  | "ATIVO"
  | "PAUSADO"
  | "EMERGENCIA"
  | "URGENTE"
  | "NORMAL"
  | "BAIXA"
  | "ALTA"
  | "MEDIA";

export interface StatusBadgeProps {
  status?: StatusKey | string;
  className?: string;
}


// ================= STYLES =================

export const statusStyles: Record<string, string> = {
  OPERACIONAL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  EM_MANUTENCAO: "bg-amber-50 text-amber-700 border-amber-200",
  FORA_DE_SERVICO: "bg-red-50 text-red-700 border-red-200",
  DESATIVADO: "bg-slate-100 text-slate-500 border-slate-200",

  ATIVA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INATIVA: "bg-slate-100 text-slate-500 border-slate-200",

  ABERTA: "bg-blue-50 text-blue-700 border-blue-200",
  EM_ANALISE: "bg-violet-50 text-violet-700 border-violet-200",
  APROVADA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJEITADA: "bg-red-50 text-red-700 border-red-200",
  EM_EXECUCAO: "bg-amber-50 text-amber-700 border-amber-200",
  ENCERRADA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELADA: "bg-slate-100 text-slate-500 border-slate-200",

  PROGRAMADA: "bg-blue-50 text-blue-700 border-blue-200",
  AGUARDANDO_MATERIAL: "bg-orange-50 text-orange-700 border-orange-200",
  AGUARDANDO_APROVACAO: "bg-violet-50 text-violet-700 border-violet-200",

  ATIVO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAUSADO: "bg-amber-50 text-amber-700 border-amber-200",

  EMERGENCIA: "bg-red-50 text-red-700 border-red-200",
  URGENTE: "bg-orange-50 text-orange-700 border-orange-200",
  NORMAL: "bg-blue-50 text-blue-700 border-blue-200",
  BAIXA: "bg-slate-100 text-slate-500 border-slate-200",

  ALTA: "bg-red-50 text-red-700 border-red-200",
  MEDIA: "bg-amber-50 text-amber-700 border-amber-200",
};


// ================= LABELS =================

export const statusLabels: Record<string, string> = {
  OPERACIONAL: "Operacional",
  EM_MANUTENCAO: "Em Manutenção",
  FORA_DE_SERVICO: "Fora de Serviço",
  DESATIVADO: "Desativado",

  ATIVA: "Ativa",
  INATIVA: "Inativa",

  ABERTA: "Aberta",
  EM_ANALISE: "Em Análise",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
  EM_EXECUCAO: "Em Execução",
  ENCERRADA: "Encerrada",
  CANCELADA: "Cancelada",

  PROGRAMADA: "Programada",
  AGUARDANDO_MATERIAL: "Aguard. Material",
  AGUARDANDO_APROVACAO: "Aguard. Aprovação",

  ATIVO: "Ativo",
  PAUSADO: "Pausado",

  EMERGENCIA: "Emergência",
  URGENTE: "Urgente",
  NORMAL: "Normal",
  BAIXA: "Baixa",

  ALTA: "Alta",
  MEDIA: "Média",
};

export  function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null;

  
  const normalized = status.toUpperCase(); // 👈 importante

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-xs border",
        statusStyles[normalized] || "bg-slate-100 text-slate-600 border-slate-200",
        className
      )}
    >
      {statusLabels[normalized] || status.replace(/_/g, " ")}
    </Badge>
  );
}