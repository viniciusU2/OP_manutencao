export type Criticidade = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
export type TipoAcao = "INSPECAO" | "ENSAIO" | "CORRECAO" | "SUBSTITUICAO" | "MONITORAMENTO" | "INVESTIGACAO";
export interface ProblemaTipico {
  id_problema: number; id_tipo_ativo: number; sistema: string; categoria: string;
  titulo: string; descricao?: string; criticidade_padrao: Criticidade;
  modo_falha?: string; efeito_falha?: string; detectabilidade?: "ALTA"|"MEDIA"|"BAIXA";
  especialidade?: string; requer_desligamento: boolean; ativo: boolean;
  sintomas: {sintoma:string}[]; causas: {causa:string}[];
  metodos_deteccao: {metodo:string}[];
  acoes_recomendadas: {tipo_acao:TipoAcao;descricao:string;prioridade?:string;prazo_recomendado?:string}[];
}
export interface SSProblema { id?:number; id_problema:number; observacao?:string; criticidade_identificada?:Criticidade; confirmado:boolean; problema?:ProblemaTipico }
export type ProblemaPayload = Omit<ProblemaTipico,"id_problema">;
