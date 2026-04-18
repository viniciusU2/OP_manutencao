export type UnidadePlano = "semanal" | "mensal" | "bimestral"| "semestral" |"3 anos"|"5 anos";
export interface PlanoManutencaoCreate {
  nome: string;
  descricao?: string;
  intervalo: number;
  unidade: UnidadePlano;

  tipo_ativos_ids?: number;
}
