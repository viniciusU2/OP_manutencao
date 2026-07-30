export interface SolicitacaoServico {

numero_ss: string
numero_os?: string | null

id_subestacao: number | null
id_ativo: number | null

solicitante: string
matricula: string
funcao: string

telefone: string
email: string
orgao: string

instalacao: string
localizacao: string
complemento: string

descricao_problema: string

prioridade: string

esquema_servico: string
centro_custo: string

causa: string
causa_secundaria: string

equipe: string

data_hora_solicitacao: string
data_hora_limite: string

status: string
emissor?: string
editado_por?: string

}
