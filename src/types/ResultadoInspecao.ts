export type StatusInspecao = "OK" | "NOK" | "NA";

export interface ResultadoInspecao {
  id?: number;
  id_inspecao: number;
  id_item: number;
  status: StatusInspecao;
  observacao?: string;
}