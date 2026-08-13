import Container from "../components/Container";
import { SSPage1} from "./SS_table";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import type { Subestacao } from "../types/Subestacao";
import { useEffect, useState, type ChangeEvent } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { filtroInicialInstalacao } from "../lib/instalacaoPreferida";
import { toast } from "sonner";
import { usePersistentSearch } from "../lib/usePersistentSearch";
import type { TipoAtivo } from "../types/TipoAtivo";
import { FilterPageFrame, FilterSidebar } from "../components/FilterSidebar";
import { AdvancedDocumentFilters, type AdvancedFilter } from "../components/AdvancedDocumentFilters";
import { PreventiveProgressStrip } from "../components/PreventiveProgressStrip";

const ssFilterFields=["numero_ss","numero_os","data_hora_solicitacao","data_hora_abertura","data_hora_limite","solicitante","matricula","funcao","telefone","email","orgao","instalacao","localizacao","complemento","id_ativo","id_grupo_ativo","esquema_servico","centro_custo","causa","causa_secundaria","equipe","descricao_problema","prioridade","status","emissor","editado_por"].map(value=>({value,label:value.replaceAll("_"," ")}));





/* FILTER CARD */

const FilterField = styled.label`display:flex; flex-direction:column; gap:5px; color:#475569; font-size:12px; font-weight:600;`;

const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  padding: 12px 42px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: white;
  outline: none;
  transition: border-color .2s, box-shadow .2s;
  &:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, .12); }

  @media (max-width: 720px) {
    width: 100%;
    min-width: 0;
  }
`;
const SearchArea = styled.div`position:relative; margin-bottom:16px; padding:12px; border-radius:12px; background:#f1f5f9;`;
const SearchIcon = styled.span`position:absolute; left:27px; top:50%; transform:translateY(-50%); color:#64748b; pointer-events:none;`;
const ClearSearch = styled.button`position:absolute; right:24px; top:50%; transform:translateY(-50%); border:0; background:transparent; color:#64748b; font-size:20px; cursor:pointer; padding:4px; &:hover{color:#0f172a;}`;

const Select = styled.select`
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 8px 10px;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  &:focus { outline: none; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.1); }

  @media (max-width: 720px) {
    width: 100%;
    min-width: 0;
  }
`;

const ClearButton = styled.button`
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) { background: #f1f5f9; }
  &:disabled { cursor: not-allowed; opacity: 0.5; }

  @media (max-width: 720px) { width: 100%; }
`;

const ActiveFilters = styled.span`
  align-self: center;
  padding: 4px 9px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
`;


export function SSPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [search, setSearch] = usePersistentSearch("ss");
  const [subestacao, setSubestacao] = useState<Subestacao[]>([]);
  const [subestacaoSelecionada, setSubestacaoSelecionada] = useState("all");
  const [status, setStatus] = useState("all");
  const [prazo, setPrazo] = useState("all");
  const [importando, setImportando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);
  const [tipoEquipamento, setTipoEquipamento] = useState("all");
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(true);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilter[]>([]);

  const totalFiltrosAtivos = [
    search.trim(),
    status !== "all",
    subestacaoSelecionada !== "all",
    prazo !== "all",
    tipoEquipamento !== "all",
  ].filter(Boolean).length;

  function limparFiltros() {
    setSearch("");
    setStatus("all");
    setSubestacaoSelecionada("all");
    setPrazo("all");
    setTipoEquipamento("all");
  }

  async function importarSS(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    setImportando(true);
    try {
      const { data } = await api.post("/ss/importar-massa", formData, {
        params: { emissor: usuario?.nome || undefined },
      });
      setRefreshKey((valor) => valor + 1);

      if (data.total_erros) {
        const detalhes = data.erros
          .slice(0, 3)
          .map((erro: { linha: number; erro: string }) => `Linha ${erro.linha}: ${erro.erro}`)
          .join(" | ");
        toast.warning(
          `${data.total_criadas} SS criadas e ${data.total_erros} linhas rejeitadas. ${detalhes}`,
          { duration: 12000 }
        );
      } else {
        toast.success(`${data.total_criadas} SS criadas com sucesso.`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail ?? "Erro ao importar a planilha de SS.");
    } finally {
      setImportando(false);
    }
  }


    /* ===============================
       CARREGAR SUBESTAÇÕES
    =============================== */
    useEffect(() => {
      api
        .get("/subestacao/ativas")
        .then((res) => setSubestacao(res.data))
        .catch((err) =>
          console.error("Erro ao carregar subestações:", err)
        );
    }, []);

    useEffect(() => {
      setSubestacaoSelecionada(filtroInicialInstalacao(usuario, subestacao));
    }, [subestacao, usuario]);

    useEffect(() => {
      api.get("/tipo-ativo").then((res) => setTiposAtivo(res.data)).catch((err) =>
        console.error("Erro ao carregar tipos de equipamento:", err)
      );
    }, []);
  
  return (
    <FilterPageFrame $filtersOpen={filtrosVisiveis}><Container>
      <PreventiveProgressStrip subestacao={subestacaoSelecionada} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2>Solicitação de Intervenção</h2>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <label className={`w-full cursor-pointer rounded bg-emerald-600 px-4 py-2 text-center text-white sm:w-auto ${importando ? "cursor-not-allowed opacity-60" : ""}`}>
            {importando ? "Importando..." : "Criar SS em massa"}
            <input
              type="file"
              accept=".xlsx,.xlsm"
              className="hidden"
              disabled={importando}
              onChange={importarSS}
            />
          </label>

          <button
            onClick={() => navigate("/ss/nova")}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white sm:w-auto"
          >
            + Nova SS
          </button>
        </div>
      </div>

      
      <SearchArea>
        <SearchIcon aria-hidden="true">⌕</SearchIcon>
        <SearchInput
          placeholder="Buscar solicitacão de intervenção..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && <ClearSearch type="button" aria-label="Limpar busca" title="Limpar busca" onClick={() => setSearch("")}>×</ClearSearch>}
      </SearchArea>

      <FilterSidebar open={filtrosVisiveis} onOpenChange={setFiltrosVisiveis} filters={<>

        <FilterField>Status
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Todos status</option>
          <option value="ABERTA">Aberta</option>
          <option value="PROGRAMADA">Programada</option>
          <option value="ENCERRADA">Encerrada</option>
          <option value="EM_EXECUCAO">Em execucão</option>
        </Select>
        </FilterField>

        <FilterField>Tipo de equipamento
        <Select value={tipoEquipamento} onChange={(e) => setTipoEquipamento(e.target.value)}>
          <option value="all">Todos os tipos de equipamento</option>
          {tiposAtivo.map((tipo) => (
            <option key={tipo.id_tipo_ativo} value={String(tipo.id_tipo_ativo)}>{tipo.nome}</option>
          ))}
        </Select>
        </FilterField>

<FilterField>Instalação
<Select
  value={subestacaoSelecionada}
  onChange={(e) => setSubestacaoSelecionada(e.target.value)}
>

  <option value="all">Todas instalacoes</option>
  {subestacao.map((s) => (
    <option
      key={s.id_subestacao}
      value={String(s.id_subestacao ?? "")}
    >
      {s.nome}
    </option>
  ))}
</Select>
</FilterField>

        <FilterField>Prazo
        <Select
          value={prazo}
          aria-label="Prazo da SS"
          onChange={(e) => setPrazo(e.target.value)}
        >
          <option value="all">Todos os prazos</option>
          <option value="vencidas">Vencidas</option>
          <option value="hoje">Vencem hoje</option>
          <option value="proximos_7_dias">Próximos 7 dias</option>
          <option value="proximos_30_dias">Próximos 30 dias</option>
          <option value="proximos_60_dias">Próximos 60 dias</option>
          <option value="proximos_180_dias">Próximos 180 dias</option>
          <option value="sem_prazo">Sem data limite</option>
        </Select>
        </FilterField>
        <AdvancedDocumentFilters fields={ssFilterFields} value={advancedFilters} onChange={setAdvancedFilters}/>

        {totalFiltrosAtivos > 0 && (
          <ActiveFilters>
            {totalFiltrosAtivos} filtro{totalFiltrosAtivos > 1 ? "s" : ""} ativo{totalFiltrosAtivos > 1 ? "s" : ""}
          </ActiveFilters>
        )}

        <ClearButton type="button" onClick={limparFiltros} disabled={totalFiltrosAtivos === 0}>
          Limpar filtros
        </ClearButton>


      </>}> 

      <SSPage1 
      
       search={search}
        status={status}
        subestacao={subestacaoSelecionada}
        prazo={prazo}
        tipoEquipamento={tipoEquipamento}
        advancedFilters={advancedFilters}
        refreshToken={refreshKey} />
      </FilterSidebar>
    </Container></FilterPageFrame>
  );
}
