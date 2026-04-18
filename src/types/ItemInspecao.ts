export type Periodicidade =
  | "SEMANAL"
  | "MENSAL"
  | "BIMESTRAL"
  | "TRIMESTRAL"
  | "SEMESTRAL"
  | "3_ANOS"
  | "5_ANOS"
  | "6_ANOS";

export interface ItemInspecao {
  id?: number;
  id_tipo_ativo: number;
  nome_item: string;
  periodicidade: Periodicidade;
  ativo?: boolean;
}

export interface InspecaoDetalhe {
  id_inspecao: number;
  id_ativo: number;
  
  data_inspecao: string;        // ISO string ou date
  periodicidade: string;        // Ex: "Mensal", "Trimestral", "Anual"
  status_geral: "OK" | "NOK";
  
  tecnico_responsavel?: string;
  observacoes?: string;
  
  // Dados do Ativo (para não precisar fazer outra requisição)
  codigo_ativo?: string;
  fabricante?: string;
  modelo?: string;
  fase?: string;
  tensao_nominal_kv?: number;
  
  // Campos úteis extras (recomendado)
  created_at?: string;
  updated_at?: string;
  fotos?: string[];                    // URLs das fotos
  itens_inspecionados?: ItemInspecao[]; // Itens com OK/NOK individual
}