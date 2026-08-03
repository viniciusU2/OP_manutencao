export type EscopoAtivo = "GRUPO" | "FASE";

export interface ComponenteGrupoAtivo {
  id_ativo: number;
  fase?: string | null;
}

export interface GrupoAtivo {
  id_grupo_ativo: number;
  chave_grupo: string;
  id_subestacao: number;
  id_funcao_operacao?: number | null;
  id_tipo_ativo: number;
  codigo_ativo: string;
  tipo_ativo?: string | null;
  bay?: string | null;
  quantidade_componentes: number;
  inconsistencia_sem_fase: boolean;
  fases: ComponenteGrupoAtivo[];
}
