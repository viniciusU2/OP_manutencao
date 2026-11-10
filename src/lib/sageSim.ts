/**
 * Motor de simulacao estilo SAGE (supervisao/scada) para o unifilar.
 *
 * O diagrama salvo nao guarda o estado das chaves. A simulacao parte de
 * todos os disjuntores/seccionadoras fechados e seccionadoras de
 * aterramento abertas, e recalcula a topologia a cada manobra.
 *
 * Regras de intertravamento (filosofia operacional):
 *  - Seccionadora nao interrompe corrente: so pode abrir sem carga.
 *  - Disjuntor pode abrir em carga (trip) e fechar em carga.
 *  - Aterramento so fecha com o trecho desenergizado.
 *  - Fechamento e bloqueado quando ha aterramento fechado no trecho.
 */

export type EstadoChave = "ABERTO" | "FECHADO";

export type ComponenteSim = {
  id: string;
  tipo: string;
  codigo: string;
  nome?: string;
  id_ativo?: number | null;
};

export type ArestaSim = {
  id: string;
  source: string;
  target: string;
};

export type BarraSim = {
  id: string;
  codigo: string;
  nome: string;
  tensaoNominalKv: number;
  tensaoKv: number;
  energizada: boolean;
};

export type CargaSim = {
  id: string;
  codigo: string;
  tipo: string;
  energizada: boolean;
  correnteA: number;
};

export type AnaliseSage = {
  energizados: Set<string>;
  carregados: Set<string>;
  aterrados: Set<string>;
  barras: BarraSim[];
  cargas: CargaSim[];
  fonteId: string | null;
};

export const TIPOS_OPERAVEIS = new Set([
  "DISJUNTOR",
  "SECCIONADORA",
  "SECCIONADORA_ATERRAMENTO",
]);

export const TIPOS_CARGA = new Set(["REATOR", "TRANSFORMADOR"]);

export const ehOperavel = (tipo: string) => TIPOS_OPERAVEIS.has(tipo);
export const ehAterramento = (tipo: string) => tipo === "SECCIONADORA_ATERRAMENTO";

export function estadoInicial(componentes: ComponenteSim[]): Record<string, EstadoChave> {
  const estados: Record<string, EstadoChave> = {};
  for (const c of componentes) {
    if (!ehOperavel(c.tipo)) continue;
    estados[c.id] = ehAterramento(c.tipo) ? "ABERTO" : "FECHADO";
  }
  return estados;
}

function hash(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i += 1) {
    h = (h * 31 + texto.charCodeAt(i)) % 100000;
  }
  return h;
}

function tensaoNominal(codigo: string, nome: string, fallback: number): number {
  const achado = /(\d{2,3})\s*kv/i.exec(`${nome} ${codigo}`);
  if (achado) return Number(achado[1]);
  return fallback;
}

function criarAdjacencia(arestas: ArestaSim[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  const ligar = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  };
  for (const a of arestas) ligar(a.source, a.target);
  return adj;
}

function alcancaveis(
  inicio: string[],
  adj: Map<string, Set<string>>,
  bloqueados: Set<string>,
): Set<string> {
  const vistos = new Set<string>();
  const fila = [...inicio];
  for (const id of fila) vistos.add(id);

  while (fila.length) {
    const atual = fila.shift()!;
    for (const vizinho of adj.get(atual) ?? []) {
      if (vistos.has(vizinho) || bloqueados.has(vizinho)) continue;
      vistos.add(vizinho);
      fila.push(vizinho);
    }
  }
  return vistos;
}

/** Barramento mais alto do diagrama e a fonte de energia da simulacao. */
export function escolherFonte(
  componentes: ComponenteSim[],
  posicoes: Record<string, { x: number; y: number }>,
): string | null {
  const barras = componentes.filter((c) => c.tipo === "BARRAMENTO");
  if (!barras.length) return null;
  return barras.sort((a, b) => (posicoes[a.id]?.y ?? 0) - (posicoes[b.id]?.y ?? 0))[0].id;
}

export function analisar(
  componentes: ComponenteSim[],
  arestas: ArestaSim[],
  estados: Record<string, EstadoChave>,
  fonteId: string | null,
  tensaoBaseKv: number,
  posicoes: Record<string, { x: number; y: number }> = {},
): AnaliseSage {
  const adj = criarAdjacencia(arestas);

  const abertos = new Set<string>();
  for (const c of componentes) {
    if (ehOperavel(c.tipo) && estados[c.id] === "ABERTO") abertos.add(c.id);
  }

  const fontes = fonteId ? [fonteId] : [];
  const energizados = alcancaveis(fontes, adj, abertos);

  // Seccionadora nao interrompe corrente: se os dois lados estao
  // energizados, a lamina esta em carga e o comando e bloqueado.
  const carregados = new Set<string>();
  for (const c of componentes) {
    if (c.tipo !== "SECCIONADORA" || estados[c.id] === "ABERTO") continue;
    const vizinhos = [...(adj.get(c.id) ?? [])];
    const ladosVivos = vizinhos.filter((id) => energizados.has(id)).length;
    if (ladosVivos >= 2) carregados.add(c.id);
  }

  // Aterramentos fechados deixam o trecho marcado (intertravamento).
  const aterrados = new Set<string>();
  for (const c of componentes) {
    if (!ehAterramento(c.tipo) || estados[c.id] !== "FECHADO") continue;
    const vizinhos = alcancaveis([c.id], adj, new Set());
    vizinhos.forEach((id) => aterrados.add(id));
  }

  const barras: BarraSim[] = componentes
    .filter((c) => c.tipo === "BARRAMENTO")
    .sort((a, b) => (posicoes[a.id]?.y ?? 0) - (posicoes[b.id]?.y ?? 0))
    .map((c) => {
      const nominal = tensaoNominal(c.codigo, c.nome ?? "", tensaoBaseKv);
      const viva = energizados.has(c.id);
      const variacao = 1.045 + ((hash(c.codigo) % 21) - 10) / 1000;
      return {
        id: c.id,
        codigo: c.codigo,
        nome: c.nome ?? c.codigo,
        tensaoNominalKv: nominal,
        tensaoKv: viva ? Math.round(nominal * variacao * 10) / 10 : 0,
        energizada: viva,
      };
    });

  const cargasSim: CargaSim[] = componentes
    .filter((c) => TIPOS_CARGA.has(c.tipo))
    .map((c) => {
      const viva = energizados.has(c.id);
      const base = c.tipo === "TRANSFORMADOR" ? 420 : 235;
      return {
        id: c.id,
        codigo: c.codigo,
        tipo: c.tipo,
        energizada: viva,
        correnteA: viva ? base + (hash(c.id) % 40) - 20 : 0,
      };
    });

  return { energizados, carregados, aterrados, barras, cargas: cargasSim, fonteId };
}

export type ResultadoComando = {
  permitido: boolean;
  severidade: "INFO" | "ATENCAO" | "BLOQUEIO";
  motivo: string;
};

/** Valida um comando de abertura/fechamento conforme os intertravamentos. */
export function validarComando(
  componente: ComponenteSim,
  novoEstado: EstadoChave,
  analise: AnaliseSage,
  estados: Record<string, EstadoChave>,
  componentes: ComponenteSim[],
  arestas: ArestaSim[],
): ResultadoComando {
  if (!ehOperavel(componente.tipo)) {
    return { permitido: false, severidade: "BLOQUEIO", motivo: "Componente sem comando de operacao." };
  }

  const atual = estados[componente.id] ?? "FECHADO";
  if (atual === novoEstado) {
    return { permitido: false, severidade: "INFO", motivo: "O equipamento ja esta nesse estado." };
  }

  const abrindo = novoEstado === "ABERTO";

  if (ehAterramento(componente.tipo)) {
    if (!abrindo && analise.energizados.has(componente.id)) {
      return {
        permitido: false,
        severidade: "BLOQUEIO",
        motivo: "Aterramento bloqueado: trecho energizado. Desenergize antes de aterrar.",
      };
    }
    return { permitido: true, severidade: "INFO", motivo: abrindo ? "Aterramento aberto." : "Aterramento fechado." };
  }

  if (!abrindo) {
    // Fechamento com aterramento presente no trecho.
    if (analise.aterrados.has(componente.id)) {
      return {
        permitido: false,
        severidade: "BLOQUEIO",
        motivo: "Fechamento bloqueado: existe aterramento fechado no trecho.",
      };
    }
    const aviso = analise.energizados.has(componente.id)
      ? "Fechamento em anel energizado (sincronismo verificado)."
      : "Fechamento energiza o trecho.";
    return { permitido: true, severidade: "INFO", motivo: aviso };
  }

  if (componente.tipo === "SECCIONADORA" && analise.carregados.has(componente.id)) {
    return {
      permitido: false,
      severidade: "BLOQUEIO",
      motivo: "Seccionadora sob carga: abra o disjuntor do vao antes de manobrar.",
    };
  }

  if (componente.tipo === "DISJUNTOR") {
    const semDisjuntor = alcancaveis(
      analise.fonteId ? [analise.fonteId] : [],
      criarAdjacencia(arestas),
      new Set([
        ...componentes.filter((c) => ehOperavel(c.tipo) && estados[c.id] === "ABERTO").map((c) => c.id),
        componente.id,
      ]),
    );
    const cargasAntes = analise.cargas.filter((c) => c.energizada).length;
    const cargasDepois = analise.cargas.filter((c) => semDisjuntor.has(c.id)).length;
    if (cargasDepois < cargasAntes) {
      return {
        permitido: true,
        severidade: "ATENCAO",
        motivo: `Abertura desenergiza ${cargasAntes - cargasDepois} carga(s). Confirme a manobra.`,
      };
    }
  }

  return { permitido: true, severidade: "INFO", motivo: "Comando liberado pelos intertravamentos." };
}
