import { useEffect, useState } from "react";
import styled from "styled-components";
import Container from "../components/Container";
import { OsPage1 } from "./Os_table";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import type { Subestacao } from "../types/Subestacao";



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
`;

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


export default function ControleOrdemServicoPage() {

  const [search, setSearch] = useState("");
  const [esquema_servicos, setEsquema_servicos] = useState("");
  const [subestacao, setSubestacao] = useState<Subestacao[]>([]);
  const [subestacaoSelecionada, setSubestacaoSelecionada] = useState("");
  const [status, setStatus] = useState("all");
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
  if (subestacao.length > 0) {
    setSubestacaoSelecionada(String(subestacao[0]?.id_subestacao ?? "all"));
  }
}, [subestacao]);



  return (
    <Container>

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

      <FilterCard>

        <SearchInput
          placeholder="Buscar ordem de serviço..."
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
          value={esquema_servicos}
          onChange={(e) => setEsquema_servicos(e.target.value)}
        >
          <option value="all">Todos esquema de serviço</option>
              <option value="MANUTENÇÃO PREVENTIVA">Manutenção Preventiva</option>
              <option value="MANUTENÇÃO CORRETIVA">Manutenção Corretiva</option>
              <option value="Monitoramento">Monitoramento</option>
              <option value="Atendimento Recomendação">Atendimento Recomendação</option>
        </Select>

        

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


      </FilterCard>
      <OsPage1
        search={search}
        status={status}
        subestacao={subestacaoSelecionada}
        esquema_servicos={esquema_servicos}
      />


    </Container>
  );
}
