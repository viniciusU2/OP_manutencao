import type {
  ColaboradorSobreaviso,
  EquipeSobreaviso,
  HistoricoSobreaviso,
  Sobreaviso,
  SobreavisoDataSet,
  SobreavisoStatus,
  SubestacaoSobreaviso,
  SolicitacaoAjusteSobreaviso,
} from "../types/Sobreaviso";
import api from "../api/api";

export function calcularHoras(inicio: string, fim: string) {
  const start = new Date(inicio).getTime();
  const end = new Date(fim).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  return Math.round(((end - start) / 3_600_000) * 100) / 100;
}

export function existeSobreposicao(
  sobreavisos: Sobreaviso[],
  colaboradorId: number,
  inicio: string,
  fim: string,
  ignorarId?: number
) {
  const start = new Date(inicio).getTime();
  const end = new Date(fim).getTime();

  return sobreavisos.some((item) => {
    if (item.id === ignorarId || item.colaboradorId !== colaboradorId || item.status === "CANCELADO") {
      return false;
    }

    const itemStart = new Date(item.inicio).getTime();
    const itemEnd = new Date(item.fim).getTime();
    return start < itemEnd && end > itemStart;
  });
}

function apiErrorMessage(error: unknown, fallback: string) {
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;

  if (!error || typeof error !== "object") return fallback;

  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;

  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((item) => item?.msg ?? String(item)).join("; ");
  }

  if (!response) return `Erro de rede ao acessar a API (${apiUrl}). Verifique VITE_API_URL, HTTPS/CORS e se o backend esta online.`;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function asArray(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const wrapped = payload as Record<string, unknown>;
    for (const key of ["items", "data", "results"]) {
      if (Array.isArray(wrapped[key])) return wrapped[key] as any[];
    }
  }
  return [];
}

function asId(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function mapEquipe(item: any): EquipeSobreaviso {
  return {
    id: asId(item.id_equipe ?? item.id),
    nome: item.nome,
    descricao: item.descricao,
    ativo: Boolean(item.ativo),
  };
}

function mapColaborador(item: any): ColaboradorSobreaviso {
  return {
    id: asId(item.id_colaborador ?? item.id),
    nome: item.nome,
    matricula: item.matricula,
    email: item.email,
    cargo: item.cargo ?? "",
    telefone: item.telefone,
    equipeId: asId(item.id_equipe ?? item.equipeId),
    subestacaoId: asId(item.id_subestacao ?? item.subestacaoId) || null,
    usuarioId: asId(item.id_usuario ?? item.usuarioId) || null,
    ativo: Boolean(item.ativo),
  };
}

function isAdminColaborador(item: ColaboradorSobreaviso) {
  return item.cargo?.trim().toLowerCase() === "admin";
}

function mapSubestacao(item: any): SubestacaoSobreaviso {
  return {
    id: asId(item.id_subestacao ?? item.id),
    nome: item.nome,
    status: item.status,
  };
}

function mapSobreaviso(item: any): Sobreaviso {
  return {
    id: asId(item.id_sobreaviso ?? item.id),
    colaboradorId: asId(item.id_colaborador ?? item.colaboradorId ?? item.colaborador?.id_colaborador),
    inicio: item.inicio,
    fim: item.fim,
    totalHoras: Number(item.total_horas ?? 0),
    status: item.status,
    origem: item.origem,
    justificativa: item.justificativa,
    criadoPor: String(item.criado_por ?? ""),
    atualizadoPor: item.atualizado_por ? String(item.atualizado_por) : undefined,
    criadoEm: item.criado_em,
    atualizadoEm: item.atualizado_em,
  };
}

function mapSolicitacao(item: any): SolicitacaoAjusteSobreaviso {
  return {
    id: item.id_solicitacao,
    sobreavisoId: item.id_sobreaviso,
    solicitadoPor: String(item.solicitado_por ?? ""),
    inicioSolicitado: item.inicio_solicitado,
    fimSolicitado: item.fim_solicitado,
    justificativa: item.justificativa,
    status: item.status,
    avaliadoPor: item.avaliado_por ? String(item.avaliado_por) : undefined,
    avaliadoEm: item.avaliado_em,
    criadoEm: item.criado_em,
  };
}

function mapHistorico(item: any): HistoricoSobreaviso {
  return {
    id: item.id_historico,
    entidade: item.entidade,
    entidadeId: item.entidade_id,
    acao: item.acao,
    descricao: item.dados_novos || item.dados_anteriores || item.acao,
    usuario: String(item.alterado_por ?? ""),
    justificativa: item.justificativa,
    criadoEm: item.criado_em,
  };
}

async function listarApiDataSet(): Promise<SobreavisoDataSet> {
  const [equipesRes, subestacoesRes, colaboradoresRes, sobreavisosRes, solicitacoesRes, historicoRes] = await Promise.all([
    api.get("/sobreaviso/equipes"),
    api.get("/subestacao/ativas"),
    api.get("/sobreaviso/colaboradores"),
    api.get("/sobreaviso/"),
    api.get("/sobreaviso/solicitacoes-ajuste"),
    api.get("/sobreaviso/historico"),
  ]);

  return {
    equipes: asArray(equipesRes.data).map(mapEquipe).filter((item) => item.id > 0),
    subestacoes: asArray(subestacoesRes.data).map(mapSubestacao).filter((item) => item.id > 0),
    colaboradores: asArray(colaboradoresRes.data).map(mapColaborador)
      .filter((item: ColaboradorSobreaviso) => item.id > 0 && !isAdminColaborador(item)),
    sobreavisos: asArray(sobreavisosRes.data).map(mapSobreaviso)
      .filter((item) => item.id > 0 && item.colaboradorId > 0),
    solicitacoes: asArray(solicitacoesRes.data).map(mapSolicitacao),
    historico: asArray(historicoRes.data).map(mapHistorico),
  };
}

export async function listarSobreavisoDataSet() {
  try {
    return await listarApiDataSet();
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Nao foi possivel carregar os dados de sobreaviso."));
  }
}

export async function sincronizarColaboradoresSobreaviso() {
  try {
    const response = await api.post("/sobreaviso/sincronizar-colaboradores");
    return {
      data: await listarApiDataSet(),
      resumo: response.data as {
        usuarios_ativos?: number;
        ignorados_admin?: number;
        criados?: number;
        atualizados?: number;
        total_colaboradores?: number;
      },
    };
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Nao foi possivel sincronizar os colaboradores."));
  }
}

export async function salvarColaborador(
  payload: Omit<ColaboradorSobreaviso, "id"> & { id?: number },
  _usuario: string
) {
  try {
    const body = {
      nome: payload.nome,
      matricula: payload.matricula,
      email: payload.email,
      cargo: payload.cargo,
      telefone: payload.telefone,
      id_equipe: payload.equipeId,
      id_subestacao: payload.subestacaoId,
      id_usuario: payload.usuarioId,
      ativo: payload.ativo,
    };

    if (payload.id) {
      await api.put(`/sobreaviso/colaboradores/${payload.id}`, body);
    } else {
      await api.post("/sobreaviso/colaboradores", body);
    }

    return await listarApiDataSet();
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Nao foi possivel salvar o colaborador."));
  }
}

export async function salvarSobreaviso(
  payload: Omit<Sobreaviso, "id" | "totalHoras" | "criadoEm" | "criadoPor"> & {
    id?: number;
  },
  _usuario: string
) {
  if (!Number.isInteger(payload.colaboradorId) || payload.colaboradorId <= 0) {
    throw new Error("Selecione um colaborador valido.");
  }
  if (calcularHoras(payload.inicio, payload.fim) <= 0) {
    throw new Error("Informe um periodo valido: o fim deve ser maior que o inicio.");
  }

  try {
    const body = {
      id_colaborador: payload.colaboradorId,
      inicio: payload.inicio,
      fim: payload.fim,
      status: payload.status,
      origem: payload.origem,
      justificativa: payload.justificativa,
    };

    if (payload.id) {
      await api.put(`/sobreaviso/${payload.id}`, body);
    } else {
      await api.post("/sobreaviso/", body);
    }

    return await listarApiDataSet();
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Nao foi possivel salvar o sobreaviso."));
  }
}

export async function alterarStatusSobreaviso(
  id: number,
  status: SobreavisoStatus,
  _usuario: string,
  justificativa?: string
) {
  try {
    if (status === "APROVADO") {
      await api.post(`/sobreaviso/${id}/aprovar`, null, { params: { justificativa } });
    } else if (status === "REPROVADO") {
      await api.post(`/sobreaviso/${id}/reprovar`, null, { params: { justificativa } });
    } else if (status === "CANCELADO") {
      await api.post(`/sobreaviso/${id}/cancelar`, null, { params: { justificativa } });
    } else {
      await api.put(`/sobreaviso/${id}`, { status, justificativa });
    }

    return await listarApiDataSet();
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Nao foi possivel alterar o status do sobreaviso."));
  }
}

export async function salvarSolicitacaoAjuste(
  payload: Omit<SolicitacaoAjusteSobreaviso, "id" | "status" | "criadoEm">,
  _usuario: string
) {
  try {
    await api.post(`/sobreaviso/${payload.sobreavisoId}/solicitar-ajuste`, {
      inicio_solicitado: payload.inicioSolicitado,
      fim_solicitado: payload.fimSolicitado,
      justificativa: payload.justificativa,
    });

    return await listarApiDataSet();
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Nao foi possivel solicitar o ajuste."));
  }
}

export async function avaliarSolicitacaoAjuste(
  id: number,
  status: "APROVADA" | "REPROVADA",
  _usuario: string
) {
  try {
    const action = status === "APROVADA" ? "aprovar" : "reprovar";
    await api.post(`/sobreaviso/solicitacoes-ajuste/${id}/${action}`);
    return await listarApiDataSet();
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Nao foi possivel avaliar a solicitacao de ajuste."));
  }
}

export async function exportarFolhaPontoSobreaviso(
  colaboradorId: number,
  dataInicio: string,
  dataFim: string
) {
  const response = await api.get("/sobreaviso/relatorios/folha-ponto/exportar", {
    params: {
      id_colaborador: colaboradorId,
      data_inicio: dataInicio,
      data_fim: dataFim,
    },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `folha_ponto_sobreaviso_${dataInicio.slice(0, 10)}_${dataFim.slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportarEscalaGeralSobreaviso(dataInicio: string, dataFim: string) {
  const response = await api.get("/sobreaviso/relatorios/escala-geral/exportar", {
    params: {
      data_inicio: dataInicio,
      data_fim: dataFim,
    },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `escala_geral_sobreaviso_${dataInicio.slice(0, 10)}_${dataFim.slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function equipeNome(equipes: EquipeSobreaviso[], equipeId: number) {
  return equipes.find((item) => item.id === equipeId)?.nome ?? "Sem equipe";
}
