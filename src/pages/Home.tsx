import { useEffect, useState } from "react";
import api from "../api/api";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import disjuntor from "../assets/tipos/disjuntor.jpeg";
import chaveSeccionadora from "../assets/tipos/chaveSeccionadora.jpeg";
import rele from "../assets/tipos/rele.jpeg";
import TC from "../assets/tipos/tranformadorCorrente.jpeg";
import ParaRaio from "../assets/tipos/ParaRaio.jpeg";
import reator from "../assets/tipos/reator.jpeg";
import GMG from "../assets/tipos/grupoMotorGerador.jpeg";
import tp from "../assets/tipos/TP.webp";
import background from "../assets/fundo-tratado.png"; // caminho da sua imagem










interface TipoAtivo {
  id_tipo_ativo: number;
  nome: string;
  descricao?: string;
}

const PageContainer = styled.div`
  padding: 40px;
  min-height: 100vh;
  padding: 40px;

 &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url(${background});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.25;  /* ðŸ‘ˆ controla transparÃªncia */
    z-index: -1;
  }
  




`;

const Title = styled.h1`
  font-size: 32px;
  margin-bottom: 40px;
  font-family: "Poppins", sans-serif;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 30px;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: 0.3s;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 18px 32px rgba(0, 0, 0, 0.18);
  }
`;

const Image = styled.div<{ bg: string }>`
  height: 220px;
  background-image: url(${(props) => props.bg});
  background-size: cover;
  background-position: center;
`;

const Content = styled.div`
  padding: 20px;
`;

const Nome = styled.h2`
  margin: 0;
  font-size: 20px;
`;

const Descricao = styled.p`
  margin-top: 8px;
  color: #6b7280;
  font-size: 14px;
`;

export default function Home() {
  const [tipos, setTipos] = useState<TipoAtivo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/tipo-ativo").then((res) => {
      setTipos(res.data);
    });
  }, []);

  
  function imagemPorTipo(nome: string) {
  const imagens: any = {
    
    Disjuntor: disjuntor,
    Seccionadora: chaveSeccionadora,
    "RelÃ© de ProteÃ§Ã£o":rele,
    "TC - Transformador de Corrente":TC,
    "Para-raios":ParaRaio,
    "Reator":reator,
    "Grupo Gerador": GMG,
    "TP - Transformador de Potencial": tp,




  
   
  };

  return imagens[nome];
}

  return (
    <PageContainer>
      <Title>Gereciamento de Ativos</Title>

      <Grid>
        {tipos.map((tipo) => (
          <Card
            key={tipo.id_tipo_ativo}
            onClick={() => navigate(`/tipoativo/${tipo.id_tipo_ativo}`)}
          >
            <Image bg={imagemPorTipo(tipo.nome)} />

            <Content>
              <Nome>{tipo.nome}</Nome>
              <Descricao>{tipo.descricao}</Descricao>
            </Content>
          </Card>
        ))}
      </Grid>
    </PageContainer>
  );
}
