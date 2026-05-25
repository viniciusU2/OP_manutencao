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
import { SubestacoesPage } from "./pages/subestacaoPage";
import { LivroRegistro } from "./pages/livro_de_registro"

import { LoginPage } from "./pages/loginPage";
import { RegisterPage } from "./pages/RegisterPage";

import Layout from "./components/Layout";

import { AuthProvider, useAuth } from "./context/AuthContext";

import "./index.css";
import type { JSX } from "react";
import { Toaster } from "./components/ui/sonner"
import { FULL_ACCESS_ROLES } from "./lib/permissions";
import { SIPage } from "./pages/SIPage";
import SIForm from "./pages/SIForm";
import { SSForm } from "./pages/SSForm"
import { SSPage } from "./pages/sspage"
import { ImportarAtivos } from "./pages/Upload_ativos"
// Páginas
import ItemTemplateForm from "./pages/ItemTemplateForm";
import InspecaoForm from "./pages/InspecaoForm";
import { InspecaoDetalhe } from "./pages/InspecaoDetalhe";
import PlanoManutencaoForm from "./pages/PlanoManutencaoForm";
import PlanosManutencaoPage from "./pages/PlanosManutencaoPage";
import DownloadsPage from "./pages/DownloadsPage";

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

  if (!usuario || !allowedRoles.includes(usuario.role)) {
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
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "100px" }}>Carregando...</div>;
  }

 return (
  <AppWrapper>
    <Routes>

      {/* ROTAS PÚBLICAS */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

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

        {/* 🔒 ADMIN */}
        <Route
          element={<RoleRoute allowedRoles={FULL_ACCESS_ROLES} />}
        >
          <Route path="/subestacao" element={<Subestacao />} />
          <Route path="/subestacaoPage" element={<SubestacoesPage />} />
          <Route path="/ativo" element={<Ativo />} />
          <Route path="/ativo/:id" element={<AtivoDetalhe />} />
          <Route path="/os" element={<OrdemServicoPage />} />
          <Route path="/os/lote" element={<OrdemServicoLotePage />} />
          <Route path="/controle" element={<ControleOrdemServico />} />
          <Route path="/iteminspecao" element={<CreateItemInspecaoForm />} />


          <Route path="/os/:id" element={<OrdemServicoPage />} />
          <Route path="/si" element={<SIPage />} />
          <Route path="/ss" element={<SSPage />} />
          <Route path="/lr" element={<LivroRegistro />} />
          <Route path="/importar-ativos" element={<ImportarAtivos />} />
          <Route path="/item-template" element={<ItemTemplateForm />} />
          <Route path="/planos-manutencao" element={<PlanosManutencaoPage />} />
          <Route path="/planos-manutencao/novo" element={<PlanoManutencaoForm />} />
          <Route path="/inspecao" element={<InspecaoForm />} />
          <Route path="/ss/nova" element={<SSForm />} />
          <Route path="/inspecoes/:id" element={<InspecaoDetalhe />} />
          <Route path="/ss/:id" element={<SSForm />} />
          <Route path="/si/nova" element={<SIForm />} />
          <Route path="/si/:id" element={<SIForm />} />
          <Route path="/downloads" element={<DownloadsPage />} />
        </Route>
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  </AppWrapper>
)}
