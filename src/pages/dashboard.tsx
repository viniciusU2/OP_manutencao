import { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import background from "../assets/fundo.jpeg";

import {
  Zap, FileText, ClipboardList, Loader2
} from "lucide-react";

import { StatsCard } from "../components/StatsCard";
import { CalendarioOSSI } from "../components/calendar";

/* ==============================
TIPOS
============================== */

interface Ativo {
  id_ativo: number;
  nome: string;
  criticidade?: string;
  status?: string;
  id_subestacao?: number;
}

interface OS {
  id_os: number;
  numero_os: string;
  status: string;
  id_subestacao?: number;
}

interface SS {
  numero_ss: string;
  status: string;
  id_subestacao?: number;
}

interface SI {
  id_si: number;
  numero_si: string;
  status_operacao?: string;
  id_subestacao?: number;
}

interface Subestacao {
  id_subestacao: number;
  nome: string;
}

/* ==============================
STYLES
============================== */

const PageContainer = styled.div`
  padding: 32px;
  min-height: 100vh;
  position: relative;
  font-family: "Poppins", sans-serif;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url(${background});
    background-size: cover;
    background-position: center;
    opacity: 0.1;
    z-index: -1;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 16px;
`;

/* 🔥 NOVO FILTRO */

const FilterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FilterLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const ClearButton = styled.button`
  font-size: 12px;
  color: #6366f1;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const FilterChips = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Chip = styled.button<{ active: boolean }>`
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid ${({ active }) => active ? "#6366f1" : "#e5e7eb"};
  background: ${({ active }) => active ? "#6366f1" : "#fff"};
  color: ${({ active }) => active ? "#fff" : "#374151"};
  font-size: 13px;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background: ${({ active }) => active ? "#4f46e5" : "#f3f4f6"};
  }
`;

const Select = styled.select`
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  background: #f9fafb;
  min-width: 260px;

  &:focus {
    border-color: #6366f1;
    background: #fff;
    outline: none;
  }
`;

/* RESTO */

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
`;

const CardTitle = styled.h2`
  font-size: 16px;
  margin-bottom: 12px;
  font-weight: 600;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Item = styled.div`
  padding: 12px 14px;
  border-radius: 10px;
  background: #f9fafb;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  justify-content: space-between;

  &:hover {
    background: #eef2ff;
    transform: translateX(4px);
  }
`;

const Badge = styled.span<{ color: string }>`
  background: ${({ color }) => color};
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
`;

const Empty = styled.div`
  color: #6b7280;
  text-align: center;
  padding: 20px 0;
`;

/* ==============================
HELPER
============================== */

function getStatusColor(status: string) {
  if (status === "CONCLUIDA" || status === "ENCERRADA") return "#16a34a";
  if (status === "CANCELADA") return "#6b7280";
  return "#f59e0b";
}

/* ==============================
DASHBOARD
============================== */

export function Dashboard() {
  const navigate = useNavigate();

  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [os, setOS] = useState<OS[]>([]);
  const [ss, setSS] = useState<SS[]>([]);
  const [si, setSI] = useState<SI[]>([]);
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [filtroSubestacao, setFiltroSubestacao] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ativosRes, osRes, ssRes, siRes, subRes] = await Promise.all([
          api.get("/ativo"),
          api.get("/os"),
          api.get("/ss"),
          api.get("/si"),
          api.get("/subestacao"),
        ]);

        setAtivos(ativosRes.data || []);
        setOS(osRes.data || []);
        setSS(ssRes.data || []);
        setSI(siRes.data || []);
        setSubestacoes(subRes.data || []);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const dadosFiltrados = useMemo(() => {
    const filterFn = (item: any) => {
      if (!filtroSubestacao) return true;
      return Number(item.id_subestacao) === Number(filtroSubestacao);
    };

    return {
      ativos: ativos.filter(filterFn),
      os: os.filter(filterFn),
      ss: ss.filter(filterFn),
      si: si.filter(filterFn),
    };
  }, [ativos, os, ss, si, filtroSubestacao]);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <PageContainer>
      <Title>Dashboard de Manutenção</Title>

      {/* 🔥 FILTRO NOVO */}
      <FilterWrapper>
        <FilterHeader>
          <FilterLabel>Filtrar por Subestação</FilterLabel>
          {filtroSubestacao && (
            <ClearButton onClick={() => setFiltroSubestacao("")}>
              Limpar filtro
            </ClearButton>
          )}
        </FilterHeader>

        {/* Chips */}
        <FilterChips>
          <Chip
            active={!filtroSubestacao}
            onClick={() => setFiltroSubestacao("")}
          >
            Todas
          </Chip>

          {subestacoes.slice(0, 6).map((sub) => (
            <Chip
              key={sub.id_subestacao}
              active={Number(filtroSubestacao) === sub.id_subestacao}
              onClick={() => setFiltroSubestacao(String(sub.id_subestacao))}
            >
              {sub.nome}
            </Chip>
          ))}
        </FilterChips>

        {/* Select fallback */}
        <Select
          value={filtroSubestacao}
          onChange={(e) => setFiltroSubestacao(e.target.value)}
        >
          <option value="">Todas as Subestações</option>
          {subestacoes.map((sub) => (
            <option key={sub.id_subestacao} value={sub.id_subestacao}>
              {sub.nome}
            </option>
          ))}
        </Select>
      </FilterWrapper>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard title="SI Abertas" value={dadosFiltrados.si.length} icon={Zap} color="blue" />
        <StatsCard title="SS Abertas" value={dadosFiltrados.ss.length} icon={FileText} color="amber" />
        <StatsCard title="OS Ativas" value={dadosFiltrados.os.length} icon={ClipboardList} color="violet" />
      </div>

      <Card>
        <CardTitle>Calendário</CardTitle>
        <CalendarioOSSI />
      </Card>

      <SectionGrid>
        <Card>
          <CardTitle>SS</CardTitle>
          <List>
            {dadosFiltrados.ss.length === 0 ? (
              <Empty>Nenhuma</Empty>
            ) : (
              dadosFiltrados.ss.slice(0, 5).map((s) => (
                <Item key={s.numero_ss} onClick={() => navigate(`/ss/${s.numero_ss}`)}>
                  <span>{s.numero_ss}</span>
                  <Badge color={getStatusColor(s.status)}>{s.status}</Badge>
                </Item>
              ))
            )}
          </List>
        </Card>
      </SectionGrid>
    </PageContainer>
  );
}