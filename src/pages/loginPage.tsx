import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  ClipboardCheck,
  Download,
  History,
  Lock,
  Mail,
  ShieldCheck,
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
  padding: 30px 32px;

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
    font-size: clamp(32px, 4.4vw, 54px);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.025em;

    text-shadow:
      0 3px 6px rgba(0, 0, 0, 0.7),
      0 10px 28px rgba(0, 0, 0, 0.45);
  }

  p {
    max-width: 560px;
    margin: 16px 0 0;

    color: #dbeafe;
    font-size: 15px;
    line-height: 1.6;

    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.55);
  }

  @media (max-width: 900px) {
    padding: 24px 20px;

    h1 {
      font-size: clamp(30px, 8vw, 44px);
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

  margin-top: 24px;
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

const HeroDownloadButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;

  min-height: 46px;
  margin-top: 24px;
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
  margin-top: 12px;

  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
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

              <h1>ENGVI Mobile com Sobreaviso</h1>

              <p>
                Leve a operação para o celular. Consulte a escala,
                registre solicitações de ajuste e acompanhe aprovações
                direto do campo, com as mesmas credenciais e permissões
                do sistema web.
              </p>

              <Signals>
                <Signal>
                  <ShieldCheck size={16} />
                  Admin e mantenedor veem toda a escala
                </Signal>

                <Signal>
                  <ClipboardCheck size={16} />
                  Operador acessa apenas o próprio colaborador
                </Signal>

                <Signal>
                  <History size={16} />
                  Aprovações e ajustes sincronizados
                </Signal>
              </Signals>

              <HeroDownloadButton
                href={APK_URL}
                download="ENGVI_V1.apk"
                aria-label="Baixar o APK atualizado do ENGVI Mobile"
              >
                <Download size={17} />
                Baixar APK atualizado
              </HeroDownloadButton>

              <HeroDownloadMeta>
                Android 7.0 ou superior · Versão 1.0.0 · 7,6 MB ·
                Atualizado em 21/10/2026
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

