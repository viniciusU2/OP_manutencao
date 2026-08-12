import Container from "../components/Container";
import { SIPage1 } from "./SI_table";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import type { Subestacao } from "../types/Subestacao";
import { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { filtroInicialInstalacao } from "../lib/instalacaoPreferida";
import { usePersistentSearch } from "../lib/usePersistentSearch";
import type { TipoAtivo } from "../types/TipoAtivo";
import { FilterPageFrame, FilterSidebar } from "../components/FilterSidebar";





/* FILTER CARD */

const FilterField=styled.label`display:flex;flex-direction:column;gap:5px;color:#475569;font-size:12px;font-weight:600;`;

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
  height:40px; padding:8px 10px;
  font-size: 14px;
  border-radius:8px; border:1px solid #cbd5e1; background:#fff; color:#0f172a;
  &:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1);}

  @media (max-width: 720px) {
    width: 100%;
    min-width: 0;
  }
`;


export function SIPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [search, setSearch] = usePersistentSearch("si");
  const [subestacao, setSubestacao] = useState<Subestacao[]>([]);
  const [subestacaoSelecionada, setSubestacaoSelecionada] = useState("all");
  const [status, setStatus] = useState("all");
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);
  const [tipoEquipamento, setTipoEquipamento] = useState("all");
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(true);


    /* ===============================
       CARREGAR SUBESTAÇÕES
    =============================== */
    useEffect(() => {
      api
        .get("/subestacao")
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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2>Solicitação de Intervenção</h2>

        <button
          onClick={() => navigate("/si/nova")}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white sm:w-auto"
        >
          + Nova SI
        </button>
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

<FilterField>Instalação<Select
  value={subestacaoSelecionada}
  onChange={(e) => setSubestacaoSelecionada(e.target.value)}
>

  <option value="all">Todas instalacoes</option>
  {subestacao.map((s) => (
    <option
      key={s.id_subestacao}
      value={s.id_subestacao}
    >
      {s.nome}
    </option>
  ))}
</Select></FilterField>


      </>}>

      <SIPage1 
      
       search={search}
        status={status}
        subestacao={subestacaoSelecionada}
        tipoEquipamento={tipoEquipamento} />
      </FilterSidebar>
    </Container></FilterPageFrame>
  );
}
