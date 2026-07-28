import styled from "styled-components";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ShieldCheck, Zap } from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import background from "../assets/fundo.jpeg";

const Page = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 480px);
  background: #07111f;
  color: #f8fafc;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(7, 17, 31, 0.92) 0%, rgba(7, 17, 31, 0.72) 48%, rgba(7, 17, 31, 0.2) 100%),
      url(${background}) center/cover;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Intro = styled.section`
  position: relative;
  z-index: 1;
  padding: 56px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;

  @media (max-width: 900px) {
    min-height: auto;
    padding: 32px 24px 12px;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  letter-spacing: 0;
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
    letter-spacing: 0.01em;
  }
`;

const Hero = styled.div`
  max-width: 680px;

  h1 {
    margin: 0;
    font-size: clamp(36px, 5vw, 64px);
    line-height: 1;
    letter-spacing: 0;
  }

  p {
    max-width: 560px;
    margin: 22px 0 0;
    color: #cbd5e1;
    font-size: 17px;
    line-height: 1.7;
  }
`;

const Signals = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 30px;
`;

const Signal = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(15, 23, 42, 0.5);
  color: #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
`;

const LoginPanel = styled.section`
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(248, 250, 252, 0.96);
  color: #0f172a;

  @media (max-width: 900px) {
    min-height: auto;
    padding: 24px;
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
    letter-spacing: 0;
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
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 8px;
  padding: 0 12px;

  &:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
  }

  svg {
    color: #64748b;
  }

  input {
    width: 100%;
    min-height: 44px;
    border: 0;
    outline: 0;
    font-size: 14px;
    background: transparent;
    color: #0f172a;
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
  transition: 0.2s;

  &:hover {
    background: #1e40af;
  }
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: 13px;
  margin: 12px 0 0;
`;

const RegisterText = styled.p`
  margin: 18px 0 0;
  font-size: 14px;
  color: #64748b;

  button {
    border: 0;
    background: none;
    color: #1d4ed8;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
  }
`;

interface AuthResponse {
  usuario: any;
  access_token: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    try {
      const response = await api.post<AuthResponse>("/login", { email, senha });
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
        setErro("Nao foi possivel conectar ao backend. Verifique a API e o CORS.");
        return;
      }

      setErro("Email ou senha invalidos");
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
            <span>Gestão da Vida e Integridade dos Ativos</span>
          </BrandText>
        </Brand>

        <Hero>
          <h1>Controle operacional em tempo real</h1>
          <p>
            OS, SI, SS, ativos e planos de manutencao em uma rotina unica para equipes de campo, operacao e planejamento.
          </p>
          <Signals>
            <Signal>
              <ShieldCheck size={16} />
              Acesso por perfil
            </Signal>
            <Signal>
              <Zap size={16} />
              Indicadores de manutencao
            </Signal>
          </Signals>
        </Hero>

        <div />
      </Intro>

      <LoginPanel>
        <FormWrap>
          <Title>
            <h2>Entrar</h2>
            <p>Acesse sua area de trabalho.</p>
          </Title>

          <form onSubmit={handleLogin}>
            <FormGrid>
              <Field>
                Email
                <InputShell>
                  <Mail size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
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
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </InputShell>
              </Field>
            </FormGrid>

            {erro && <ErrorText>{erro}</ErrorText>}

            <Button type="submit">Entrar no sistema</Button>
          </form>

          <RegisterText>
            Nao tem conta?{" "}
            <button type="button" onClick={() => navigate("/register")}>
              Criar conta
            </button>
          </RegisterText>
        </FormWrap>
      </LoginPanel>
    </Page>
  );
}
