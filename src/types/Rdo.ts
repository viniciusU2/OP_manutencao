export type RdoStatus = "RASCUNHO" | "IMPORTADO" | "VALIDADO" | "CANCELADO";

export type RdoConfiguracaoSistema = {
  id_configuracao?: number;
  id_rdo?: number;
  periodo_inicio: string;
  periodo_fim: string;
  subestacao?: string | null;
  equipamento: string;
  estado: string;
  ordem?: number;
};

export type RdoEvento = {
  id_evento?: number;
  id_rdo?: number;
  categoria: string;
  sistema?: string | null;
  subestacao?: string | null;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  titulo?: string | null;
  descricao: string;
  status_evento?: string;
  ordem?: number;
  criado_por?: number | null;
  editado_por?: number | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
};

export type Rdo = {
  id_rdo: number;
  data_rdo: string;
  titulo: string;
  codigo_procedimento: string;
  revisao: string;
  sistema: string;
  emissor: string;
  arquivo_pdf?: string | null;
  status: RdoStatus | string;
  criado_por?: number | null;
  editado_por?: number | null;
  validado_por?: number | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
  validado_em?: string | null;
  configuracoes?: RdoConfiguracaoSistema[];
  eventos?: RdoEvento[];
};

export type RdoHistorico = {
  id_historico: number;
  id_rdo: number;
  id_usuario?: number | null;
  acao: string;
  campo_alterado?: string | null;
  valor_anterior?: string | null;
  valor_novo?: string | null;
  observacao?: string | null;
  criado_em: string;
};
