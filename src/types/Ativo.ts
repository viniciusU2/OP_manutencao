export interface Ativo {
  id_ativo?: number;
  id_subestacao: number;
  id_tipo_ativo: number;
  codigo_ativo: string;
  fabricante?: string;
  numero_serie: string;
  modelo?: string;
  tensao_nominal_kv?: number;
  status?: string;
  fase?: string;
  vao?: string;
}