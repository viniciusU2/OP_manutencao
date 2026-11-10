/**
 * Simbolos SVG dos componentes do unifilar.
 *
 * Cada simbolo desenha um componente em orientacao vertical (o topo do
 * vector view e o terminal T1). A rotacao de 90/180/270 e aplicada por
 * quem renderiza o no (NoUnifilar), e nao aqui. Estilo: traco escuro
 * unico, sem preenchimento, como diagrama tecnico de subestacao.
 */

const COR = "#0f172a";
const COR_VERMELHO = "#dc2626";
const COR_VERDE = "#16a34a";
const COR_MORTO = "#94a3b8";
const traço = { stroke: COR, strokeWidth: 2, fill: "none" } as const;

import type { ReactNode } from "react";

function Frame(svg: ReactNode, w: number, h: number) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} xmlns="http://www.w3.org/2000/svg">
      {svg}
    </svg>
  );
}

/** Tramos de condutor com o terminal no topo (T1) e na base (T2). */


function AterramentoSimbolo(
  x: number,
  y: number,
  estilo: { stroke: string; strokeWidth: number; fill: string } = traço,
) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 8} {...estilo} />
      <line x1={x - 8} y1={y + 8} x2={x + 8} y2={y + 8} {...estilo} />
      <line x1={x - 5} y1={y + 12} x2={x + 5} y2={y + 12} {...estilo} />
      <line x1={x - 2} y1={y + 16} x2={x + 2} y2={y + 16} {...estilo} />
    </g>
  );
}

export function SimboloUnifilar({
  tipo,
  largura,
  altura,
  aberto = false,
  energizado = true,
  modoScada = false,
}: {
  tipo: string;
  largura: number;
  altura: number;
  aberto?: boolean;
  energizado?: boolean;
  modoScada?: boolean;
}) {
  // Cores de supervisao: disjuntor fechado e energizado em vermelho, chave
  // aberta em verde e equipamento desenergizado em cinza.
  const corDisjuntor = !modoScada
    ? COR
    : aberto
      ? COR_VERDE
      : energizado
        ? COR_VERMELHO
        : COR_MORTO;
  const corChave = !modoScada ? COR : aberto ? COR_VERDE : energizado ? COR : COR_MORTO;
  const tracoDisjuntor = { stroke: corDisjuntor, strokeWidth: 2, fill: "none" } as const;
  const tracoChave = { stroke: corChave, strokeWidth: 2, fill: "none" } as const;

  switch (tipo) {
    case "BARRAMENTO": {
      // Barra mais espessa para leitura clara no diagrama e no SAGE.
      const margem = 1;
      return Frame(
        <rect
          x={margem}
          y={margem}
          width={Math.max(1, largura - margem * 2)}
          height={Math.max(1, altura - margem * 2)}
          fill={COR}
          rx={1.5}
        />,
        largura,
        altura,
      );
    }

    case "DISJUNTOR": {
      // ANSI 52: quadrado com X quando fechado; contato aberto quando aberto.
      // No SAGE o interior e preenchido com a cor do estado (vermelho/verde).
      const lado = Math.min(34, largura - 10);
      const cx = largura / 2;
      const topoCaixa = (altura - lado) / 2;
      const corInterna = modoScada ? "#ffffff" : corDisjuntor;
      const tracoInterno = { stroke: corInterna, strokeWidth: 2, fill: "none" } as const;
      return Frame(
        <g>
          <line x1={cx} y1={0} x2={cx} y2={topoCaixa} {...tracoDisjuntor} />
          <rect
            x={cx - lado / 2}
            y={topoCaixa}
            width={lado}
            height={lado}
            stroke={corDisjuntor}
            strokeWidth={2}
            fill={modoScada ? corDisjuntor : "none"}
            rx={1.5}
          />
          {aberto ? (
            <>
              <circle cx={cx - lado / 2 + 3} cy={topoCaixa + lado / 2} r={2} fill={corInterna} />
              <line
                x1={cx - lado / 2 + 3}
                y1={topoCaixa + lado / 2}
                x2={cx + lado / 2 - 1}
                y2={topoCaixa + 2}
                {...tracoInterno}
              />
            </>
          ) : (
            <>
              <line x1={cx - lado / 2} y1={topoCaixa} x2={cx + lado / 2} y2={topoCaixa + lado} {...tracoInterno} />
              <line x1={cx + lado / 2} y1={topoCaixa} x2={cx - lado / 2} y2={topoCaixa + lado} {...tracoInterno} />
            </>
          )}
          <line x1={cx} y1={topoCaixa + lado} x2={cx} y2={altura} {...tracoDisjuntor} />
        </g>,
        largura,
        altura,
      );
    }

    case "SECCIONADORA": {
      // Lâmina vertical quando fechada; lâmina em diagonal quando aberta.
      const cx = largura / 2;
      const meio = altura * 0.62;
      const abertura = Math.min(22, altura * 0.28);
      return Frame(
        <g>
          <line x1={cx} y1={0} x2={cx} y2={meio - abertura} {...tracoChave} />
          <circle cx={cx} cy={meio - abertura} r={3} {...tracoChave} />
          <line x1={cx} y1={meio + abertura} x2={cx} y2={altura} {...tracoChave} />
          <circle cx={cx} cy={meio + abertura} r={3} {...tracoChave} />
          {modoScada && !aberto ? (
            <line x1={cx} y1={meio - abertura} x2={cx} y2={meio + abertura} {...tracoChave} />
          ) : (
            <line x1={cx} y1={meio - abertura} x2={cx - 26} y2={meio + abertura + 14} {...tracoChave} />
          )}
        </g>,
        largura,
        altura,
      );
    }

    case "SECCIONADORA_ATERRAMENTO": {
      // Lâmina para o aterramento: conectada a terra quando fechada.
      const cx = largura / 2;
      const meio = altura * 0.5;
      const abertura = Math.min(20, altura * 0.22);
      return Frame(
        <g>
          <line x1={cx} y1={0} x2={cx} y2={meio - abertura} {...tracoChave} />
          <circle cx={cx} cy={meio - abertura} r={3} {...tracoChave} />
          <line x1={cx} y1={meio + abertura} x2={cx} y2={altura} {...tracoChave} />
          {modoScada && !aberto ? (
            <line x1={cx} y1={meio - abertura} x2={cx} y2={altura - 30} {...tracoChave} />
          ) : (
            <line x1={cx} y1={meio - abertura} x2={cx - 24} y2={meio + abertura + 12} {...tracoChave} />
          )}
          {AterramentoSimbolo(cx, altura - 30, tracoChave)}
        </g>,
        largura,
        altura,
      );
    }

    case "TC": {
      return (
        <svg viewBox="0 0 32 108" width={largura} height={altura} fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          <path d="M11.5203 22L11.5203 0" stroke="black" />
          <rect x="7.02026" y="22.5" width="10" height="11" stroke="black" />
          <path d="M15.0203 71C4.52025 72 0.0374426 71.5 0.537438 66.5C0.537438 62 5.02026 61.5 15.0203 61.5" stroke="black" />
          <path d="M11.5203 108L11.5203 34" stroke="black" />
          <path d="M21.5202 53L21.5201 53C11.0201 52 0.520235 51 1.02023 56C1.02023 60.5 5.52023 61.5 15.5202 61.5" stroke="black" />
          <rect x="21.0203" y="47.5" width="10" height="11" stroke="black" />
        </svg>
      );
    }

    case "TP": {
      // ANSI 201: circulo de tapamento acoplado ao tramo.
      const r = Math.min(largura * 0.82, altura * 0.3);
      const cx = largura / 2;
      const cyP = altura * 0.5;
      return Frame(
        <g>
          <line x1={cx} y1={0} x2={cx} y2={cyP - r} {...traço} />
          <circle cx={cx} cy={cyP} r={r} {...traço} />
          <line x1={cx} y1={cyP + r} x2={cx} y2={altura} {...traço} />
          <line x1={cx - r * 0.7} y1={cyP} x2={cx + r * 0.7} y2={cyP} {...traço} />
        </g>,
        largura,
        altura,
      );
    }

    case "TPC": {
      // TPC conforme o desenho de referencia: coluna de unidades capacitivas
      // ligada por tracejado ao divisor, capacitor em serie, bobina e terra.
      const unidade = (y: number) => (
        <g key={y}>
          <path d={`M16 ${y} A6 6 0 0 0 16 ${y + 12}`} stroke={COR} strokeWidth={2} fill="none" />
          <path d={`M22 ${y} A6 6 0 0 1 22 ${y + 12}`} stroke={COR} strokeWidth={2} fill="none" />
          <line x1={22} y1={y + 6} x2={34} y2={y + 6} stroke={COR} strokeWidth={2} />
          <circle cx={37} cy={y + 6} r={2.5} stroke={COR} strokeWidth={2} fill="none" />
        </g>
      );
      return (
        <svg viewBox="0 0 44 96" width={largura} height={altura} fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          {unidade(8)}
          {unidade(28)}
          {unidade(48)}
          <line x1={8} y1={14} x2={8} y2={72} stroke={COR} strokeWidth={1.5} strokeDasharray="4 3" />
          <line x1={8} y1={34} x2={16} y2={34} stroke={COR} strokeWidth={1.5} strokeDasharray="3 2" />
          <line x1={8} y1={54} x2={16} y2={54} stroke={COR} strokeWidth={1.5} strokeDasharray="3 2" />
          <line x1={0} y1={72} x2={44} y2={72} stroke={COR} strokeWidth={2} />
          <circle cx={8} cy={72} r={2} fill={COR} />
          <line x1={18} y1={64} x2={18} y2={80} stroke={COR} strokeWidth={2.5} />
          <line x1={23} y1={64} x2={23} y2={80} stroke={COR} strokeWidth={2.5} />
          <path d="M28 72 q2 -6 4 0 q2 -6 4 0 q2 -6 4 0" stroke={COR} strokeWidth={2} fill="none" />
          <line x1={40} y1={72} x2={40} y2={78} stroke={COR} strokeWidth={2} />
          <line x1={35} y1={78} x2={45} y2={78} stroke={COR} strokeWidth={2} />
          <line x1={37} y1={83} x2={43} y2={83} stroke={COR} strokeWidth={2} />
        </svg>
      );
    }

    case "PARA_RAIOS": {
      // Para-raios conforme o desenho de referencia: condutor, bloco do
      // varistor com seta diagonal de descarga e ligacao ao aterramento.
      return (
        <svg viewBox="0 0 40 96" width={largura} height={altura} fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          <line x1={20} y1={0} x2={20} y2={22} stroke={COR} strokeWidth={2} />
          <rect x={12} y={22} width={16} height={30} stroke={COR} strokeWidth={2} />
          <line x1={9} y1={18} x2={28} y2={50} stroke={COR} strokeWidth={2} />
          <polygon points="28,50 19,48 24,42" fill={COR} />
          <line x1={20} y1={52} x2={20} y2={68} stroke={COR} strokeWidth={2} />
          <line x1={10} y1={68} x2={30} y2={68} stroke={COR} strokeWidth={2} />
          <line x1={14} y1={74} x2={26} y2={74} stroke={COR} strokeWidth={2} />
          <line x1={17} y1={80} x2={23} y2={80} stroke={COR} strokeWidth={2} />
        </svg>
      );
    }

    case "REATOR": {
      // Simbolo baseado no desenho Reator.svg fornecido pelo usuario.
      return (
        <svg
          viewBox="0 0 86 214"
          width={largura}
          height={altura}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <path d="M42.5 119.5L42.5 22.9899" stroke="black" />
          <line x1="42.5" y1="214" x2="42.5" y2="183" stroke="black" />
          <line x1="86" y1="23.5" y2="23.5" stroke="black" />
          <line x1="73" y1="11.5" x2="13" y2="11.5" stroke="black" />
          <line x1="58" y1="0.5" x2="28" y2="0.5" stroke="black" />
          <path d="M42.5 119.681C36.7602 121.396 33 124.258 33 127.5C33 130.742 36.7602 133.604 42.5 135.319" stroke="black" />
          <path d="M41 166.5C35.2602 168.214 32 171.577 32 174.819C32 178.06 36.7602 181.786 42.5 183.5" stroke="black" />
          <path d="M40.5714 152C35.3741 150.136 32 147.128 32 143.735C32 140.04 36.0009 136.802 42 135" stroke="black" />
          <path d="M41 166.765C35.5428 165.036 32 162.247 32 159.1C32 155.674 33.7009 153.671 40 152" stroke="black" />
        </svg>
      );
    }

    case "TRANSFORMADOR": {
      // ANSI 2: dois enrolamentos concentricos lado a lado.
      const cx = largura / 2;
      const rW = Math.min(largura, altura) * 0.36;
      const topo = altura * 0.34;
      return Frame(
        <g>
          <line x1={cx - rW / 2} y1={0} x2={cx - rW / 2} y2={topo + 10} {...traço} />
          <line x1={cx + rW * 1.5} y1={altura} x2={cx + rW * 1.5} y2={topo + 10 + rW * 2 - 10} {...traço} />
          <circle cx={cx} cy={topo + rW} r={rW} {...traço} />
          <circle cx={cx + rW} cy={topo + rW} r={rW} {...traço} />
          <line x1={cx} y1={topo + rW} x2={cx} y2={altura} {...traço} opacity={0} />
        </g>,
        largura,
        altura,
      );
    }

    case "CONEXAO": {
      return Frame(<circle cx={largura / 2} cy={altura / 2} r={4} fill={COR} />, largura, altura);
    }

    case "ETIQUETA_VAO": {
      return Frame(
        <g>
          <rect x={1} y={3} width={largura - 2} height={altura - 6} rx={6} {...traço} />
          <line x1={10} y1={altura / 2} x2={16} y2={altura / 2} {...traço} />
        </g>,
        largura,
        altura,
      );
    }

    default: {
      return Frame(
        <rect x={2} y={6} width={largura - 4} height={altura - 12} {...traço} strokeDasharray="5 4" />,
        largura,
        altura,
      );
    }
  }
}
