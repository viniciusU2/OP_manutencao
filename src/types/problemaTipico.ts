export type Criticidade = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
export type TipoAcao = "INSPECAO" | "ENSAIO" | "CORRECAO" | "SUBSTITUICAO" | "MONITORAMENTO" | "INVESTIGACAO" | "PREVENCAO";
export type RiscoOperacional = "BAIXO" | "MEDIO" | "ALTO";
export type CondicaoIntervencao = "ENERGIZADO" | "DESENERGIZADO" | "INDIFERENTE";
export type StatusValidacaoProblema = "PENDENTE" | "EM_REVISAO" | "VALIDADO" | "REPROVADO";
export type OrigemRegistroProblema = "REFERENCIA_TECNICA" | "OCORRENCIA_REAL";
export interface ProblemaTipico {
  id_problema: number; codigo?: string; id_tipo_ativo: number; sistema: string; categoria: string;
  titulo: string; descricao?: string; criticidade_padrao: Criticidade;
  modo_falha?: string; efeito_falha?: string; detectabilidade?: "ALTA"|"MEDIA"|"BAIXA";
  risco_operacional?: RiscoOperacional;
  especialidade?: string; requer_desligamento: boolean;
  condicao_intervencao?: CondicaoIntervencao; requer_equipe_especializada?: boolean;
  alerta_seguranca?: string; referencias_tecnicas?: string;
  status_validacao?: StatusValidacaoProblema; origem_registro?: OrigemRegistroProblema;
  validado_por?: string; validado_em?: string; ativo: boolean;
  sintomas: {sintoma:string}[]; causas: {causa:string}[];
  metodos_deteccao: {metodo:string}[];
  alarmes?: {alarme:string}[]; palavras_chave?: {palavra_chave:string}[]; instrumentos?: {instrumento:string}[];
  acoes_recomendadas: {tipo_acao:TipoAcao;descricao:string;prioridade?:string;prazo_recomendado?:string}[];
}
export interface SSProblema { id?:number; id_problema:number; observacao?:string; criticidade_identificada?:Criticidade; confirmado:boolean; problema?:ProblemaTipico }
export type ProblemaPayload = Omit<ProblemaTipico,"id_problema">;
