import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Lock,
  Mail,
  Smartphone,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import type { Usuario } from "../context/AuthContext";
import background from "../assets/fundo-tratado.png";
import ElectricianMascot from "../components/ElectricianMascot";

/* =========================================================
   LAYOUT PRINCIPAL
========================================================= */

const Page = styled.div`
  position: relative;

  min-height: 100vh;

  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 480px);

  overflow: hidden;

  background: #07111f;
  color: #f8fafc;

  &::before {
    content: "";
    position: absolute;
    inset: 0;

    background:
      linear-gradient(
        90deg,
        rgba(7, 17, 31, 0.2) 0%,
        rgba(7, 17, 31, 0.2) 48%,
        rgba(7, 17, 31, 0.2) 100%
      ),
      url(${background}) center / cover no-repeat;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Intro = styled.section`
  position: relative;
  z-index: 1;

  min-height: 100vh;
  padding: 56px 56px 170px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media (max-width: 900px) {
    min-height: 560px;
    padding: 32px 24px 150px;
  }
`;

/* =========================================================
   MARCA
========================================================= */

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  font-weight: 700;
`;

const BrandLogo = styled.img`
  width: 48px;
  height: 48px;
  flex: 0 0 48px;

  border-radius: 10px;
  object-fit: contain;

  box-shadow: 0 8px 24px rgba(2, 8, 23, 0.28);
`;

const BrandText = styled.div`
  display: grid;
  gap: 2px;

  strong {
    font-size: 20px;
    line-height: 1;
    letter-spacing: 0.08em;
  }

  span {
    color: #cbd5e1;
    font-size: 12px;
    font-weight: 500;
  }
`;

/* =========================================================
   APP MOBILE (LOGIN)
========================================================= */

const HeroWrapper = styled.div`
  width: 100%;
  max-width: 680px;
`;

const Hero = styled.div`
  width: 100%;
`;

const HeroFace = styled.div`
  padding: 24px 28px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);

  background: rgba(7, 17, 31, 0.68);

  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);

  box-shadow:
    0 18px 45px rgba(2, 8, 23, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  h1 {
    max-width: 620px;
    margin: 0;

    color: #ffffff;
    font-size: clamp(30px, 3.4vw, 42px);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.025em;

    text-shadow:
      0 3px 6px rgba(0, 0, 0, 0.7),
      0 10px 28px rgba(0, 0, 0, 0.45);
  }

  @media (max-width: 900px) {
    padding: 22px 18px;

    h1 {
      font-size: clamp(30px, 7.5vw, 40px);
    }
  }
`;

const Tagline = styled.p`
  width: 100%;
  max-width: 560px;
  margin: 12px 0 0;

  color: #dbeafe;
  font-size: 14px;
  line-height: 1.6;

  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.55);
`;

const HeroEyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;

  width: fit-content;
  margin-bottom: 10px;

  color: #93c5fd;

  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const HeroDownloadButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;

  min-height: 46px;
  margin-top: 20px;
  padding: 0 20px;

  border-radius: 9px;

  background: #2563eb;
  color: #ffffff;

  font-size: 14px;
  font-weight: 800;
  text-decoration: none;

  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.32);

  transition:
    background-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: #1d4ed8;

    transform: translateY(-1px);
    box-shadow: 0 14px 30px rgba(37, 99, 235, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const HeroDownloadMeta = styled.small`
  display: block;
  width: 100%;
  margin-top: 10px;

  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
`;

/* =========================================================
   CARROSSEL DO APP
========================================================= */

const APP_BASE = `${import.meta.env.BASE_URL}app/`;

interface SlideApp {
  imagem: string;
  tag: string;
  titulo: string;
  descricao: string;
  destaques: string[];
}

const slidesApp: SlideApp[] = [
  {
    imagem: "01-dashboard.webp",
    tag: "Visão geral",
    titulo: "Toda a operação em um só lugar",
    descricao:
      "Acompanhe OS abertas, execuções, solicitações, ativos e inspeções em um painel atualizado em tempo real.",
    destaques: [
      "Indicadores da operação",
      "Atalhos rápidos",
      "Últimas OS",
    ],
  },
  {
    imagem: "02-ordens-servico.webp",
    tag: "Ordens de serviço",
    titulo: "Da abertura ao encerramento",
    descricao:
      "Consulte, filtre e acompanhe ordens de serviço com prioridade, responsáveis, prazos e histórico completo.",
    destaques: [
      "Busca por nº, ativo ou instalação",
      "Filtros por status",
      "Detalhe da OS",
    ],
  },
  {
    imagem: "03-os-detalhe.webp",
    tag: "Em campo",
    titulo: "Cada etapa documentada",
    descricao:
      "Veja a identificação, a descrição dos serviços e o esquema de manutenção. Tudo o que a equipe precisa para executar.",
    destaques: [
      "Dados da OS",
      "Localização e ativo",
      "Esquema de serviços",
    ],
  },
  {
    imagem: "04-solicitacoes.webp",
    tag: "Solicitações",
    titulo: "Problemas relatados, solução acompanhada",
    descricao:
      "Registre SS e intervenções, acompanhe o status e consulte o histórico com filtros por instalação e prioridade.",
    destaques: [
      "SS e SI",
      "Filtros e busca",
      "Nova solicitação",
    ],
  },
  {
    imagem: "05-ativos.webp",
    tag: "Ativos",
    titulo: "Todos os ativos na palma da mão",
    descricao:
      "Consulte código, tipo, fabricante, modelo, número de série e localização de cada equipamento.",
    destaques: [
      "207 ativos",
      "Filtro por subestação",
      "Detalhe técnico",
    ],
  },
  {
    imagem: "06-inspecoes.webp",
    tag: "Inspeções",
    titulo: "Checklists de campo",
    descricao:
      "Realize inspeções com itens OK, NOK e N/A, fotos e observações — mesmo sem conexão com a internet.",
    destaques: [
      "Funciona offline",
      "Fotos no aparelho",
      "Sincronização automática",
    ],
  },
  {
    imagem: "07-nova-inspecao.webp",
    tag: "Offline",
    titulo: "Preencha agora, sincronize depois",
    descricao:
      "Selecione o ativo, responda o checklist e salve. Sem internet, os dados ficam no aparelho e são enviados quando a rede voltar.",
    destaques: [
      "Checklist por ativo",
      "Observação geral",
      "Envio automático",
    ],
  },
  {
    imagem: "08-sobreaviso.webp",
    tag: "Sobreaviso",
    titulo: "Escala e aprovações sem papel",
    descricao:
      "Consulte a escala, acompanhe solicitações de ajuste e aprove ou reprove tudo pelo celular.",
    destaques: [
      "Escala e períodos",
      "Ajustes pendentes",
      "Aprovação do gestor",
    ],
  },
  {
    imagem: "09-notificacoes.webp",
    tag: "Perfil e notificações",
    titulo: "Do seu jeito, com os avisos certos",
    descricao:
      "Defina a instalação padrão e receba lembretes de sobreaviso, OS, preventivas, SS e inspeções offline — com controle anti-spam.",
    destaques: [
      "Instalação padrão",
      "Notificações inteligentes",
      "Controle anti-spam",
    ],
  },
];

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(16px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const CarouselShell = styled.div`
  width: 100%;
  margin-top: 18px;
  padding-top: 18px;

  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CarouselViewport = styled.div`
  min-height: 390px;

  display: flex;
  align-items: center;

  @media (max-width: 600px) {
    min-height: 0;
  }
`;

const Slide = styled.div`
  width: 100%;

  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 28px;
  align-items: center;

  animation: ${slideIn} 0.4s ease both;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 18px;

    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const PhoneStage = styled.div`
  position: relative;
  width: 180px;

  display: flex;
  justify-content: center;

  @media (max-width: 600px) {
    width: 160px;
  }
`;

const PhoneGlow = styled.div`
  position: absolute;
  inset: 10% -20% 5%;

  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgba(37, 99, 235, 0.5) 0%,
    rgba(37, 99, 235, 0) 68%
  );

  filter: blur(18px);
  pointer-events: none;
`;

const Phone = styled.div`
  position: relative;
  z-index: 1;

  width: 180px;
  padding: 5px;

  aspect-ratio: 9 / 19.5;

  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 28px;

  background: linear-gradient(160deg, #1e293b 0%, #020617 70%);

  box-shadow:
    0 24px 55px rgba(2, 8, 23, 0.55),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);

  @media (max-width: 600px) {
    width: 160px;
    padding: 4px;

    border-radius: 25px;
  }
`;

const PhoneScreen = styled.div`
  position: relative;

  width: 100%;
  height: 100%;

  overflow: hidden;
  border-radius: 23px;

  background: #020617;

  img {
    display: block;

    width: 100%;
    height: 100%;

    object-fit: cover;
    object-position: top center;
  }

  @media (max-width: 600px) {
    border-radius: 21px;
  }
`;

const PhoneNotch = styled.div`
  position: absolute;
  top: 7px;
  left: 50%;
  z-index: 2;

  width: 56px;
  height: 14px;

  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 999px;

  background: #020617;

  transform: translateX(-50%);
  pointer-events: none;

  @media (max-width: 600px) {
    width: 48px;
    height: 12px;
  }
`;

const PhoneHomeBar = styled.div`
  position: absolute;
  bottom: 6px;
  left: 50%;
  z-index: 2;

  width: 54px;
  height: 3px;

  border-radius: 999px;

  background: rgba(255, 255, 255, 0.4);

  transform: translateX(-50%);
  pointer-events: none;
`;

const SlideContent = styled.div`
  width: 100%;
  min-width: 0;
`;

const SlideTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;

  color: #93c5fd;

  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;

  &::before {
    content: "";

    width: 6px;
    height: 6px;

    border-radius: 999px;

    background: #60a5fa;
    box-shadow: 0 0 10px rgba(96, 165, 250, 0.8);
  }
`;

const SlideTitle = styled.h2`
  margin: 8px 0 0;

  color: #ffffff;

  font-size: clamp(21px, 2.2vw, 27px);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.015em;

  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
`;

const SlideDescription = styled.p`
  max-width: 420px;
  margin: 10px 0 0;

  color: #cbd5e1;

  font-size: 13.5px;
  line-height: 1.55;

  @media (max-width: 600px) {
    margin-right: auto;
    margin-left: auto;
  }
`;

const SlideHighlights = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  margin: 14px 0 0;
  padding: 0;

  list-style: none;

  @media (max-width: 600px) {
    justify-content: center;
  }
`;

const Highlight = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 5px;

  padding: 6px 9px;

  border: 1px solid rgba(96, 165, 250, 0.24);
  border-radius: 7px;

  background: rgba(15, 23, 42, 0.55);
  color: #dbeafe;

  font-size: 11.5px;
  line-height: 1.2;

  svg {
    flex: 0 0 auto;
    color: #60a5fa;
  }
`;

const CarouselFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  margin-top: 16px;
`;

const Dots = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Dot = styled.button`
  width: 7px;
  height: 7px;
  padding: 0;

  border: 0;
  border-radius: 999px;

  background: rgba(148, 163, 184, 0.42);

  cursor: pointer;

  transition:
    width 0.25s ease,
    background-color 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    background: #93c5fd;
  }

  &:focus-visible {
    outline: 2px solid #93c5fd;
    outline-offset: 3px;
  }

  &[data-ativo="true"] {
    width: 22px;

    background: #60a5fa;
    box-shadow: 0 0 10px rgba(96, 165, 250, 0.55);
  }
`;

const CarouselNav = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Counter = styled.span`
  margin-right: 4px;

  color: #94a3b8;

  font-size: 11px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
`;

const ArrowButton = styled.button`
  display: grid;
  place-items: center;

  width: 32px;
  height: 32px;
  padding: 0;

  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 8px;

  background: rgba(15, 23, 42, 0.6);
  color: #e2e8f0;

  cursor: pointer;

  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: rgba(96, 165, 250, 0.55);
    background: rgba(37, 99, 235, 0.28);
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 2px solid #93c5fd;
    outline-offset: 2px;
  }
`;

function FeatureCarousel() {
  const [slideAtivo, setSlideAtivo] = useState(0);
  const [pausado, setPausado] = useState(false);

  const slide = slidesApp[slideAtivo];

  useEffect(() => {
    if (pausado) {
      return;
    }

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSlideAtivo(
        (atual) => (atual + 1) % slidesApp.length,
      );
    }, 6500);

    return () => window.clearTimeout(timer);
  }, [slideAtivo, pausado]);

  useEffect(() => {
    const proximo =
      slidesApp[(slideAtivo + 1) % slidesApp.length];
    const imagem = new Image();

    imagem.src = `${APP_BASE}${proximo.imagem}`;
  }, [slideAtivo]);

  function irPara(indice: number) {
    setSlideAtivo(
      (indice + slidesApp.length) % slidesApp.length,
    );
  }

  return (
    <CarouselShell
      role="region"
      aria-roledescription="carrossel"
      aria-label="Funcionalidades do ENGVI Mobile"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <CarouselViewport>
        <Slide
          key={slideAtivo}
          role="group"
          aria-roledescription="slide"
          aria-label={`${slideAtivo + 1} de ${
            slidesApp.length
          }: ${slide.titulo}`}
        >
          <PhoneStage>
            <PhoneGlow aria-hidden="true" />

            <Phone>
              <PhoneScreen>
                <PhoneNotch aria-hidden="true" />

                <img
                  src={`${APP_BASE}${slide.imagem}`}
                  alt={`Tela do app: ${slide.titulo}`}
                  loading="eager"
                  decoding="async"
                />

                <PhoneHomeBar aria-hidden="true" />
              </PhoneScreen>
            </Phone>
          </PhoneStage>

          <SlideContent>
            <SlideTag>{slide.tag}</SlideTag>

            <SlideTitle>{slide.titulo}</SlideTitle>

            <SlideDescription>
              {slide.descricao}
            </SlideDescription>

            <SlideHighlights>
              {slide.destaques.map((destaque) => (
                <Highlight key={destaque}>
                  <Check size={12} />
                  {destaque}
                </Highlight>
              ))}
            </SlideHighlights>
          </SlideContent>
        </Slide>
      </CarouselViewport>

      <CarouselFooter>
        <Dots>
          {slidesApp.map((item, indice) => (
            <Dot
              key={item.imagem}
              type="button"
              data-ativo={indice === slideAtivo}
              onClick={() => irPara(indice)}
              aria-label={`Ir para o slide ${
                indice + 1
              }: ${item.titulo}`}
              aria-current={
                indice === slideAtivo ? "true" : undefined
              }
            />
          ))}
        </Dots>

        <CarouselNav>
          <Counter>
            {String(slideAtivo + 1).padStart(2, "0")} /{" "}
            {String(slidesApp.length).padStart(2, "0")}
          </Counter>

          <ArrowButton
            type="button"
            onClick={() => irPara(slideAtivo - 1)}
            aria-label="Slide anterior"
          >
            <ChevronLeft size={16} />
          </ArrowButton>

          <ArrowButton
            type="button"
            onClick={() => irPara(slideAtivo + 1)}
            aria-label="Próximo slide"
          >
            <ChevronRight size={16} />
          </ArrowButton>
        </CarouselNav>
      </CarouselFooter>
    </CarouselShell>
  );
}

/* =========================================================
   PAINEL DE LOGIN
========================================================= */

const LoginPanel = styled.section`
  position: relative;
  z-index: 2;

  min-height: 100vh;
  padding: 32px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(248, 250, 252, 0.96);
  color: #0f172a;

  @media (max-width: 900px) {
    min-height: auto;
    padding: 40px 24px 90px;

    background: #f8fafc;
  }
`;

const FormWrap = styled.div`
  width: 100%;
  max-width: 380px;
`;

const Title = styled.div`
  margin-bottom: 28px;

  h2 {
    margin: 0;

    font-size: 28px;
    font-weight: 700;
  }

  p {
    margin: 8px 0 0;

    color: #64748b;
    font-size: 14px;
  }
`;

const FormGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const Field = styled.label`
  display: grid;
  gap: 7px;

  color: #334155;
  font-size: 13px;
  font-weight: 600;
`;

const InputShell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 0 12px;

  border: 1px solid #cbd5e1;
  border-radius: 8px;

  background: #ffffff;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
  }

  svg {
    flex-shrink: 0;
    color: #64748b;
  }

  input {
    width: 100%;
    min-height: 44px;

    border: 0;
    outline: 0;

    background: transparent;
    color: #0f172a;

    font-size: 14px;
  }

  input::placeholder {
    color: #94a3b8;
  }
`;

const Button = styled.button`
  width: 100%;
  min-height: 44px;
  margin-top: 22px;

  border: 0;
  border-radius: 8px;

  background: #1d4ed8;
  color: #ffffff;

  font-weight: 700;
  cursor: pointer;

  transition:
    background-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: #1e40af;

    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(29, 78, 216, 0.24);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ErrorText = styled.p`
  margin: 12px 0 0;

  color: #dc2626;
  font-size: 13px;
`;

const RegisterText = styled.p`
  margin: 18px 0 0;

  color: #64748b;
  font-size: 14px;

  button {
    padding: 0;

    border: 0;
    background: none;
    color: #1d4ed8;

    font-weight: 700;
    cursor: pointer;
  }

  button:hover {
    text-decoration: underline;
  }
`;

/* =========================================================
   TIPAGEM
========================================================= */

interface AuthResponse {
  usuario: Usuario;
  access_token: string;
}

const APK_URL = `${import.meta.env.BASE_URL}downloads/ENGVI_V1.apk`;

/* =========================================================
   COMPONENTE
========================================================= */

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErro("");

    try {
      const response = await api.post<AuthResponse>("/login", {
        email,
        senha,
      });

      const { usuario, access_token } = response.data;

      login(usuario, access_token);
      navigate("/", { replace: true });
    } catch (error: any) {
      const detalhe = error?.response?.data?.detail;

      if (detalhe) {
        setErro(detalhe);
        return;
      }

      if (!error?.response) {
        setErro(
          "Não foi possível conectar ao backend. Verifique a API e o CORS.",
        );
        return;
      }

      setErro("E-mail ou senha inválidos.");
    }
  }

  return (
    <Page>
      <Intro>
        <Brand>
          <BrandLogo
            src="/icone-v.svg"
            alt="Logo ENGVI"
          />

          <BrandText>
            <strong>ENGVI</strong>

            <span>
              Gestão da Vida e Integridade dos Ativos
            </span>
          </BrandText>
        </Brand>

        <HeroWrapper>
          <Hero>
            <HeroFace>
              <HeroEyebrow>
                <Smartphone size={15} />
                Novo app de campo
              </HeroEyebrow>

              <h1>ENGVI Mobile</h1>

              <Tagline>
                Novas oportunidades se abrem, agora o Engvi está na sua mão!
              </Tagline>

              <FeatureCarousel />

              <HeroDownloadButton
                href={APK_URL}
                download="ENGVI_V1.apk"
                aria-label="Baixar o APK atualizado do ENGVI Mobile"
              >
                <Download size={17} />
                Baixar APK atualizado
              </HeroDownloadButton>

              <HeroDownloadMeta>
                Android 7.0 ou superior · Versão 1.0.0.8 · 8,2 MB · 
                Atualizado em 23/10/2026
              </HeroDownloadMeta>
            </HeroFace>
          </Hero>
        </HeroWrapper>

        <div />

        <ElectricianMascot />
      </Intro>

      <LoginPanel>
        <FormWrap>
          <Title>
            <h2>Entrar</h2>
            <p>Acesse sua área de trabalho.</p>
          </Title>

          <form onSubmit={handleLogin}>
            <FormGrid>
              <Field>
                E-mail

                <InputShell>
                  <Mail size={18} />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    autoComplete="email"
                    placeholder="seu@email.com"
                    required
                  />
                </InputShell>
              </Field>

              <Field>
                Senha

                <InputShell>
                  <Lock size={18} />

                  <input
                    type="password"
                    value={senha}
                    onChange={(event) =>
                      setSenha(event.target.value)
                    }
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    required
                  />
                </InputShell>
              </Field>

              <Link to="/esqueci-senha" style={{ justifySelf: "end", color: "#1d4ed8", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Esqueci minha senha</Link>
            </FormGrid>

            {erro && (
              <ErrorText role="alert">
                {erro}
              </ErrorText>
            )}

            <Button type="submit">
              Entrar no sistema
            </Button>
          </form>

          <RegisterText>
            Não tem uma conta?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
            >
              Criar conta
            </button>
          </RegisterText>
        </FormWrap>
      </LoginPanel>
    </Page>
  );
}

