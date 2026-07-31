import api from "../api/api";
import type {
  FuncaoOperacao,
  FuncaoOperacaoAtivo,
  FuncaoOperacaoPayload,
} from "../types/FuncaoOperacao";

export async function listarFuncoesOperacao(idSubestacao?: number | null) {
  const response = await api.get<FuncaoOperacao[]>("/funcoes-operacao", {
    params: idSubestacao ? { id_subestacao: idSubestacao } : undefined,
  });
  return response.data;
}

export async function criarFuncaoOperacao(payload: FuncaoOperacaoPayload) {
  const response = await api.post<FuncaoOperacao>("/funcoes-operacao", payload);
  return response.data;
}

export async function atualizarFuncaoOperacao(
  idFuncaoOperacao: number,
  payload: FuncaoOperacaoPayload
) {
  const response = await api.put<FuncaoOperacao>(
    `/funcoes-operacao/${idFuncaoOperacao}`,
    payload
  );
  return response.data;
}

export async function excluirFuncaoOperacao(idFuncaoOperacao: number) {
  const response = await api.delete(`/funcoes-operacao/${idFuncaoOperacao}`);
  return response.data;
}

export async function listarAtivosDaFuncaoOperacao(idFuncaoOperacao: number) {
  const response = await api.get<FuncaoOperacaoAtivo[]>(
    `/funcoes-operacao/${idFuncaoOperacao}/ativos`
  );
  return response.data;
}
