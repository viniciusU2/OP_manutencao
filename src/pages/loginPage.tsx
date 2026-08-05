import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  BarChart3,
  ClipboardCheck,
  History,
  Lock,
  Mail,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import type { Usuario } from "../context/AuthContext";
import background from "../assets/fundo.jpeg";
import ElectricianMascot from "../components/ElectricianMascot";

/* =========================================================
   ANIMAÇÃO DO HERO
========================================================= */

const heroRotate = keyframes`
  0%,
  38% {
    transform: rotateY(0deg);
  }

  45%,
  88% {
    transform: rotateY(180deg);
  }

  95%,
  100% {
    transform: rotateY(360deg);
  }
`;

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
   HERO 3D
========================================================= */

const HeroWrapper = styled.div`
  width: 100%;
  max-width: 680px;

  perspective: 1400px;
`;

const Hero = styled.div`
  position: relative;

  width: 100%;
  min-height: 300px;

  transform-style: preserve-3d;
  transform-origin: center center;

  animation: ${heroRotate} 14s ease-in-out infinite;
  will-change: transform;

  @media (max-width: 900px) {
    min-height: 320px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: rotateY(0deg);
  }
`;

interface HeroFaceProps {
  $back?: boolean;
}

const HeroFace = styled.div<HeroFaceProps>`
  position: absolute;
  inset: 0;

  min-height: 300px;
  padding: 28px 32px;

  display: flex;
  flex-direction: column;
  justify-content: center;

  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);

  background: rgba(7, 17, 31, 0.68);

  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);

  box-shadow:
    0 18px 45px rgba(2, 8, 23, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;

  transform: ${({ $back }) =>
    $back ? "rotateY(180deg)" : "rotateY(0deg)"};

  h1 {
    max-width: 620px;
    margin: 0;

    color: #ffffff;
    font-size: clamp(38px, 5vw, 64px);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.025em;

    text-shadow:
      0 3px 6px rgba(0, 0, 0, 0.7),
      0 10px 28px rgba(0, 0, 0, 0.45);
  }

  p {
    max-width: 560px;
    margin: 18px 0 0;

    color: #dbeafe;
    font-size: 16px;
    line-height: 1.6;

    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.55);
  }

  @media (max-width: 900px) {
    min-height: 320px;
    padding: 22px 20px;

    h1 {
      font-size: clamp(34px, 10vw, 52px);
    }
  }
`;

const HeroEyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;

  width: fit-content;
  margin-bottom: 14px;

  color: #93c5fd;

  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Signals = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  margin-top: 28px;
`;

const Signal = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 10px 12px;

  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;

  background: rgba(15, 23, 42, 0.62);
  color: #e2e8f0;

  font-size: 13px;

  svg {
    flex-shrink: 0;
    color: #60a5fa;
  }
`;

const ModuleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  margin-top: 26px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const ModuleCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 12px;

  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;

  background: rgba(15, 23, 42, 0.62);
  color: #e2e8f0;

  font-size: 13px;
  font-weight: 600;

  svg {
    flex-shrink: 0;
    color: #facc15;
  }
`;

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
            {/* Face frontal */}
            <HeroFace>
       
              <p>
                Centralize informações, acompanhe atividades e
                mantenha a rastreabilidade da manutenção dos ativos.
              </p>

              <Signals>
                <Signal>
                  <ShieldCheck size={16} />
                  Acesso por perfil
                </Signal>

                <Signal>
                  <BarChart3 size={16} />
                  Indicadores de manutenção
                </Signal>
              </Signals>
            </HeroFace>

            {/* Face traseira */}
            <HeroFace $back>
              <HeroEyebrow>
                <Wrench size={15} />
                Gestão inteligente
              </HeroEyebrow>

        

      
              <ModuleGrid>
                <ModuleCard>
                  <ClipboardCheck size={18} />
                  Ordens de serviço
                </ModuleCard>

                <ModuleCard>
                  <History size={18} />
                  Histórico dos ativos
                </ModuleCard>

                <ModuleCard>
                  <Wrench size={18} />
                  Planos de manutenção
                </ModuleCard>

                <ModuleCard>
                  <ShieldCheck size={18} />
                  Segurança operacional
                </ModuleCard>
              </ModuleGrid>
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
