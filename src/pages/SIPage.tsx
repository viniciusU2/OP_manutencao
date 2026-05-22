import Container from "../components/Container";
import { SIPage1 } from "./SI_table";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import type { Subestacao } from "../types/Subestacao";
import { useEffect, useState } from "react";
import api from "../api/api";





/* FILTER CARD */

const FilterCard = styled.div`
  background: white;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);

  display: flex;
  gap: 12px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
`;

const Select = styled.select`
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
`;


export function SIPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [subestacao, setSubestacao] = useState<Subestacao[]>([]);
  const [subestacaoSelecionada, setSubestacaoSelecionada] = useState("");
  const [status, setStatus] = useState("all");


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
    if (subestacao.length > 0) {
      setSubestacaoSelecionada(String(subestacao[0]?.id_subestacao ?? "all"));
    }
  }, [subestacao]);
  

  return (
    <Container>
      <div className="flex justify-between mb-4">
        <h2>Solicitação de Intervenção</h2>

        <button
          onClick={() => navigate("/si/nova")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Nova SI
        </button>
      </div>

      
      <FilterCard>

        <SearchInput
          placeholder="Buscar solicitacão de intervenção..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

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

<Select
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
</Select>


      </FilterCard>

      <SIPage1 
      
       search={search}
        status={status}
        subestacao={subestacaoSelecionada} />
    </Container>
  );
}
