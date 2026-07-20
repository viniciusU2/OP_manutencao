export type SobreavisoStatus = "PLANEJADO" | "PENDENTE" | "APROVADO" | "REPROVADO" | "CANCELADO";

export type SobreavisoOrigem = "ADMIN" | "GESTOR" | "COLABORADOR";

export interface EquipeSobreaviso {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface SubestacaoSobreaviso {
  id: number;
  nome: string;
  status?: string;
}

export interface ColaboradorSobreaviso {
  id: number;
  nome: string;
  matricula: string;
  email: string;
  cargo: string;
  telefone?: string;
  equipeId: number;
  subestacaoId?: number | null;
  usuarioId?: number | null;
  ativo: boolean;
}

export interface Sobreaviso {
  id: number;
  colaboradorId: number;
  inicio: string;
  fim: string;
  totalHoras: number;
  status: SobreavisoStatus;
  origem: SobreavisoOrigem;
  justificativa?: string;
  criadoPor: string;
  atualizadoPor?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface SolicitacaoAjusteSobreaviso {
  id: number;
  sobreavisoId: number;
  solicitadoPor: string;
  inicioSolicitado: string;
  fimSolicitado: string;
  justificativa: string;
  status: "PENDENTE" | "APROVADA" | "REPROVADA";
  avaliadoPor?: string;
  avaliadoEm?: string;
  criadoEm: string;
}

export interface HistoricoSobreaviso {
  id: number;
  entidade: "COLABORADOR" | "SOBREAVISO" | "SOLICITACAO_AJUSTE";
  entidadeId: number;
  acao: string;
  descricao: string;
  usuario: string;
  justificativa?: string;
  criadoEm: string;
}

export interface SobreavisoDataSet {
  equipes: EquipeSobreaviso[];
  subestacoes: SubestacaoSobreaviso[];
  colaboradores: ColaboradorSobreaviso[];
  sobreavisos: Sobreaviso[];
  solicitacoes: SolicitacaoAjusteSobreaviso[];
  historico: HistoricoSobreaviso[];
}
