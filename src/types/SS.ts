export interface SS {
  id?: number;
  id_ss: number;
  numero_ss: string;
  numero_os?: string | null;
  data_hora_solicitacao?: string | null;
  data_hora_abertura?: string | null;
  data_hora_limite?: string | null;
  solicitante?: string;
  matricula?: string;
  funcao?: string;
  telefone?: string;
  email?: string;
  orgao?: string;
  instalacao?: string;
  localizacao?: string;
  complemento?: string;
  id_ativo?: number | null;
  codigo_ativo?: string | null;
  esquema_servico?: string;
  centro_custo?: string;
  causa?: string;
  causa_secundaria?: string;
  equipe?: string;
  descricao_problema?: string;
  prioridade?: string;
  status: string;
}
