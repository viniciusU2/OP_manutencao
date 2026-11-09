/**
 * Simbolos SVG dos componentes do unifilar.
 *
 * Cada simbolo desenha um componente em orientacao vertical (o topo do
 * vector view e o terminal T1). A rotacao de 90/180/270 e aplicada por
 * quem renderiza o no (NoUnifilar), e nao aqui. Estilo: traco escuro
 * unico, sem preenchimento, como diagrama tecnico de subestacao.
 */

const COR = "#0f172a";
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


function AterramentoSimbolo(x: number, y: number) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 8} {...traço} />
      <line x1={x - 8} y1={y + 8} x2={x + 8} y2={y + 8} {...traço} />
      <line x1={x - 5} y1={y + 12} x2={x + 5} y2={y + 12} {...traço} />
      <line x1={x - 2} y1={y + 16} x2={x + 2} y2={y + 16} {...traço} />
    </g>
  );
}

export function SimboloUnifilar({
  tipo,
  largura,
  altura,
}: {
  tipo: string;
  largura: number;
  altura: number;
}) {
  switch (tipo) {
    case "BARRAMENTO": {
      return Frame(
        <rect x={4} y={4} width={largura - 8} height={altura - 8} fill={COR} rx={1} />,
        largura,
        altura,
      );
    }

    case "DISJUNTOR": {
      // ANSI 52: contato aberto quadrado entre os tramos.
      const lado = Math.min(34, largura - 10);
      const cx = largura / 2;
      const topoCaixa = (altura - lado) / 2;
      return Frame(
        <g>
          <line x1={cx} y1={0} x2={cx} y2={topoCaixa} {...traço} />
          <rect x={cx - lado / 2} y={topoCaixa} width={lado} height={lado} {...traço} />
          <line x1={cx - lado / 2} y1={topoCaixa} x2={cx + lado / 2} y2={topoCaixa + lado} {...traço} />
          <line x1={cx + lado / 2} y1={topoCaixa} x2={cx - lado / 2} y2={topoCaixa + lado} {...traço} />
          <line x1={cx} y1={topoCaixa + lado} x2={cx} y2={altura} {...traço} />
        </g>,
        largura,
        altura,
      );
    }

    case "SECCIONADORA": {
      // ANSI 29: lâmina aberta em diagonal.
      const cx = largura / 2;
      const meio = altura * 0.62;
      const abertura = Math.min(22, altura * 0.28);
      return Frame(
        <g>
          <line x1={cx} y1={0} x2={cx} y2={meio - abertura} {...traço} />
          <circle cx={cx} cy={meio - abertura} r={3} {...traço} />
          <line x1={cx} y1={meio + abertura} x2={cx} y2={altura} {...traço} />
          <circle cx={cx} cy={meio + abertura} r={3} {...traço} />
      <line x1={cx} y1={meio - abertura} x2={cx - 26} y2={meio + abertura + 14} {...traço} />
        </g>,
        largura,
        altura,
      );
    }

    case "SECCIONADORA_ATERRAMENTO": {
      // Seccionadora com lâmina para o aterramento.
      const cx = largura / 2;
      const meio = altura * 0.5;
      const abertura = Math.min(20, altura * 0.22);
      return Frame(
        <g>
          <line x1={cx} y1={0} x2={cx} y2={meio - abertura} {...traço} />
          <circle cx={cx} cy={meio - abertura} r={3} {...traço} />
          <line x1={cx} y1={meio + abertura} x2={cx} y2={altura} {...traço} />
          <line x1={cx} y1={meio - abertura} x2={cx - 24} y2={meio + abertura + 12} {...traço} />
          {AterramentoSimbolo(cx, altura - 30)}
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
      // Capacitor de acoplamento + divisor capacitivo (duas placas em serie).
      const cx = largura / 2;
      const metade = altura * 0.42;
      const larguraPlaca = Math.min(largura * 0.86, 24);
      return Frame(
        <g>
          <line x1={cx} y1={0} x2={cx} y2={metade} {...traço} />
          <line x1={cx - larguraPlaca / 2} y1={metade} x2={cx + larguraPlaca / 2} y2={metade} {...traço} strokeWidth={3} />
          <line x1={cx - larguraPlaca / 2} y1={metade + 8} x2={cx + larguraPlaca / 2} y2={metade + 8} {...traço} strokeWidth={3} />
          <line x1={cx} y1={metade + 8} x2={cx} y2={metade + 22} {...traço} />
          <circle cx={cx} cy={metade + 30} r={8} {...traço} />
          <line x1={cx} y1={metade + 38} x2={cx} y2={altura} {...traço} />
        </g>,
        largura,
        altura,
      );
    }

    case "PARA_RAIOS": {
      // Desvio de surto com seta descendente para o aterramento.
      const cx = largura / 2;
      const meio = altura * 0.5;
      return Frame(
        <g>
      <line x1={cx} y1={0} x2={cx} y2={meio - 14} {...traço} />
          <line x1={cx} y1={meio - 14} x2={cx} y2={altura} {...traço} />
          <line x1={cx - 6} y1={meio - 14} x2={cx + 6} y2={meio - 14} {...traço} strokeWidth={3} />
          <line x1={cx - 9} y1={meio - 9} x2={cx + 9} y2={meio + 12} {...traço} />
          <polygon points={`${cx + 9},${meio + 12} ${cx + 1},${meio + 6} ${cx + 3},${meio + 12} `} fill={COR} />
          {AterramentoSimbolo(cx, altura - 30)}
        </g>,
        largura,
        altura,
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
