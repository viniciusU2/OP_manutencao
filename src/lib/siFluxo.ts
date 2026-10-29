import type { SIAcao, SI } from "../types/SI";

export type UsuarioSI = { role?: string | null } | null | undefined;

export const STATUS_SI_LABEL: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ENVIADA: "Enviada / Em análise",
  REJEITADA: "Rejeitada",
  APROVADA: "Aprovada",
  CANCELADA: "Cancelada",
  PROGRAMADA: "Programada",
  CONCLUIDA: "Concluída",
  ENCERRADA: "Encerrada",
};

export const STATUS_SI_DESCRICAO: Record<string, string> = {
  RASCUNHO:
    "Somente a Manutenção Local vê este rascunho. A Operação só recebe a SI depois do envio.",
  ENVIADA:
    "Em análise pelo Centro de Operações. A SI está bloqueada para edição.",
  REJEITADA:
    "Devolvida pela Operação. Corrija o que for necessário e reenvie — a mesma SI volta para análise.",
  APROVADA:
    "Aprovada pelo Centro de Operações. O documento fica somente leitura, mas as liberações continuam registrando; conclua a SI quando a intervenção terminar.",
  CANCELADA: "Cancelada. Documento somente leitura, sem novas alterações de status.",
  PROGRAMADA:
    "SI programada. A Manutenção Local ainda pode editar e enviar para o Centro de Operações.",
  CONCLUIDA: "SI concluída. Documento somente leitura.",
  ENCERRADA: "SI encerrada. Documento somente leitura.",
};

export const ROTULO_ACAO: Record<SIAcao, string> = {
  enviar: "Enviar para a Operação",
  aprovar: "Aprovar",
  rejeitar: "Rejeitar",
  concluir: "Concluir SI",
  cancelar: "Cancelar SI",
};

export const DESCRICAO_ACAO: Record<SIAcao, string> = {
  enviar:
    "A SI vai para o Centro de Operações e fica bloqueada para edição até a análise.",
  aprovar:
    "A SI é aprovada e o documento passa a ser somente leitura. As liberações continuam registrando durante a execução.",
  rejeitar:
    "A SI volta editável para a Manutenção Local corrigir e reenviar. Explique o motivo.",
  concluir:
    "Encerra a SI com a intervenção executada. O documento fica somente leitura para todos.",
  cancelar:
    "Encerra a SI definitivamente. Ela fica somente leitura e não volta mais para análise.",
};

export const ACOES_COM_JUSTIFICATIVA: SIAcao[] = ["rejeitar", "cancelar"];

/** Cor de destaque de cada status (ponto do resumo, trilha do fluxo). */
export const STATUS_SI_COR: Record<string, string> = {
  RASCUNHO: "#64748b",
  ENVIADA: "#8b5cf6",
  REJEITADA: "#ef4444",
  APROVADA: "#10b981",
  CANCELADA: "#94a3b8",
  PROGRAMADA: "#3b82f6",
  CONCLUIDA: "#10b981",
  ENCERRADA: "#10b981",
};

/** Ordem em que os status aparecem no resumo da lista. */
export const ORDEM_STATUS_SI = [
  "RASCUNHO",
  "ENVIADA",
  "REJEITADA",
  "APROVADA",
  "PROGRAMADA",
  "CONCLUIDA",
  "ENCERRADA",
  "CANCELADA",
] as const;

function normalizarRole(role?: string | null) {
  return (role ?? "").trim().toLowerCase();
}

/** Somente a Manutenção Local (papel `mantenedor`) cria SI. */
export function podeCriarSI(usuario: UsuarioSI) {
  return normalizarRole(usuario?.role) === "mantenedor";
}

/** O Centro de Operações analisa as SI enviadas. */
export function ehCentroOperacoes(usuario: UsuarioSI) {
  const role = normalizarRole(usuario?.role);
  return role === "admin" || role === "operador";
}

/**
 * O status pede ação deste perfil?
 * Manutenção: rascunho a concluir, rejeitada a corrigir ou aprovada a
 * concluir depois de executar.
 * Operação: SI enviada aguardando análise (e aprovada a concluir).
 */
export function statusRequerAcao(status?: string | null, usuario?: UsuarioSI) {
  const valor = (status ?? "").toUpperCase();
  if (podeCriarSI(usuario)) {
    return valor === "RASCUNHO" || valor === "REJEITADA" || valor === "APROVADA";
  }
  if (ehCentroOperacoes(usuario)) {
    return valor === "ENVIADA" || valor === "APROVADA";
  }
  return false;
}

/** O backend é a fonte da verdade; estes helpers só guiam a interface. */
export function podeEditarSI(si?: SI | null) {
  return Boolean(si?.pode_editar);
}

export function acoesDaSI(si?: SI | null): SIAcao[] {
  return (si?.acoes ?? []) as SIAcao[];
}

export function statusDaSI(si?: SI | null) {
  return (si?.status ?? "").toUpperCase();
}

export function rotuloStatus(status?: string | null) {
  if (!status) return "-";
  return STATUS_SI_LABEL[status.toUpperCase()] ?? status.replace(/_/g, " ");
}

export function ehStatusFinal(status?: string | null) {
  return ["APROVADA", "CANCELADA", "CONCLUIDA", "ENCERRADA"].includes(
    (status ?? "").toUpperCase(),
  );
}
