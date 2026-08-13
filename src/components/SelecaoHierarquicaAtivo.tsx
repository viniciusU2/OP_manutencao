import { useEffect, useState } from "react";
import api from "../api/api";
import type { GrupoAtivo, EscopoAtivo } from "../types/GrupoAtivo";
import type { FuncaoOperacao } from "../types/FuncaoOperacao";

type Valor = {
  id_funcao_operacao?: number | null;
  id_grupo_ativo?: number | null;
  escopo_ativo?: EscopoAtivo | null;
  id_ativo?: number | null;
};

export function SelecaoHierarquicaAtivo({ idSubestacao, nomeInstalacao, permiteFuncaoCompleta = false, value, onChange }: {
  idSubestacao?: number | null;
  nomeInstalacao?: string | null;
  permiteFuncaoCompleta?: boolean;
  value: Valor;
  onChange: (value: Valor) => void;
}) {
  const [funcoes, setFuncoes] = useState<FuncaoOperacao[]>([]);
  const [grupos, setGrupos] = useState<GrupoAtivo[]>([]);
  const grupo = grupos.find((item) => item.id_grupo_ativo === value.id_grupo_ativo);
  const exigeFase = !!grupo && (grupo.fases.length > 1 || !!grupo.fases[0]?.fase);

  useEffect(() => {
    if (!idSubestacao) { setFuncoes([]); setGrupos([]); return; }
    api.get(`/subestacoes/${idSubestacao}/funcoes-operacao`).then(({ data }) => setFuncoes(data)).catch(() => setFuncoes([]));
  }, [idSubestacao]);
  useEffect(() => {
    if (!value.id_funcao_operacao) { setGrupos([]); return; }
    api.get(`/funcoes-operacao/${value.id_funcao_operacao}/grupos-ativos`).then(({ data }) => setGrupos(data)).catch(() => setGrupos([]));
  }, [value.id_funcao_operacao]);

  return <>
    <label>Função de Transmissão</label>
    <select value={value.id_funcao_operacao ?? ""} disabled={!idSubestacao} onChange={(e) => onChange({ id_funcao_operacao: Number(e.target.value) || null, id_grupo_ativo: null, escopo_ativo: null, id_ativo: null })}>
      <option value="">Selecione</option>{funcoes.map((fo) => <option key={fo.id_funcao_operacao} value={fo.id_funcao_operacao}>{fo.codigo}{fo.descricao ? ` — ${fo.descricao}` : ""}</option>)}
    </select>
    <label>Ativo</label>
    <select
      value={value.escopo_ativo === "FUNCAO" ? "FUNCAO" : value.id_grupo_ativo ?? ""}
      disabled={!value.id_funcao_operacao}
      onChange={(e) => {
        if (e.target.value === "FUNCAO") {
          onChange({ ...value, id_grupo_ativo: null, escopo_ativo: "FUNCAO", id_ativo: null });
          return;
        }
        onChange({ ...value, id_grupo_ativo: Number(e.target.value) || null, escopo_ativo: null, id_ativo: null });
      }}
    >
      <option value="">Selecione</option>
      {permiteFuncaoCompleta && <option value="FUNCAO">{nomeInstalacao || "Linha de transmissão"}</option>}
      {grupos.map((item) => <option key={item.id_grupo_ativo} value={item.id_grupo_ativo}>{item.codigo_ativo} — {item.tipo_ativo || "Ativo"}{item.bay ? ` (${item.bay})` : ""}</option>)}
    </select>
    {value.escopo_ativo === "FUNCAO" && <small style={{ color: "#0f766e" }}>O documento será vinculado diretamente à linha, sem ativo individual.</small>}
    {grupo?.inconsistencia_sem_fase && <small style={{ color: "#b45309" }}>Inconsistência: há componentes sem fase. Corrija o cadastro antes de selecionar.</small>}
    {grupo && !grupo.inconsistencia_sem_fase && <>
      <label>Escopo</label>
      <select value={value.escopo_ativo ?? ""} onChange={(e) => onChange({ ...value, escopo_ativo: (e.target.value || null) as EscopoAtivo | null, id_ativo: null })}>
        <option value="">Selecione</option><option value="GRUPO">Grupo completo — todas as fases</option>{exigeFase && <option value="FASE">Fase específica</option>}
      </select>
      {value.escopo_ativo === "FASE" && <><label>Fase</label><select value={value.id_ativo ?? ""} onChange={(e) => onChange({ ...value, id_ativo: Number(e.target.value) || null })}><option value="">Selecione</option>{grupo.fases.map((item) => <option key={item.id_ativo} value={item.id_ativo}>{item.fase ? `${item.fase}` : `Componente ${item.id_ativo}`}</option>)}</select></>}
    </>}
  </>;
}

