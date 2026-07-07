export interface Ativo {
  id_ativo?: number;
  id_subestacao: number;
  id_tipo_ativo: number;
  codigo_ativo: string;
  foto?: string | null;
  imagem?: string | null;
  imagem_url?: string | null;
  foto_url?: string | null;
  fabricante?: string;
  numero_serie?: string;
  modelo?: string;
  especie?: string;
  tensao_nominal_kv?: number;
  data_instalacao?: string | null;
  status?: string;
  fase?: string;
  bay?: string;
}
