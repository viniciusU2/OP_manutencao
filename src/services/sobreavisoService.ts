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

const STORAGE_KEY = "operacao_sobreaviso_dataset";

function nowIso() {
  return new Date().toISOString();
}

function nextId(items: Array<{ id: number }>) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

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

function seedData(): SobreavisoDataSet {
  const createdAt = nowIso();

  return {
    equipes: [
      { id: 1, nome: "Operacao", descricao: "Equipe de operacao em campo", ativo: true },
      { id: 2, nome: "Manutencao", descricao: "Equipe de manutencao eletrica", ativo: true },
      { id: 3, nome: "Suporte", descricao: "Equipe de apoio tecnico", ativo: true },
    ],
    subestacoes: [
      { id: 1, nome: "BJD", status: "ATIVA" },
      { id: 2, nome: "GOR", status: "ATIVA" },
      { id: 3, nome: "JAB", status: "ATIVA" },
    ],
    colaboradores: [
      {
        id: 1,
        nome: "Joao Silva",
        matricula: "10023",
        email: "joao.silva@rialma.local",
        cargo: "Tecnico de Operacao",
        telefone: "(00) 90000-1001",
        equipeId: 1,
        subestacaoId: 1,
        usuarioId: null,
        ativo: true,
      },
      {
        id: 2,
        nome: "Maria Souza",
        matricula: "10045",
        email: "maria.souza@rialma.local",
        cargo: "Engenheira de Manutencao",
        telefone: "(00) 90000-1002",
        equipeId: 2,
        subestacaoId: 2,
        usuarioId: null,
        ativo: true,
      },
      {
        id: 3,
        nome: "Ana Lima",
        matricula: "10051",
        email: "ana.lima@rialma.local",
        cargo: "Tecnica de Suporte",
        telefone: "(00) 90000-1003",
        equipeId: 3,
        subestacaoId: 3,
        usuarioId: null,
        ativo: true,
      },
    ],
    sobreavisos: [
      {
        id: 1,
        colaboradorId: 1,
        inicio: "2026-07-20T18:00",
        fim: "2026-07-21T06:00",
        totalHoras: 12,
        status: "APROVADO",
        origem: "GESTOR",
        justificativa: "Escala operacional noturna.",
        criadoPor: "Sistema",
        criadoEm: createdAt,
      },
      {
        id: 2,
        colaboradorId: 2,
        inicio: "2026-07-21T18:00",
        fim: "2026-07-22T06:00",
        totalHoras: 12,
        status: "PENDENTE",
        origem: "GESTOR",
        justificativa: "Cobertura de manutencao programada.",
        criadoPor: "Sistema",
        criadoEm: createdAt,
      },
      {
        id: 3,
        colaboradorId: 3,
        inicio: "2026-07-25T08:00",
        fim: "2026-07-26T08:00",
        totalHoras: 24,
        status: "PLANEJADO",
        origem: "ADMIN",
        justificativa: "Fim de semana com equipe reduzida.",
        criadoPor: "Sistema",
        criadoEm: createdAt,
      },
    ],
    solicitacoes: [
      {
        id: 1,
        sobreavisoId: 1,
        solicitadoPor: "Joao Silva",
        inicioSolicitado: "2026-07-20T19:00",
        fimSolicitado: "2026-07-21T06:00",
        justificativa: "Troca de passagem de turno registrada pelo gestor.",
        status: "PENDENTE",
        criadoEm: createdAt,
      },
    ],
    historico: [
      {
        id: 1,
        entidade: "SOBREAVISO",
        entidadeId: 1,
        acao: "CRIACAO",
        descricao: "Sobreaviso inicial criado.",
        usuario: "Sistema",
        criadoEm: createdAt,
      },
    ],
  };
}

function readData(): SobreavisoDataSet {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = seedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  const data = JSON.parse(stored) as SobreavisoDataSet;
  const normalized = {
    ...data,
    sobreavisos: data.sobreavisos.map((item) => ({
      ...item,
      totalHoras: calcularHoras(item.inicio, item.fim),
    })),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function hasHttpResponse(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: unknown }).response
  );
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
    api.get("/sobreaviso"),
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

function writeData(data: SobreavisoDataSet) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function addHistory(
  data: SobreavisoDataSet,
  historico: Omit<HistoricoSobreaviso, "id" | "criadoEm">
) {
  data.historico.unshift({
    ...historico,
    id: nextId(data.historico),
    criadoEm: nowIso(),
  });
}

export async function listarSobreavisoDataSet() {
  try {
    return await listarApiDataSet();
  } catch (error) {
    if (hasHttpResponse(error)) throw error;
    return readData();
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
  usuario: string
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
    if (hasHttpResponse(error)) throw new Error(apiErrorMessage(error, "Nao foi possivel salvar o sobreaviso."));
  }

  const data = readData();

  if (payload.id) {
    data.colaboradores = data.colaboradores.map((item) =>
      item.id === payload.id ? { ...payload, id: payload.id } : item
    );
    addHistory(data, {
      entidade: "COLABORADOR",
      entidadeId: payload.id,
      acao: "EDICAO",
      descricao: `Colaborador ${payload.nome} atualizado.`,
      usuario,
    });
    return writeData(data);
  }

  const colaborador = { ...payload, id: nextId(data.colaboradores) };
  data.colaboradores.unshift(colaborador);
  addHistory(data, {
    entidade: "COLABORADOR",
    entidadeId: colaborador.id,
    acao: "CRIACAO",
    descricao: `Colaborador ${colaborador.nome} cadastrado.`,
    usuario,
  });
  return writeData(data);
}

export async function salvarSobreaviso(
  payload: Omit<Sobreaviso, "id" | "totalHoras" | "criadoEm" | "criadoPor"> & {
    id?: number;
  },
  usuario: string
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
      await api.post("/sobreaviso", body);
    }

    return await listarApiDataSet();
  } catch (error) {
    if (hasHttpResponse(error)) throw error;
  }

  const data = readData();
  const totalHoras = calcularHoras(payload.inicio, payload.fim);

  if (totalHoras <= 0) {
    throw new Error("Informe um periodo valido: o fim deve ser maior que o inicio.");
  }

  if (existeSobreposicao(data.sobreavisos, payload.colaboradorId, payload.inicio, payload.fim, payload.id)) {
    throw new Error("Ja existe sobreaviso no mesmo periodo para este colaborador.");
  }

  if (payload.id) {
    data.sobreavisos = data.sobreavisos.map((item) =>
      item.id === payload.id
        ? {
            ...item,
            ...payload,
            totalHoras,
            atualizadoPor: usuario,
            atualizadoEm: nowIso(),
          }
        : item
    );
    addHistory(data, {
      entidade: "SOBREAVISO",
      entidadeId: payload.id,
      acao: "EDICAO",
      descricao: "Periodo de sobreaviso atualizado.",
      justificativa: payload.justificativa,
      usuario,
    });
    return writeData(data);
  }

  const sobreaviso: Sobreaviso = {
    ...payload,
    id: nextId(data.sobreavisos),
    totalHoras,
    criadoPor: usuario,
    criadoEm: nowIso(),
  };
  data.sobreavisos.unshift(sobreaviso);
  addHistory(data, {
    entidade: "SOBREAVISO",
    entidadeId: sobreaviso.id,
    acao: "CRIACAO",
    descricao: "Periodo de sobreaviso criado.",
    justificativa: sobreaviso.justificativa,
    usuario,
  });
  return writeData(data);
}

export async function alterarStatusSobreaviso(
  id: number,
  status: SobreavisoStatus,
  usuario: string,
  justificativa?: string
) {
  try {
    if (status === "APROVADO") {
      await api.post(`/sobreaviso/${id}/aprovar`, null, { params: { justificativa } });
    } else if (status === "REPROVADO") {
      await api.post(`/sobreaviso/${id}/reprovar`, null, { params: { justificativa } });
    } else if (status === "CANCELADO") {
      try {
        await api.post(`/sobreaviso/${id}/cancelar`, null, { params: { justificativa } });
      } catch (error) {
        if (!hasHttpResponse(error)) throw error;
        await api.put(`/sobreaviso/${id}`, { status, justificativa });
      }
    } else {
      await api.put(`/sobreaviso/${id}`, { status, justificativa });
    }

    return await listarApiDataSet();
  } catch (error) {
    if (hasHttpResponse(error)) throw new Error(apiErrorMessage(error, "Nao foi possivel alterar o status do sobreaviso."));
  }

  const data = readData();
  data.sobreavisos = data.sobreavisos.map((item) =>
    item.id === id
      ? {
          ...item,
          status,
          justificativa: justificativa || item.justificativa,
          atualizadoPor: usuario,
          atualizadoEm: nowIso(),
        }
      : item
  );
  addHistory(data, {
    entidade: "SOBREAVISO",
    entidadeId: id,
    acao: status,
    descricao: `Status alterado para ${status}.`,
    justificativa,
    usuario,
  });
  return writeData(data);
}

export async function salvarSolicitacaoAjuste(
  payload: Omit<SolicitacaoAjusteSobreaviso, "id" | "status" | "criadoEm">,
  usuario: string
) {
  try {
    await api.post(`/sobreaviso/${payload.sobreavisoId}/solicitar-ajuste`, {
      inicio_solicitado: payload.inicioSolicitado,
      fim_solicitado: payload.fimSolicitado,
      justificativa: payload.justificativa,
    });

    return await listarApiDataSet();
  } catch (error) {
    if (hasHttpResponse(error)) throw error;
  }

  const data = readData();
  const sobreaviso = data.sobreavisos.find((item) => item.id === payload.sobreavisoId);

  if (!sobreaviso) {
    throw new Error("Sobreaviso nao encontrado.");
  }

  if (calcularHoras(payload.inicioSolicitado, payload.fimSolicitado) <= 0) {
    throw new Error("Informe um periodo valido para o ajuste.");
  }

  if (
    existeSobreposicao(
      data.sobreavisos,
      sobreaviso.colaboradorId,
      payload.inicioSolicitado,
      payload.fimSolicitado,
      sobreaviso.id
    )
  ) {
    throw new Error("O ajuste solicitado causaria sobreposicao de horarios.");
  }

  const solicitacao: SolicitacaoAjusteSobreaviso = {
    ...payload,
    id: nextId(data.solicitacoes),
    status: "PENDENTE",
    criadoEm: nowIso(),
  };
  data.solicitacoes.unshift(solicitacao);
  addHistory(data, {
    entidade: "SOLICITACAO_AJUSTE",
    entidadeId: solicitacao.id,
    acao: "SOLICITACAO",
    descricao: "Solicitacao de ajuste registrada.",
    justificativa: solicitacao.justificativa,
    usuario,
  });
  return writeData(data);
}

export async function avaliarSolicitacaoAjuste(
  id: number,
  status: "APROVADA" | "REPROVADA",
  usuario: string
) {
  try {
    const action = status === "APROVADA" ? "aprovar" : "reprovar";
    await api.post(`/sobreaviso/solicitacoes-ajuste/${id}/${action}`);
    return await listarApiDataSet();
  } catch (error) {
    if (hasHttpResponse(error)) throw error;
  }

  const data = readData();
  const solicitacao = data.solicitacoes.find((item) => item.id === id);

  if (!solicitacao) {
    throw new Error("Solicitacao nao encontrada.");
  }

  data.solicitacoes = data.solicitacoes.map((item) =>
    item.id === id ? { ...item, status, avaliadoPor: usuario, avaliadoEm: nowIso() } : item
  );

  if (status === "APROVADA") {
    data.sobreavisos = data.sobreavisos.map((item) =>
      item.id === solicitacao.sobreavisoId
        ? {
            ...item,
            inicio: solicitacao.inicioSolicitado,
            fim: solicitacao.fimSolicitado,
            totalHoras: calcularHoras(solicitacao.inicioSolicitado, solicitacao.fimSolicitado),
            atualizadoPor: usuario,
            atualizadoEm: nowIso(),
          }
        : item
    );
  }

  addHistory(data, {
    entidade: "SOLICITACAO_AJUSTE",
    entidadeId: id,
    acao: status,
    descricao: `Solicitacao de ajuste ${status.toLowerCase()}.`,
    justificativa: solicitacao.justificativa,
    usuario,
  });
  return writeData(data);
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

export function equipeNome(equipes: EquipeSobreaviso[], equipeId: number) {
  return equipes.find((item) => item.id === equipeId)?.nome ?? "Sem equipe";
}
