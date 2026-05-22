export interface SI {
  id_si: number;

  numero_si: string;
  numero_os?: string;
  numero_sgi?: string;

  id_subestacao?: number | null;
  id_ativo?: number | null;

  especie?: string;
  numero_apr?: string;
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

  orgaos?: string;
  tipo_progrmacao?: string;
  tipo_progrmacao_diario?: string;

  descricao_servicos?: string;
  observacoes?: string;
  cabo_aterramento?: string;
  risco_desligamento?: string;
  condicoes_climaticas?: string;
  execucao_periodo_noturno?: string;

  // 🔧 MANUTENÇÃO
  responsavel_ons_manutencao?: string;
  responsavel_cot_manutencao?: string;
  responsavel_se_manutencao?: string;

  
  responsavel_data_ons_manutencao?: string | null;
  responsavel_data_cot_manutencao?: string | null;
  responsavel_data_se_manutencao?: string | null;
  status_manutencao?: string;
  emissor?: string;


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