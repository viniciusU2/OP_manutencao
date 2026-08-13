export interface Subestacao {
  id_subestacao?: number;
  nome: string;
  tipo_instalacao?: "SUBESTACAO" | "LINHA_TRANSMISSAO";
  tensao_kv: number;
  localizacao: string;
  concessionaria: string;
}
