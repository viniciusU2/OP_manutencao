export interface OrdemServico {
  numero_os: string;
  numero_si?: string;

  // 🔹 RELACIONAMENTOS
  id_subestacao?: number;
  id_ativo?: number;
  id_os?: number;
  tipo_ativo?: string;   

  especie?: string;
  codigo_ativo?: string;
  numero_apr?: string;

  instalacao?: string;
  localizacao?: string;
  complemento?: string;

  origens?: string;
  defeito?: string;
  esquema_servicos?: string;
  prioridade?: string;

  responsavel?: string;
  substituto?: string;
  responsavel_manutencao?: string; 
  responsavel_operacao?: string; 
  emissor?: string;



  descricao_servicos?: string;
  observacoes?: string;

  causa_primaria?: string;
  causa_secundaria?: string;

  data_abertura_ss: string | null;
  data_inicio_programado: string | null;
  data_fim_programado: string | null;
  data_inicio_execucao: string | null;
  data_fim_execucao: string | null;

  centro_custos?: string;
  status?: string;
}


// types/OrdemServico.ts  (adicione isso)
export interface OrdemServicoCreateLote {
  id_subestacao: number;
  id_tipo_ativo: number;           // ← importante: mudei para id_tipo_ativo (veja explicação abaixo)
  tipo_ativo?: string;             // opcional, só para exibição

  numero_si?: string;
  numero_apr?: string;
  instalacao?: string;
  localizacao?: string;
  complemento?: string;

  origens?: string;
  defeito?: string;
  esquema_servicos?: string;

  causa_primaria?: string;
  causa_secundaria?: string;

  prioridade: "BAIXA" | "MEDIA" | "ALTA";
  responsavel?: string;
  responsavel_manutencao?: string;
  responsavel_operacao?: string;
  substituto?: string;

  data_abertura_ss?: string;
  data_inicio_programado?: string;
  data_fim_programado?: string;

  descricao_servicos?: string;
  observacoes?: string;
  centro_custos?: string;
  status?: string;
}