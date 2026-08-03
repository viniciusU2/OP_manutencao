export interface SI {
  id_si: number;

  numero_si: string;
  numero_os?: string;
  numero_sgi?: string;

  id_subestacao?: number | null;
  id_ativo?: number | null;
  id_grupo_ativo?: number | null;
  id_funcao_operacao?: number | null;
  escopo_ativo?: "GRUPO" | "FASE" | null;
  codigo_ativo?: string | null;

  especie?: string;
  numero_apr?: string;
  prioridade?: string;
  tipo?: string;
  documentos_referencia?: string;

  data_inicio_preriodo_total?: string | null;
  data_fim_preriodo_total?: string | null;

  data_inicio_preriodo_manutencao?: string | null;
  data_fim_preriodo_manutencao?: string | null;

  justificativa?: string;
  responsavel?: string;
  substituto?: string;

  aproveitamento?: string;
  inclusao_servico?: string;
  acarreta_risco_perdas_multiplas?: string;

  orgaos?: string;
  tipo_progrmacao?: string;
  tipo_progrmacao_diario?: string;

  descricao_servicos?: string;
  observacoes?: string;
  cabo_aterramento?: string;
  risco_desligamento?: string;
  condicoes_climaticas?: string;
  execucao_periodo_noturno?: string;
  postergacao_traz_risco?: string;

  // 🔧 MANUTENÇÃO
  responsavel_ons_manutencao?: string;
  responsavel_cot_manutencao?: string;
  responsavel_se_manutencao?: string;

  
  responsavel_data_ons_manutencao?: string | null;
  responsavel_data_cot_manutencao?: string | null;
  responsavel_data_se_manutencao?: string | null;
  status_manutencao?: string;
  emissor?: string;
  editado_por?: string;


  // ⚡ OPERAÇÃO
  responsavel_ons_operacao?: string;
  responsavel_cot_operacao?: string;
  responsavel_se_operacao?: string;


  responsavel_data_ons_operacao?: string | null;
  responsavel_data_cot_operacao?: string | null;
  responsavel_data_se_operacao?: string | null;

  status_operacao?: string;

  criado_em: string;


  tipo_programacao?: string;
  dias_excecao?: string;
  tempo_retorno?: string;
  disponivel?: string;
  natureza?: string;
  caracteristica_intervencao?: string;


}

export type SICreate = Omit<SI, "id_si" | "criado_em">;

export type SIUpdate = Partial<SICreate>;

export interface SILiberacao {
  id_liberacao: number;
  id_si: number;
  data_utilizacao: string;
  data_hora_liberacao: string;
  usuario_solicitou_id?: number | null;
  usuario_solicitou: string;
  operador_liberou?: string | null;
  data_hora_devolucao?: string | null;
  usuario_devolveu_id?: number | null;
  usuario_devolveu?: string | null;
  operador_recebeu_devolucao?: string | null;
  observacoes?: string | null;
  status: "ABERTA" | "EM_EXECUCAO" | "ENCERRADA" | "CANCELADA" | string;
  criado_em: string;
  atualizado_em?: string | null;
}
