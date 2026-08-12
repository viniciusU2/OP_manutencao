import { useEffect, useState } from "react";
import styled from "styled-components";
import Container from "../components/Container";
import { OsPage1 } from "./Os_table";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import type { Subestacao } from "../types/Subestacao";
import { useAuth } from "../context/AuthContext";
import { filtroInicialInstalacao } from "../lib/instalacaoPreferida";
import { usePersistentSearch } from "../lib/usePersistentSearch";
import type { TipoAtivo } from "../types/TipoAtivo";
import { FilterPageFrame, FilterSidebar } from "../components/FilterSidebar";



/* HEADER */

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap; /* 🔥 permite quebrar em telas menores */
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap; /* 🔥 evita quebrar layout com vários botões */

  @media (max-width: 560px) {
    width: 100%;

    button {
      flex: 1 1 150px;
    }
  }
`;

const TitleBlock = styled.div`
  h2 {
    margin: 0;
    font-weight: 600;
  }

  p {
    margin: 4px 0 0;
    color: #6b7280;
    font-size: 14px;
  }
`;

const Button = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #1e40af;
  }

  @media (max-width: 560px) {
    width: 100%;
  }
`;

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


export default function ControleOrdemServicoPage() {

  const { usuario } = useAuth();
  const [search, setSearch] = usePersistentSearch("os");
  const [esquema_servicos, setEsquema_servicos] = useState("");
  const [subestacao, setSubestacao] = useState<Subestacao[]>([]);
  const [subestacaoSelecionada, setSubestacaoSelecionada] = useState("all");
  const [status, setStatus] = useState("all");
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);
  const [tipoEquipamento, setTipoEquipamento] = useState("all");
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(true);
  const navigate = useNavigate();

  
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

      <PageHeader>
        <TitleBlock>
          <h2>Ordens de Serviço</h2>
          <p>Gerenciamento das ordens cadastradas</p>
        </TitleBlock>

         <HeaderActions>

         
        <Button onClick={() => navigate("/os")}>
          + Criar OS
        </Button>
        <Button onClick={() => navigate("/os/lote")}>
          + OS/tipo ativo
        </Button>
        </HeaderActions>

    
      </PageHeader>

      <SearchArea>
        <SearchIcon aria-hidden="true">⌕</SearchIcon>
        <SearchInput
          placeholder="Buscar ordem de serviço..."
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

  <FilterField>Esquema de serviço
  <Select
          value={esquema_servicos}
          onChange={(e) => setEsquema_servicos(e.target.value)}
        >
          <option value="all">Todos esquema de serviço</option>
              <option value="MANUTENÇÃO PREVENTIVA">Manutenção Preventiva</option>
              <option value="PREVENTIVA SEMANAL">Preventiva Semanal</option>
              <option value="PREVENTIVA MENSAL">Preventiva Mensal</option>
              <option value="PREVENTIVA BIMESTRAL">Preventiva Bimestral</option>
              <option value="PREVENTIVA TRIMESTRAL">Preventiva Trimestral</option>
              <option value="PREVENTIVA SEMESTRAL">Preventiva Semestral</option>
              <option value="PREVENTIVA ANUAL">Preventiva Anual</option>
              <option value="PREVENTIVA BIANUAL">Preventiva Bianual</option>
              <option value="PREVENTIVA TRIANUAL">Preventiva Trianual</option>
              <option value="PREVENTIVA A 5 ANOS">Preventiva a 5 anos</option>
              <option value="PREVENTIVA A 6 ANOS">Preventiva a 6 anos</option>
              <option value="MANUTENÇÃO CORRETIVA">Manutenção Corretiva</option>
              <option value="MANUTENÇÃO PREDITIVA">Manutenção Preditiva</option>
              <option value="Monitoramento">Monitoramento</option>
              <option value="Atendimento Recomendação">Atendimento Recomendação</option>
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
      value={String(s.id_subestacao ?? "")}
    >
      {s.nome}
    </option>
  ))}
</Select></FilterField>


      </>}>
      <OsPage1
        search={search}
        status={status}
        subestacao={subestacaoSelecionada}
        esquema_servicos={esquema_servicos}
        tipoEquipamento={tipoEquipamento}
      />
      </FilterSidebar>


    </Container></FilterPageFrame>
  );
}
