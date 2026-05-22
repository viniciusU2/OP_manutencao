import { useLocation, Link, Outlet } from "react-router-dom"
import styled from "styled-components"
import { useState, useEffect } from "react"

import {
  LayoutDashboard,
  Zap,
  Building2,
  FileText,
  ClipboardList,
  Calendar,
  Download,
  LogOut,
  Menu,
  Wrench
} from "lucide-react"

import { useAuth } from "../context/AuthContext"
import { canManage } from "../lib/permissions"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

/* ================= CONFIG ================= */

const SIDEBAR_EXPANDED = 260
const SIDEBAR_COLLAPSED = 80

/* ================= STYLES ================= */

const Container = styled.div`
  display: flex;
  min-height: 100vh;
`

const Sidebar = styled.aside<{ open: boolean; collapsed: boolean }>`
  width: ${({ collapsed }) =>
    collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_EXPANDED}px`};

  background: #0f172a;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 50;

  transition: all 0.25s ease;

  @media (max-width: 768px) {
    transform: ${({ open }) =>
      open ? "translateX(0)" : "translateX(-100%)"};
    width: ${SIDEBAR_EXPANDED}px;
  }
`

const Overlay = styled.div<{ open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 40;
  display: ${({ open }) => (open ? "block" : "none")};

  @media (min-width: 769px) {
    display: none;
  }
`

const Logo = styled.div<{ collapsed: boolean }>`
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: ${({ collapsed }) =>
    collapsed ? "center" : "flex-start"};
  gap: 12px;
  padding: 0 22px;
  border-bottom: 1px solid #1e293b;
  font-weight: bold;
`

const Nav = styled.nav`
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
`

const NavItem = styled(Link)<{ $active?: boolean; collapsed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  position: relative;

  justify-content: ${({ collapsed }) =>
    collapsed ? "center" : "flex-start"};

  color: ${(p) => (p.$active ? "#60a5fa" : "#94a3b8")};
  background: ${(p) =>
    p.$active ? "rgba(59,130,246,0.08)" : "transparent"};

  &:hover {
    background: #1e293b;
    color: white;
  }

  span {
    display: ${({ collapsed }) => (collapsed ? "none" : "inline")};
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
  border-top: 1px solid #1e293b;
  padding: 16px;
`

const UserBox = styled.div<{ collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  justify-content: ${({ collapsed }) =>
    collapsed ? "center" : "flex-start"};

  span {
    display: ${({ collapsed }) => (collapsed ? "none" : "inline")};
  }
`

const UserInfo = styled.div<{ collapsed: boolean }>`
  display: ${({ collapsed }) => (collapsed ? "none" : "grid")};
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

const LogoutButton = styled.button<{ collapsed: boolean }>`
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
  justify-content: ${({ collapsed }) =>
    collapsed ? "center" : "center"};
  gap: 6px;

  span {
    display: ${({ collapsed }) => (collapsed ? "none" : "inline")};
  }
`

const Content = styled.main<{ collapsed: boolean }>`
  flex: 1;
  margin-left: ${({ collapsed }) =>
    collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_EXPANDED}px`};

  background: #f1f5f9;
  padding: 40px;
  transition: all 0.25s ease;

  @media (max-width: 768px) {
    margin-left: 0;
    padding: 20px;
  }
`

const Topbar = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    padding: 16px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }
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
`

/* ================= MENU ================= */

const menu = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard, restricted: false },
  { name: "Instalações", path: "/subestacaoPage", icon: Building2, restricted: true },
  { name: "Ativos", path: "/ativo", icon: Zap, restricted: true },
  { name: "OS", path: "/controle", icon: ClipboardList, restricted: true },
  { name: "SS", path: "/ss", icon: FileText, restricted: true },
  { name: "SI", path: "/si", icon: Calendar, restricted: true },
  { name: "Plano Manut.", path: "/planos-manutencao", icon: Wrench, restricted: true },
  { name: "Downloads", path: "/downloads", icon: Download, restricted: true },


]

/* ================= COMPONENT ================= */

export default function Layout() {
  const location = useLocation()
  const { usuario, logout } = useAuth()

  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const visibleMenu = menu.filter((item) => !item.restricted || canManage(usuario?.role))

  // Persistência
  useEffect(() => {
    const saved = localStorage.getItem("sidebar")
    if (saved) setCollapsed(saved === "true")
  }, [])

  function toggleCollapse() {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem("sidebar", String(newState))
  }

  return (
    <Container>

      <Sidebar open={open} collapsed={collapsed}>
        <Logo collapsed={collapsed}>
          <Zap size={20} />
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
                collapsed={collapsed}
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
            <UserBox collapsed={collapsed}>
              <Avatar>
                <AvatarImage src={usuario.foto} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <UserInfo collapsed={collapsed}>
                <span>{usuario.nome}</span>
                <small>{usuario.role}</small>
              </UserInfo>
            </UserBox>
          )}

          <LogoutButton collapsed={collapsed} onClick={logout}>
            <LogOut size={16} />
            <span>Sair</span>
          </LogoutButton>
        </Footer>
      </Sidebar>

      <Overlay open={open} onClick={() => setOpen(false)} />

      <Content collapsed={collapsed}>
        <Topbar>
          <Menu size={22} onClick={() => setOpen(true)} />
        </Topbar>

        <Outlet />
      </Content>

    </Container>
  )
}
