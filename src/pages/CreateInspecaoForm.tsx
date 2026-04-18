import { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import api from "../api/api";
import Container from "../components/Container";
import type { Periodicidade } from "../types/ItemInspecao";
import type { TipoAtivo } from "../types/TipoAtivo";
import disjuntor from "../assets/tipos/disjuntor.jpeg";
import chaveSeccionadora from "../assets/tipos/chaveSeccionadora.jpeg";
import rele from "../assets/tipos/rele.jpeg";
import TC from "../assets/tipos/tranformadorCorrente.jpeg";
import ParaRaio from "../assets/tipos/ParaRaio.jpeg";
import reator from "../assets/tipos/reator.jpeg";
import GMG from "../assets/tipos/grupoMotorGerador.jpeg";
import tp from "../assets/tipos/TP.webp";
import { AtivoPage1 } from "./Ativos-table";



/* ================= TYPES ================= */

type ItemVerificacao = {
  id: number;
  nome_item: string;
};

/* ================= STYLES ================= */

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const TitleArea = styled.div`
  h2 {
    font-size: 28px;
    margin: 0;
  }

  p {
    margin-top: 4px;
    color: #6b7280;
    font-size: 14px;
  }
`;

const AtivoImage = styled.img`
  width: 180px;
  height: 180px;
  object-fit: contain;
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 13px;

  background: ${(p) => (p.active ? "#2563eb" : "#e5e7eb")};
  color: ${(p) => (p.active ? "#fff" : "#374151")};

  &:hover {
    background: ${(p) => (p.active ? "#1e40af" : "#d1d5db")};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    border: 1px solid #e5e7eb;
    padding: 10px;
    text-align: left;
  }

  th {
    background: #f3f4f6;
  }
`;

/* ================= CONSTANTES ================= */

const periodicidades: Periodicidade[] = [
  "SEMANAL",
  "MENSAL",
  "BIMESTRAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "3_ANOS",
  "5_ANOS",
  "6_ANOS",
];

/* ================= COMPONENT ================= */

export function CreateInspecaoForm() {
  const { tipo } = useParams();
  const idTipo = Number(tipo);

  const [ativos, setAtivos] = useState<TipoAtivo[]>([]);
  const [itens, setItens] = useState<ItemVerificacao[]>([]);
  const [periodicidade, setPeriodicidade] =
    useState<Periodicidade>("SEMESTRAL");
  const [loading, setLoading] = useState(false);

  /* ================= LOAD ATIVOS ================= */

  useEffect(() => {
    carregarAtivos();
  }, []);

  async function carregarAtivos() {
    try {
      const response = await api.get("/tipo-ativo");
      setAtivos(response.data);
    } catch (error) {
      console.error("Erro ao carregar tipos de ativo", error);
    }
  }

  /* ================= BUSCAR ITENS ================= */

  useEffect(() => {
    if (!idTipo) return;
    buscarItens();
  }, [idTipo, periodicidade]);

  async function buscarItens() {
    try {
      setLoading(true);

      const response = await api.get(
        `/item/por-tipo-ativo/${idTipo}`,
        {
          params: { periodicidade },
        }
      );

      setItens(response.data);
    } catch (error) {
      console.error("Erro ao buscar itens", error);
      setItens([]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= ATIVO SELECIONADO ================= */

  const ativoSelecionado = ativos.find(
    (a) => a.id_tipo_ativo === idTipo
  );

  /* ================= IMAGEM ================= */


   
  function imagemPorTipo(nome: string) {
  const imagens: any = {
    
    Disjuntor: disjuntor,
    Seccionadora: chaveSeccionadora,
    "Relé de Proteção":rele,
    "TC - Transformador de Corrente":TC,
    "Para-raios":ParaRaio,
    "Reator":reator,
    "Grupo Gerador": GMG,
    "TP - Transformador de Potencial": tp,}



    return imagens[nome];
  }




  /* ================= RENDER ================= */

  return (
    <Container>
      <Header>
        <TitleArea>
          <h2>{ativoSelecionado?.nome || "Carregando..."}</h2>
          <p>{ativoSelecionado?.descricao}</p>
        </TitleArea>

        {ativoSelecionado && (
          <AtivoImage
            src={imagemPorTipo(ativoSelecionado.nome)}
            alt={ativoSelecionado.nome}
          />
        )}
      </Header>
  <AtivoPage1 tipoId={idTipo} />
   <TitleArea>  <h2>Inspeções</h2></TitleArea>



      <Card>
        <TabsContainer>
          {periodicidades.map((p) => (
            <TabButton
              key={p}
              active={periodicidade === p}
              onClick={() => setPeriodicidade(p)}
            >
              {p}
            </TabButton>
          ))}
        </TabsContainer>

        {loading && <p>Carregando...</p>}

        {!loading && itens.length > 0 && (
          <Table>
            <thead>
              <tr>
                <th>Item</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id}>
                  <td>{item.nome_item}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {!loading && itens.length === 0 && (
          <p>Nenhum item encontrado para essa periodicidade.</p>
        )}
      </Card>
      
    </Container>
  );
}