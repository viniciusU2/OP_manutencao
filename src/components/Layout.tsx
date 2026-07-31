import { useLocation, Link, Outlet } from "react-router-dom"
import styled from "styled-components"
import { useState } from "react"

import {
  LayoutDashboard,
  Zap,
  Building2,
  FileText,
  ClipboardList,
  Calendar,
  Download,
  FileClock,
  Clock3,
  LogOut,
  Menu,
  UserCog,
  Wrench,
  ListChecks,
  Workflow
} from "lucide-react"

import { useAuth } from "../context/AuthContext"
import {
  OPERATOR_MENU_PATHS,
  canAccessOperational,
  canDelete,
  canManage,
  isOperator,
} from "../lib/permissions"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

/* ================= CONFIG ================= */

const SIDEBAR_EXPANDED = 260
const SIDEBAR_COLLAPSED = 80

/* ================= STYLES ================= */

const Container = styled.div`
  display: flex;
  min-height: 100vh;
`

const Sidebar = styled.aside<{ $open: boolean; $collapsed: boolean }>`
  width: ${({ $collapsed }) =>
    $collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_EXPANDED}px`};

  background: #0f172a;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  max-width: min(${SIDEBAR_EXPANDED}px, 86vw);
  overflow: hidden;
  z-index: 50;

  transition: all 0.25s ease;

  @media (max-width: 768px) {
    transform: ${({ $open }) =>
      $open ? "translateX(0)" : "translateX(-100%)"};
    width: ${SIDEBAR_EXPANDED}px;
  }
`

const Overlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 40;
  display: ${({ $open }) => ($open ? "block" : "none")};

  @media (min-width: 769px) {
    display: none;
  }
`

const Logo = styled.div<{ $collapsed: boolean }>`
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "flex-start"};
  gap: 12px;
  padding: 0 22px;
  border-bottom: 1px solid #1e293b;
  font-weight: bold;
`

const LogoIcon = styled.svg`
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  border-radius: 7px;
  object-fit: contain;
`

const Nav = styled.nav`
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-color: #475569 #0f172a;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #0f172a;
  }

  &::-webkit-scrollbar-thumb {
    background: #475569;
    border: 2px solid #0f172a;
    border-radius: 999px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
`

const NavItem = styled(Link)<{ $active?: boolean; $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  position: relative;

  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "flex-start"};

  color: ${(p) => (p.$active ? "#60a5fa" : "#94a3b8")};
  background: ${(p) =>
    p.$active ? "rgba(59,130,246,0.08)" : "transparent"};

  &:hover {
    background: #1e293b;
    color: white;
  }

  span {
    display: ${({ $collapsed }) => ($collapsed ? "none" : "inline")};
  }

  &::before {
    content: "";
    position: absolute;
    left: -12px;
    width: 4px;
    height: 60%;
    border-radius: 2px;
    background: ${(p) => (p.$active ? "#3b82f6" : "transparent")};
  }
`

const Footer = styled.div`
  flex-shrink: 0;
  border-top: 1px solid #1e293b;
  padding: 16px;
`

const UserBox = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "flex-start"};
`

const UserInfo = styled.div<{ $collapsed: boolean }>`
  display: ${({ $collapsed }) => ($collapsed ? "none" : "grid")};
  gap: 2px;

  span {
    display: inline;
  }

  small {
    color: #94a3b8;
    font-size: 11px;
    text-transform: capitalize;
  }
`

const LogoutButton = styled.button<{ $collapsed: boolean }>`
  width: 100%;
  background: #ef4444;
  border: none;
  color: white;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  span {
    display: ${({ $collapsed }) => ($collapsed ? "none" : "inline")};
  }
`

const Content = styled.main<{ $collapsed: boolean }>`
  flex: 1;
  min-width: 0;
  margin-left: ${({ $collapsed }) =>
    $collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_EXPANDED}px`};

  background: #f1f5f9;
  padding: 40px;
  transition: all 0.25s ease;

  @media (max-width: 768px) {
    margin-left: 0;
    padding: 74px 14px 20px;
  }

  @media (max-width: 480px) {
    padding-inline: 10px;
  }
`

const Topbar = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 35;
    padding: 16px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }
`

const TopbarTitle = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
  color: #0f172a;

  strong {
    font-size: 14px;
    line-height: 1.2;
  }

  span {
    max-width: 190px;
    overflow: hidden;
    color: #64748b;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const MobileMenuButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
`

const CollapseButton = styled.div`
  position: absolute;
  top: 20px;
  right: -12px;
  background: #1e293b;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  @media (max-width: 768px) {
    display: none;
  }
`

/* ================= MENU ================= */

const menu = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard, restricted: false },
  { name: "Instalações", path: "/subestacaoPage", icon: Building2, restricted: true },
  { name: "Ativos", path: "/ativo", icon: Zap, restricted: true, adminOnly: true },
  { name: "FO", path: "/funcoes-operacao", icon: Workflow, restricted: true, adminOnly: true },
  { name: "OS", path: "/controle", icon: ClipboardList, restricted: true },
  { name: "SS", path: "/ss", icon: FileText, restricted: true },
  { name: "SI", path: "/si", icon: Calendar, restricted: true },
  { name: "RDO", path: "/rdo", icon: FileClock, restricted: true },
  { name: "Sobreaviso", path: "/sobreaviso", icon: Clock3, restricted: true },
  { name: "Plano Manut.", path: "/planos-manutencao", icon: Wrench, restricted: true, adminOnly: true },
  { name: "Exec. Planos", path: "/planos-manutencao/execucoes", icon: ListChecks, restricted: true, adminOnly: true },
  { name: "Inspeções", path: "/inspecoes", icon: ListChecks, restricted: true },
  { name: "Downloads", path: "/downloads", icon: Download, restricted: true },
  { name: "Perfis", path: "/perfis", icon: UserCog, restricted: true, adminOnly: true },


]

/* ================= COMPONENT ================= */

export default function Layout() {
  const location = useLocation()
  const { usuario, logout } = useAuth()

  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar") === "true")
  const visibleMenu = menu.filter((item) => {
    if (isOperator(usuario?.role)) {
      return OPERATOR_MENU_PATHS.includes(item.path)
    }
    if (item.adminOnly) return canDelete(usuario?.role)
    return !item.restricted || canManage(usuario?.role) || canAccessOperational(usuario?.role)
  })

  // Persistência
  function toggleCollapse() {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem("sidebar", String(newState))
  }

  return (
    <Container>

      <Sidebar $open={open} $collapsed={collapsed}>
        <Logo $collapsed={collapsed}>
          <LogoIcon viewBox="0 0 1024 1024" aria-label="EV">
            <rect x="86" y="162" width="86" height="638" rx="6" fill="#FFFFFF" />
            <rect x="86" y="162" width="494" height="86" rx="6" fill="#FFFFFF" />
            <rect x="86" y="456" width="404" height="78" rx="6" fill="#FFFFFF" />
            <rect x="86" y="714" width="494" height="86" rx="6" fill="#FFFFFF" />
            <polygon points="414,162 548,162 668,634 788,162 922,162 668,800" fill="#FFFFFF" />
            <polygon points="580,116 656,116 603,450 684,450 568,916 520,916 565,504 486,504" fill="#FFFFFF" opacity="0.38" />
            <polygon points="593,138 636,138 588,462 652,462 561,892 540,892 582,490 518,490" fill="#FFFFFF" />
          </LogoIcon>
          {!collapsed && "O&M"}
        </Logo>

        <CollapseButton onClick={toggleCollapse}>
          <Menu size={14} />
        </CollapseButton>

        <Nav>
          {visibleMenu.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path

            return (
              <NavItem
                key={item.path}
                to={item.path}
                $active={active}
                $collapsed={collapsed}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavItem>
            )
          })}
        </Nav>

        <Footer>
          {usuario && (
            <UserBox $collapsed={collapsed}>
              <Avatar>
                <AvatarImage src={usuario.foto ?? undefined} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <UserInfo $collapsed={collapsed}>
                <span>{usuario.nome}</span>
                <small>{usuario.role}</small>
              </UserInfo>
            </UserBox>
          )}

          <LogoutButton $collapsed={collapsed} onClick={logout}>
            <LogOut size={16} />
            <span>Sair</span>
          </LogoutButton>
        </Footer>
      </Sidebar>

      <Overlay $open={open} onClick={() => setOpen(false)} />

      <Content $collapsed={collapsed}>
        <Topbar>
          <MobileMenuButton type="button" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu size={22} />
          </MobileMenuButton>
          <TopbarTitle>
            <strong>O&amp;M</strong>
            <span>{usuario?.nome || "Operacao manutencao"}</span>
          </TopbarTitle>
        </Topbar>

        <Outlet />
      </Content>

    </Container>
  )
}
