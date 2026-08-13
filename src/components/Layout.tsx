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
  ,ChevronDown
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
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "./ui/dropdown-menu"

/* ================= CONFIG ================= */

const SIDEBAR_EXPANDED = 260
/* ================= STYLES ================= */

const Container = styled.div<{ $collapsed: boolean }>`
  display: flex;
  min-height: 100vh;
  background: #f1f5f9;
  --app-sidebar-width: 0px;
`

const Sidebar = styled.aside<{ $open: boolean; $collapsed: boolean }>`
  width: 100%;

  background: #e8eef6;
  color: #0f172a;
  display: flex;
  flex-direction: row;
  align-items: center;
  position: fixed;
  height: 64px;
  max-width: none;
  overflow: hidden;
  z-index: 50;

  transition: all 0.25s ease;
  border-bottom: 1px solid #cbd5e1;
  box-shadow: 0 3px 14px rgba(15, 23, 42, 0.07);

  @media (max-width: 768px) {
    transform: ${({ $open }) =>
      $open ? "translateX(0)" : "translateX(-100%)"};
    width: ${SIDEBAR_EXPANDED}px;
    height: 100vh;
    max-width: min(${SIDEBAR_EXPANDED}px, 86vw);
    flex-direction: column;
    align-items: stretch;
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
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  min-width: 142px;
  padding: 0 20px;
  border-right: 1px solid #cbd5e1;
  font-weight: 700;
  letter-spacing: .02em;

  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`

const LogoIcon = styled.svg`
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  border-radius: 7px;
  object-fit: contain;
  padding: 4px;
  border-radius: 8px;
  background: #0f172a;
`

const LogoText = styled.span<{ $collapsed: boolean }>`
  display: inline;

  @media (max-width: 768px) {
    display: inline;
  }
`

const Nav = styled.nav`
  padding: 8px 16px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  scrollbar-color: #cbd5e1 #ffffff;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #e8eef6;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border: 2px solid #e8eef6;
    border-radius: 999px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 20px 12px;
    overflow-x: hidden;
    overflow-y: auto;
  }
`

const NavItem = styled(Link)<{ $active?: boolean; $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 11px;
  border-radius: 9px;
  text-decoration: none;
  font-size: 14px;
  position: relative;

  justify-content: center;
  white-space: nowrap;

  color: ${(p) => (p.$active ? "#2563eb" : "#64748b")};
  background: ${(p) =>
    p.$active ? "#eff6ff" : "transparent"};

  &:hover {
    background: #ffffff;
    color: #0f172a;
  }

  span {
    display: inline;
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

  svg {
    flex: 0 0 auto;
  }

  @media (max-width: 768px) {
    justify-content: flex-start;

    span {
      display: inline;
    }
  }
`

const DesktopNav = styled.div`display:flex;align-items:center;gap:6px;@media(max-width:768px){display:none;}`
const MobileNav = styled.div`display:none;@media(max-width:768px){display:contents;}`

const Footer = styled.div`
  flex-shrink: 0;
  border-left: 1px solid #cbd5e1;
  min-width: 190px;
  padding: 7px 14px;
  display:flex;
  align-items:center;
  gap:10px;

  @media (max-width: 768px) {
    display: block;
    padding: 16px;
    border-left: 0;
    border-top: 1px solid #e2e8f0;
  }
`

const UserBox = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0;
  justify-content: flex-start;
  padding: 3px 5px;

  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`

const UserInfo = styled.div<{ $collapsed: boolean }>`
  display: grid;
  gap: 2px;

  span {
    display: inline;
  }

  small {
    color: #64748b;
    font-size: 11px;
    text-transform: capitalize;
  }

  @media (max-width: 768px) {
    display: grid;
  }
`

const LogoutButton = styled.button<{ $collapsed: boolean }>`
  width: auto;
  background: transparent;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 7px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  &:hover { background: #fef2f2; color:#b91c1c; }

  span {
    display: none;
  }

  @media (max-width: 768px) {
    span {
      display: inline;
    }
  }
`

const Content = styled.main<{ $collapsed: boolean }>`
  flex: 1;
  min-width: 0;
  margin-left: 0;
  margin-top: 64px;

  background: #f1f5f9;
  padding: clamp(20px, 3vw, 40px);
  transition: all 0.25s ease;

  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 0;
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

const CollapseButton = styled.button`
  position: absolute;
  top: 22px;
  right: 10px;
  background: #1e293b;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #334155;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ffffff;

  display:none;
`

/* ================= MENU ================= */

const menu = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard, restricted: false },
  { name: "Instalações", path: "/subestacaoPage", icon: Building2, restricted: true },
  { name: "Ativos", path: "/ativo", icon: Zap, restricted: true, adminOnly: true },
  { name: "FT", path: "/funcoes-operacao", icon: Workflow, restricted: true, adminOnly: true },
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

const menuGroups = [
  { name: "Cadastros", paths: ["/subestacaoPage", "/ativo", "/funcoes-operacao"] },
  { name: "OS-SS-SI", paths: ["/controle", "/ss", "/si", "/rdo", "/sobreaviso"] },
  { name: "Plano manutenção", paths: ["/planos-manutencao", "/planos-manutencao/execucoes", "/inspecoes"] },
  { name: "Administração", paths: ["/downloads", "/perfis"] },
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
  const activePath = visibleMenu
    .filter((item) =>
      item.path === "/"
        ? location.pathname === "/"
        : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
    )
    .sort((a, b) => b.path.length - a.path.length)[0]?.path
  const activeDocument = location.pathname === "/controle" || location.pathname.startsWith("/os")
    ? "OS"
    : location.pathname.startsWith("/ss")
      ? "SS"
      : location.pathname.startsWith("/si")
        ? "SI"
        : null

  // Persistência
  function toggleCollapse() {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem("sidebar", String(newState))
  }

  return (
    <Container $collapsed={collapsed}>

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
          <LogoText $collapsed={collapsed}>ENGVI</LogoText>
        </Logo>

        <CollapseButton type="button" onClick={toggleCollapse} aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>
          <Menu size={14} />
        </CollapseButton>

        <Nav>
          <DesktopNav>
            {visibleMenu.filter(item => item.path === "/").map((item) => {
              const Icon=item.icon; return <NavItem key={item.path} to={item.path} $active={activePath===item.path} $collapsed={false}><Icon size={18}/><span>{item.name}</span></NavItem>
            })}
            {menuGroups.map(group => {
              const items=visibleMenu.filter(item=>group.paths.includes(item.path));
              if(!items.length)return null;
              const groupActive=items.some(item=>item.path===activePath);
              return <DropdownMenu key={group.name}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`h-9 gap-1.5 px-3 text-sm hover:bg-white/80 hover:text-slate-950 ${groupActive ? "bg-white shadow-sm" : ""} ${group.name !== "OS-SS-SI" && groupActive ? "text-blue-700" : "text-slate-700"}`}>
                    {group.name === "OS-SS-SI" ? (
                      <span aria-label="OS, SS e SI">
                        <span className={activeDocument === "OS" ? "font-semibold text-blue-600" : ""}>OS</span>
                        <span className="text-slate-400">–</span>
                        <span className={activeDocument === "SS" ? "font-semibold text-blue-600" : ""}>SS</span>
                        <span className="text-slate-400">–</span>
                        <span className={activeDocument === "SI" ? "font-semibold text-blue-600" : ""}>SI</span>
                      </span>
                    ) : group.name}
                    <ChevronDown className="size-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>{group.name}</DropdownMenuLabel>
                  {items.map(item=>{const Icon=item.icon;return <DropdownMenuItem key={item.path} asChild className={activePath===item.path?"bg-blue-50 text-blue-600":""}><Link to={item.path}><Icon size={17}/><span>{item.name}</span></Link></DropdownMenuItem>})}
                </DropdownMenuContent>
              </DropdownMenu>
            })}
          </DesktopNav>
          <MobileNav>{visibleMenu.map((item) => {
            const Icon = item.icon
            const active = activePath === item.path

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
          })}</MobileNav>
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
