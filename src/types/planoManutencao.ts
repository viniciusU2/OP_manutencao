export type PeriodicidadePlano =
  | "SEMANAL"
  | "MENSAL"
  | "BIMESTRAL"
  | "TRIMESTRAL"
  | "SEMESTRAL"
  | "3_ANOS"
  | "5_ANOS"
  | "6_ANOS";

export interface PlanoItemCreate {
  nome_item: string;
  descricao?: string;
  periodicidade: PeriodicidadePlano;
  unidade?: string;
  valor_referencia?: number;
  tolerancia?: number;
  data_inicio?: string;
  intervalo: number;
  antecedencia: number;
  ordem: number;
}

export interface PlanoItemRead extends PlanoItemCreate {
  id_plano_item: number;
  id_plano_manutencao: number;
  id_ativo?: number | null;
}

export interface PlanoManutencaoCreate {
  id_tipo_ativo: number;
  descricao_geral?: string;
  materiais_previstos?: string;
  procedimentos_instrucoes?: string;
  requisitos_de_seguranca?: string;
  observacao_geral?: string;
  itens: PlanoItemCreate[];
}

export interface TipoAtivoPlano {
  id_tipo_ativo: number;
  nome: string;
  descricao?: string;
}

export interface PlanoManutencaoRead {
  id_plano_manutencao: number;
  id_tipo_ativo: number;
  descricao_geral: string;
  materiais_previstos: string;
  procedimentos_instrucoes: string;
  requisitos_de_seguranca: string;
  observacao_geral: string;
}

export interface PlanoManutencaoReadFull extends PlanoManutencaoRead {
  itens: PlanoItemRead[];
  tipo_ativo?: TipoAtivoPlano | null;
}

export interface PlanoExecucaoPlanilha {
  id_execucao: number;
  id_plano_item: number;
  id_plano_manutencao: number;
  id_ativo: number;
  nome_item: string;
  periodicidade: PeriodicidadePlano;
  intervalo: number;
  antecedencia: number;
  plano_descricao?: string;
  codigo_ativo: string;
  instalacao?: string | null;
  tipo_ativo?: string | null;
  bay?: string | null;
  fase?: string | null;
  ultima_execucao?: string | null;
  proxima_execucao: string;
}

export interface PlanoExecucaoUpdate {
  ultima_execucao?: string | null;
  proxima_execucao: string;
}
