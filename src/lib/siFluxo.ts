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
    "Aprovada pelo Centro de Operações. Não pode mais ser editada; só o cancelamento é possível.",
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
  cancelar: "Cancelar SI",
};

export const DESCRICAO_ACAO: Record<SIAcao, string> = {
  enviar:
    "A SI vai para o Centro de Operações e fica bloqueada para edição até a análise.",
  aprovar:
    "A SI é aprovada e passa a ser somente leitura para todos. Só poderá ser cancelada.",
  rejeitar:
    "A SI volta editável para a Manutenção Local corrigir e reenviar. Explique o motivo.",
  cancelar:
    "Encerra a SI definitivamente. Ela fica somente leitura e não volta mais para análise.",
};

export const ACOES_COM_JUSTIFICATIVA: SIAcao[] = ["rejeitar", "cancelar"];

function normalizarRole(role?: string | null) {
  return (role ?? "").trim().toLowerCase();
}

/** Somente a Manutenção Local (papel `mantenedor`) cria SI. */
export function podeCriarSI(usuario: UsuarioSI) {
  return normalizarRole(usuario?.role) === "mantenedor";
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
