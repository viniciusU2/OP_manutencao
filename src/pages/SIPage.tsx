import Container from "../components/Container";
import { SIPage1 } from "./SI_table";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import type { Subestacao } from "../types/Subestacao";
import { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { filtroInicialInstalacao } from "../lib/instalacaoPreferida";





/* FILTER CARD */

const FilterCard = styled.div`
  background: white;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);

  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 220px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;

  @media (max-width: 720px) {
    width: 100%;
    min-width: 0;
  }
`;

const Select = styled.select`
  min-width: 180px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;

  @media (max-width: 720px) {
    width: 100%;
    min-width: 0;
  }
`;


export function SIPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [search, setSearch] = useState("");
  const [subestacao, setSubestacao] = useState<Subestacao[]>([]);
  const [subestacaoSelecionada, setSubestacaoSelecionada] = useState("all");
  const [status, setStatus] = useState("all");


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

  return (
    <Container>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2>Solicitação de Intervenção</h2>

        <button
          onClick={() => navigate("/si/nova")}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white sm:w-auto"
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
