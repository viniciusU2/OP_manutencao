import type { ReactNode } from "react";
import styled from "styled-components";
import background from "../assets/fundo.jpeg";

const Page = styled.main`
  min-height:100vh; display:grid; place-items:center; padding:24px; position:relative;
  background:#07111f url(${background}) center/cover no-repeat;
  &::before{content:"";position:absolute;inset:0;background:rgba(7,17,31,.68)}
`;
const Card = styled.section`
  position:relative;z-index:1;width:100%;max-width:430px;padding:32px;border-radius:16px;
  background:rgba(248,250,252,.98);color:#0f172a;box-shadow:0 24px 70px rgba(2,8,23,.4);
  @media(max-width:520px){padding:24px}
`;
const Brand = styled.div`
  display:flex;align-items:center;gap:12px;margin-bottom:28px;
  img{width:44px;height:44px;border-radius:9px} strong{display:block;letter-spacing:.08em}
  span{display:block;color:#64748b;font-size:11px;margin-top:2px}
`;

export function PasswordRecoveryLayout({ children }: { children: ReactNode }) {
  return <Page><Card>
    <Brand><img src="/icone-v.svg" alt="ENGVI"/><div><strong>ENGVI</strong><span>Gestão da Vida e Integridade dos Ativos</span></div></Brand>
    {children}
  </Card></Page>;
}
