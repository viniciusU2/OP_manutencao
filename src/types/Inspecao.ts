export type PeriodicidadeEnum =
  | "SEMANAL"
  | "MENSAL"
  | "BIMESTRAL"
  | "TRIMESTRAL"
  | "SEMESTRAL"
  | "ANUAL"
  | "3_ANOS"
  | "5_ANOS"
  | "6_ANOS";

export type StatusItemEnum = "OK" | "NOK" | "NA";

export interface ItemInspecaoTemplateCreate {
  id_tipo_ativo: number;
  nome_item: string;
  descricao?: string;
  periodicidade: PeriodicidadeEnum;
  unidade?: string;
  valor_referencia?: number;
  tolerancia?: number;
  ativo?: boolean;
}

export interface ItemInspecaoTemplate {
  id_item_template: number;
  id_tipo_ativo: number;
  nome_item: string;
  descricao?: string;
  periodicidade: PeriodicidadeEnum;
  unidade?: string;
  valor_referencia?: number;
  tolerancia?: number;
  ativo: boolean;
}

export interface ResultadoItemCreate {
  id_item_template: number;
  valor_medido?: number;
  status_item: "OK" | "NOK" | "NA";
  observacao_item?: string;
}

export interface InspecaoCreate {
  id_ativo: number;
  id_os?: number;
  data_inspecao?: string;
  data_proxima_inspecao?: string;
  periodicidade: PeriodicidadeEnum;
  responsavel?: string;
  observacao_geral?: string;

  resultados: ResultadoItemCreate[];
}
