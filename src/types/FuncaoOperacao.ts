export interface FuncaoOperacao {
  id_funcao_operacao: number;
  id_subestacao: number;
  codigo: string;
  descricao?: string | null;
  subestacao_nome?: string | null;
  quantidade_ativos?: number;
}

export interface FuncaoOperacaoPayload {
  id_subestacao: number;
  codigo: string;
  descricao?: string | null;
}

export interface FuncaoOperacaoAtivo {
  id_ativo: number;
  codigo_ativo: string;
  fabricante?: string | null;
  modelo?: string | null;
  bay?: string | null;
  fase?: string | null;
  status?: string | null;
}
