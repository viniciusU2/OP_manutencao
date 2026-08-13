import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import styled from "styled-components";

import Subestacao from "./pages/Subestacao";
import Ativo from "./pages/Ativo";
import { AtivoDetalhe } from "./pages/Ativo_por_id";
import { OrdemServicoPage } from "./pages/OrdemServiço";
import { CreateItemInspecaoForm } from "./pages/CreateItemInspecaoForm";
import ControleOrdemServico from "./pages/dashboard-os";

import { OrdemServicoLotePage } from "./pages/OrdemServicoLotePage"

import { Dashboard } from "./pages/dashboard";
import { DashboardAnalitico } from "./pages/dashboard-analitico";
import { SubestacoesPage } from "./pages/subestacaoPage";
import { LivroRegistro } from "./pages/livro_de_registro"

import { LoginPage } from "./pages/loginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

import Layout from "./components/Layout";

import { AuthProvider, useAuth } from "./context/AuthContext";

import "./index.css";
import type { JSX } from "react";
import { Toaster } from "./components/ui/sonner"
import { FULL_ACCESS_ROLES, OPERATIONAL_ACCESS_ROLES } from "./lib/permissions";
import { SIPage } from "./pages/SIPage";
import SIForm from "./pages/SIForm";
import { SSForm } from "./pages/SSForm"
import { SSPage } from "./pages/sspage"
import { ImportarAtivos } from "./pages/Upload_ativos"
// Páginas
import ItemTemplateForm from "./pages/ItemTemplateForm";
import InspecaoForm from "./pages/InspecaoForm";
import { InspecaoDetalhe } from "./pages/InspecaoDetalhe";
import InspecoesPage from "./pages/InspecoesPage";
import PlanoManutencaoForm from "./pages/PlanoManutencaoForm";
import PlanosManutencaoPage from "./pages/PlanosManutencaoPage";
import PlanoExecucoesPage from "./pages/PlanoExecucoesPage";
import DownloadsPage from "./pages/DownloadsPage";
import PerfisPage from "./pages/PerfisPage";
import RdoPage from "./pages/RdoPage";
import SobreavisoPage from "./pages/SobreavisoPage";
import FuncoesOperacaoPage from "./pages/FuncoesOperacaoPage";
import { useGerarOsPlanosManutencao } from "./hooks/useGerarOsPlanosManutencao";

/* ================= STYLES ================= */

const AppWrapper = styled.div`
  background: #f3f4f6;
  min-height: 100vh;
  font-family: "Poppins", sans-serif;
`;

/* ================= ROTA PROTEGIDA ================= */


function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


function RoleRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { usuario } = useAuth();
  const normalizedRole = usuario?.role?.trim().toLowerCase();

  if (!usuario || !normalizedRole || !allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
/* ================= APP ROOT ================= */

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

/* ================= APP CONTENT ================= */

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  useGerarOsPlanosManutencao(isAuthenticated);

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "100px" }}>Carregando...</div>;
  }

 return (
  <AppWrapper>
    <Routes>

      {/* ROTAS PÚBLICAS */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

      {/* ROTAS PROTEGIDAS (QUALQUER USUÁRIO LOGADO) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* 🔓 LIVRE */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard-analitico" element={<DashboardAnalitico />} />

        {/* 🔒 ADMIN */}
        <Route
          element={<RoleRoute allowedRoles={OPERATIONAL_ACCESS_ROLES} />}
        >
          <Route path="/controle" element={<ControleOrdemServico />} />
          <Route path="/os" element={<OrdemServicoPage />} />
          <Route path="/os/lote" element={<OrdemServicoLotePage />} />
          <Route path="/os/:id" element={<OrdemServicoPage />} />
          <Route path="/si" element={<SIPage />} />
          <Route path="/ss" element={<SSPage />} />
          <Route path="/ss/nova" element={<SSForm />} />
          <Route path="/ss/:id" element={<SSForm />} />
          <Route path="/si/nova" element={<SIForm />} />
          <Route path="/si/:id" element={<SIForm />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={OPERATIONAL_ACCESS_ROLES} />}>
          <Route path="/rdo" element={<RdoPage />} />
          <Route path="/sobreaviso" element={<SobreavisoPage />} />
        </Route>

        <Route
          element={<RoleRoute allowedRoles={FULL_ACCESS_ROLES} />}
        >
          <Route path="/subestacao" element={<Subestacao />} />
          <Route path="/subestacaoPage" element={<SubestacoesPage />} />
          <Route path="/os" element={<OrdemServicoPage />} />
          <Route path="/os/lote" element={<OrdemServicoLotePage />} />
          <Route path="/iteminspecao" element={<CreateItemInspecaoForm />} />
          <Route path="/os/:id" element={<OrdemServicoPage />} />
          <Route path="/lr" element={<LivroRegistro />} />
          <Route path="/item-template" element={<ItemTemplateForm />} />
          <Route path="/inspecao" element={<InspecaoForm />} />
          <Route path="/inspecoes" element={<InspecoesPage />} />
          <Route path="/inspecoes/nova" element={<InspecaoForm />} />
          <Route path="/inspecoes/:id" element={<InspecaoDetalhe />} />
          <Route path="/inspecoes/:id/editar" element={<InspecaoForm />} />
          <Route path="/downloads" element={<DownloadsPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={["admin"]} />}>
          <Route path="/ativo" element={<Ativo />} />
          <Route path="/ativo/:id/editar" element={<Ativo />} />
          <Route path="/ativo/:id" element={<AtivoDetalhe />} />
          <Route path="/funcoes-operacao" element={<FuncoesOperacaoPage />} />
          <Route path="/importar-ativos" element={<ImportarAtivos />} />
          <Route path="/planos-manutencao" element={<PlanosManutencaoPage />} />
          <Route path="/planos-manutencao/execucoes" element={<PlanoExecucoesPage />} />
          <Route path="/planos-manutencao/novo" element={<PlanoManutencaoForm />} />
          <Route path="/planos-manutencao/:id/editar" element={<PlanoManutencaoForm />} />
          <Route path="/perfis" element={<PerfisPage />} />
        </Route>
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  </AppWrapper>
)}
