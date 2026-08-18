import api from "../api/api";
import type { ProblemaPayload, ProblemaTipico } from "../types/problemaTipico";
export const problemaTipicoService = {
  listar: (params: Record<string, unknown> = {}) => api.get<ProblemaTipico[]>("/problemas-tipicos", {params}),
  porTipo: (id: number) => api.get<ProblemaTipico[]>(`/problemas-tipicos/tipo-ativo/${id}`),
  criar: (data: ProblemaPayload) => api.post<ProblemaTipico>("/problemas-tipicos", data),
  editar: (id:number,data:ProblemaPayload) => api.put<ProblemaTipico>(`/problemas-tipicos/${id}`,data),
  status: (id:number,ativo:boolean) => api.patch<ProblemaTipico>(`/problemas-tipicos/${id}/status`,null,{params:{ativo}}),
};
