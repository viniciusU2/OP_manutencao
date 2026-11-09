/**
 * Catalogo de tipos de componente do diagrama unifilar.
 *
 * Fonte unica de verdade usada pela biblioteca lateral, pelo no grafico
 * e pelas validacoes de conexao. Cada tipo descreve o simbolo, o tamanho
 * padrao, se aceita associacao com ativo real e quantas conexoes cada
 * terminal tolera (barramento/conexao: multipla; equipamento: 2).
 */

export type TipoComponente = {
  codigo: string;
  nome: string;
  aceitaAtivo: boolean;
  /** Conexoes maximas por terminal; 99 = multipla (barramento). */
  maxPorTerminal: number;
  /** Dimensoes padrao do simbolo em px do diagrama. */
  largura: number;
  altura: number;
  categoria: "estrutura" | "equipamento" | "instrumento" | "apoio";
};

export const CATALOGO: TipoComponente[] = [
  { codigo: "BARRAMENTO", nome: "Barramento", aceitaAtivo: false, maxPorTerminal: 99, largura: 200, altura: 10, categoria: "estrutura" },
  { codigo: "DISJUNTOR", nome: "Disjuntor", aceitaAtivo: true, maxPorTerminal: 1, largura: 44, altura: 72, categoria: "equipamento" },
  { codigo: "SECCIONADORA", nome: "Seccionadora", aceitaAtivo: true, maxPorTerminal: 1, largura: 40, altura: 72, categoria: "equipamento" },
  { codigo: "SECCIONADORA_ATERRAMENTO", nome: "Seccionadora de aterramento", aceitaAtivo: true, maxPorTerminal: 1, largura: 40, altura: 96, categoria: "equipamento" },
  { codigo: "TC", nome: "Transformador de corrente (TC)", aceitaAtivo: true, maxPorTerminal: 1, largura: 40, altura: 72, categoria: "instrumento" },
  { codigo: "TP", nome: "Transformador de potencial (TP)", aceitaAtivo: true, maxPorTerminal: 1, largura: 44, altura: 88, categoria: "instrumento" },
  { codigo: "TPC", nome: "Transformador de potencial capacitivo (TPC)", aceitaAtivo: true, maxPorTerminal: 1, largura: 44, altura: 104, categoria: "instrumento" },
  { codigo: "PARA_RAIOS", nome: "Para-raios", aceitaAtivo: true, maxPorTerminal: 1, largura: 40, altura: 96, categoria: "instrumento" },
  { codigo: "REATOR", nome: "Reator", aceitaAtivo: true, maxPorTerminal: 1, largura: 44, altura: 80, categoria: "equipamento" },
  { codigo: "TRANSFORMADOR", nome: "Transformador de potencia", aceitaAtivo: true, maxPorTerminal: 1, largura: 64, altura: 88, categoria: "equipamento" },
  { codigo: "CONEXAO", nome: "Ponto de conexao", aceitaAtivo: false, maxPorTerminal: 99, largura: 16, altura: 16, categoria: "apoio" },
  { codigo: "ETIQUETA_VAO", nome: "Identificacao de vao", aceitaAtivo: false, maxPorTerminal: 99, largura: 110, altura: 26, categoria: "apoio" },
];

export const TERMINAIS_EQUIPAMENTO = [
  { id: "T1", label: "Superior" },
  { id: "T2", label: "Inferior" },
] as const;

export const TERMINAIS_BARRAMENTO = [
  { id: "B1", label: "Esquerda" },
  { id: "B2", label: "Direita" },
  { id: "B3", label: "Topo" },
  { id: "B4", label: "Base" },
] as const;

const POR_CODIGO = new Map(CATALOGO.map((t) => [t.codigo, t]));

export function tipo(codigo: string): TipoComponente {
  return POR_CODIGO.get(codigo) ?? POR_CODIGO.get("CONEXAO")!;
}

/** Categorias na ordem de exibicao da biblioteca lateral. */
export const CATEGORIAS: TipoComponente["categoria"][] = ["estrutura", "equipamento", "instrumento", "apoio"];

export function proximoId(nodes: { data: { codigo?: string } }[], prefixo: string): string {
  const usados = new Set(
    nodes.map((n) => n.data?.codigo ?? "").filter((c) => c.startsWith(prefixo)),
  );
  let n = 1;
  while (usados.has(`${prefixo}${String(n).padStart(2, "0")}`)) n += 1;
  return `${prefixo}${String(n).padStart(2, "0")}`;
}
