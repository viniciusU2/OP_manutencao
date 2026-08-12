import type { ReactNode } from "react";
import styled from "styled-components";

const Layout = styled.div<{ $open: boolean }>`
  display: block;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const FilterPageFrame = styled.div<{ $filtersOpen: boolean }>`
  width: 100%;
  transition: padding-left .25s ease;

  @media (min-width: 901px) {
    padding-left: ${({ $filtersOpen }) => $filtersOpen ? "286px" : "0"};
  }
`;

const Aside = styled.aside`
  position: fixed;
  left: var(--app-sidebar-width, 260px);
  top: 0;
  z-index: 35;
  width: 270px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 0;
  border-right: 1px solid #dbe3ed;
  border-radius: 0;
  background: #f8fafc;
  box-shadow: 6px 0 18px rgba(15, 23, 42, 0.08);
  overflow-y: auto;

  label { color: #475569; }
  select {
    border-color: #cbd5e1;
    background: #ffffff;
    color: #0f172a;
  }

  @media (max-width: 900px) {
    position: static;
    width: 100%;
    height: auto;
    margin-bottom: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #ffffff;
    label { color: #475569; }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
`;

const Title = styled.strong`font-size: 14px; color: #0f172a;`;
const Content = styled.div`min-width: 0;`;
const ToggleRow = styled.div`margin-bottom: 8px;`;
const Toggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #fff;
  color: #64748b;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  &:hover { border-color: #94a3b8; background: #f8fafc; color: #0f172a; }
`;

interface FilterSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ReactNode;
  children: ReactNode;
}

export function FilterSidebar({ open, onOpenChange, filters, children }: FilterSidebarProps) {
  return (
    <>
      {!open && (
        <ToggleRow>
          <Toggle type="button" aria-label="Mostrar filtros" title="Mostrar filtros" onClick={() => onOpenChange(true)}>›</Toggle>
        </ToggleRow>
      )}
      <Layout $open={open}>
        {open && (
          <Aside aria-label="Filtros da listagem">
            <Header>
              <Title>Filtros</Title>
              <Toggle type="button" aria-label="Recolher filtros" title="Recolher filtros" onClick={() => onOpenChange(false)}>‹</Toggle>
            </Header>
            {filters}
          </Aside>
        )}
        <Content>{children}</Content>
      </Layout>
    </>
  );
}
