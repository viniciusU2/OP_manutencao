export interface Ativo {
  id_ativo?: number;
  id_subestacao: number;
  id_tipo_ativo: number;
  subestacao?: string | {
    id_subestacao?: number;
    nome?: string | null;
    sigla?: string | null;
  } | null;
  tipo_ativo?: string | {
    id_tipo_ativo?: number;
    nome?: string | null;
  } | null;
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
