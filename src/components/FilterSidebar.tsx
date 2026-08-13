import type { ReactNode } from "react";
import styled from "styled-components";

export const FilterPageFrame = styled.div<{ $filtersOpen: boolean }>`
  width: 100%;
  transition: padding-left .25s ease;
  @media (min-width: 901px) { padding-left: ${({ $filtersOpen }) => $filtersOpen ? "286px" : "0"}; }
`;
const Layout = styled.div`display:block;`;
const Aside = styled.aside`
  position:fixed; left:0; top:64px; z-index:35; width:270px; height:calc(100vh - 64px);
  display:flex; flex-direction:column; gap:10px; padding:14px;
  border-right:1px solid #cbd5e1; background:#edf2f7;
  box-shadow:6px 0 18px rgba(15,23,42,.07); overflow-y:auto;
  label{color:#475569;letter-spacing:.01em;} select{border-color:#cbd5e1;background:#fff;color:#0f172a;box-shadow:0 1px 2px rgba(15,23,42,.04);}
  select:hover{border-color:#94a3b8;}
  select:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12);}
  @media(max-width:900px){position:static;width:100%;height:auto;margin-bottom:16px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;}
`;
const Header=styled.div`display:flex;align-items:center;justify-content:space-between;margin:-14px -14px 4px;padding:14px;border-bottom:1px solid #d7e0ea;background:#e4ebf3;`;
const Title=styled.strong`font-size:14px;color:#0f172a;letter-spacing:.01em;&::before{content:"";display:inline-block;width:3px;height:14px;margin-right:8px;border-radius:999px;background:#3b82f6;vertical-align:-2px;}`;
const Content=styled.div`min-width:0;width:100%;`;
const ToggleRow=styled.div`margin-bottom:8px;`;
const Toggle=styled.button`display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:1px solid #bfccda;border-radius:999px;background:#f8fafc;color:#475569;font-size:20px;cursor:pointer;&:hover{border-color:#93a4b8;background:#fff;color:#2563eb;}`;

interface Props{open:boolean;onOpenChange:(open:boolean)=>void;filters:ReactNode;children:ReactNode;}
export function FilterSidebar({open,onOpenChange,filters,children}:Props){return <>
  {!open&&<ToggleRow><Toggle type="button" aria-label="Mostrar filtros" title="Mostrar filtros" onClick={()=>onOpenChange(true)}>›</Toggle></ToggleRow>}
  <Layout>{open&&<Aside aria-label="Filtros da listagem"><Header><Title>Filtros</Title><Toggle type="button" aria-label="Recolher filtros" title="Recolher filtros" onClick={()=>onOpenChange(false)}>‹</Toggle></Header>{filters}</Aside>}<Content>{children}</Content></Layout>
</>;}
