import styled from "styled-components";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { Card } from "../components/ui/card";

/* ================= STYLES ================= */

const Container = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
`;

const LoginBox = styled.div`
  width: 100%;
  max-width: 400px;
`;

const PageTitle = styled.div`
  margin-bottom: 24px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }

  p {
    margin-top: 4px;
    color: #6b7280;
    font-size: 14px;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    color: #374151;
    font-weight: 500;
  }

  input {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #2563eb;
    }
  }
`;

const Actions = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
`;

const Button = styled.button`
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 10px 26px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #1e40af;
  }
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: 13px;
  margin-top: 8px;
`;

/* ================= TYPES ================= */



export function RegisterPage() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    try {
      await api.post("/register", {
        nome,
        email,
        senha,
      });

      alert("Usuário criado com sucesso!");
      navigate("/login");

    } catch (err) {
      setErro("Erro ao cadastrar usuário");
    }
  };

  return (
    <Container>
      <LoginBox>
        <Card>
          <PageTitle>
            <h2>Criar Conta</h2>
            <p>Preencha os dados para se cadastrar</p>
          </PageTitle>

          <form onSubmit={handleRegister}>
            <FormGrid>
              <FormGroup>
                <label>Nome</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </FormGroup>

              <FormGroup>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormGroup>

              <FormGroup>
                <label>Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </FormGroup>
            </FormGrid>

            {erro && <ErrorText>{erro}</ErrorText>}

            <Actions>
              <Button type="submit">Cadastrar</Button>
            </Actions>
          </form>

          <p style={{ marginTop: "12px", fontSize: "14px" }}>
            Já tem conta?{" "}
            <span
              style={{ color: "#2563eb", cursor: "pointer" }}
              onClick={() => navigate("/login")}
            >
              Fazer login
            </span>
          </p>
        </Card>
      </LoginBox>
    </Container>
  );
}