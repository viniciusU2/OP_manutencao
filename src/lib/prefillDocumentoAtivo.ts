import api from "../api/api";

/**
 * Dados usados para abrir OS/SS ja vinculadas a um ativo.
 *
 * O cadastro guarda a hierarquia Instalacao > Funcao de Transmissao > Grupo
 * de ativo. O ativo individual guarda a funcao, mas nao o grupo; por isso o
 * grupo e localizado pela lista de grupos da funcao (comparando as fases).
 */
export type PrefillDocumentoAtivo = {
  id_subestacao: number | null;
  id_funcao_operacao: number | null;
  id_grupo_ativo: number | null;
  id_tipo_ativo: number | null;
  escopo_ativo: "GRUPO" | "FASE" | null;
  id_ativo: number | null;
  codigo_ativo: string | null;
  fase: string | null;
  bay: string | null;
  nome_instalacao: string | null;
  funcao_codigo: string | null;
};

type FaseGrupo = { id_ativo?: number | null; fase?: string | null };
type GrupoApi = {
  id_grupo_ativo?: number | null;
  id_tipo_ativo?: number | null;
  codigo_ativo?: string | null;
  fases?: FaseGrupo[] | null;
};

type AtivoApi = {
  id_ativo?: number | null;
  id_subestacao?: number | null;
  id_funcao_operacao?: number | null;
  id_grupo_ativo?: number | null;
  id_tipo_ativo?: number | null;
  codigo_ativo?: string | null;
  fase?: string | null;
  bay?: string | null;
  funcao_operacao?: { codigo?: string | null } | null;
  subestacao?: { nome?: string | null; sigla?: string | null } | string | null;
};

function nomeDaInstalacao(subestacao: AtivoApi["subestacao"]): string | null {
  if (!subestacao) return null;
  if (typeof subestacao === "string") return subestacao || null;
  return subestacao.nome ?? subestacao.sigla ?? null;
}

export async function carregarPrefillDocumentoAtivo(idAtivo: number): Promise<PrefillDocumentoAtivo> {
  const { data: ativo } = await api.get<AtivoApi>(`/ativo/${idAtivo}`);

  let idGrupo = ativo.id_grupo_ativo ?? null;
  let idTipo = ativo.id_tipo_ativo ?? null;
  let grupo: GrupoApi | undefined;

  if (!idGrupo && ativo.id_funcao_operacao) {
    try {
      const { data } = await api.get<GrupoApi[]>(
        `/funcoes-operacao/${ativo.id_funcao_operacao}/grupos-ativos`,
      );
      grupo = (Array.isArray(data) ? data : []).find((item) =>
        (item.fases ?? []).some((fase) => Number(fase.id_ativo) === Number(idAtivo)),
      );
      if (grupo) {
        idGrupo = grupo.id_grupo_ativo ?? null;
        idTipo = grupo.id_tipo_ativo ?? idTipo;
      }
    } catch {
      grupo = undefined;
    }
  }

  // Grupo com mais de uma fase (ou fases identificadas) exige escolher a fase.
  const fases = grupo?.fases ?? [];
  const exigeFase = fases.length > 1 || fases.some((fase) => !!fase.fase);
  const escopo: PrefillDocumentoAtivo["escopo_ativo"] = idGrupo
    ? exigeFase
      ? "FASE"
      : "GRUPO"
    : null;

  return {
    id_subestacao: ativo.id_subestacao ?? null,
    id_funcao_operacao: ativo.id_funcao_operacao ?? null,
    id_grupo_ativo: idGrupo,
    id_tipo_ativo: idTipo,
    escopo_ativo: escopo,
    id_ativo: escopo === "GRUPO" ? null : Number(ativo.id_ativo ?? idAtivo),
    codigo_ativo: ativo.codigo_ativo ?? null,
    fase: ativo.fase ?? null,
    bay: ativo.bay ?? null,
    nome_instalacao: nomeDaInstalacao(ativo.subestacao),
    funcao_codigo: ativo.funcao_operacao?.codigo ?? null,
  };
}
