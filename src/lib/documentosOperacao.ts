import type { Ativo } from "../types/Ativo";
import type { TipoAtivo } from "../types/TipoAtivo";

export const PRIORIDADES_OPERACAO = [
  { value: "NIVEL_1", label: "Nivel 1 - Emergencial: 0 a 24h" },
  { value: "NIVEL_2", label: "Nivel 2 - Urgente: ate 3 dias" },
  { value: "NIVEL_3", label: "Nivel 3 - Programado prioritario: ate 15 dias" },
  { value: "NIVEL_4", label: "Nivel 4 - Programado: ate 60 dias" },
  { value: "NIVEL_5", label: "Nivel 5 - Melhoria/Oportunidade: ate 180 dias" },
  { value: "NIVEL_6", label: "Nivel 6 - Monitoramento: conforme planejamento da O&M" },
];

export function normalizarPrioridadeOperacao(prioridade?: string | null) {
  if (prioridade === "ALTA") return "NIVEL_1";
  if (prioridade === "MEDIA") return "NIVEL_3";
  if (prioridade === "BAIXA") return "NIVEL_5";

  return prioridade || "NIVEL_3";
}

function limparTexto(valor?: string | null) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function parteCodigo(valor?: string | null) {
  return limparTexto(valor)
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function abreviarTipoAtivo(nome?: string | null) {
  const normalizado = limparTexto(nome);

  if (!normalizado) return "";
  if (normalizado.includes("GMG")) return "GMG";
  if (normalizado.includes("GRUPO") && normalizado.includes("GERADOR")) return "GMG";
  if (normalizado.includes("GERADOR")) return "GMG";
  if (normalizado.includes("PARA") && normalizado.includes("RAIO")) return "PR";
  if (normalizado.includes("SECCION")) return "SEC";
  if (normalizado.includes("DISJUNT")) return "DJ";
  if (normalizado.includes("TC") || normalizado.includes("CORRENTE")) return "TC";
  if (normalizado.includes("TP") || normalizado.includes("POTENCIAL")) return "TP";
  if (normalizado.includes("REATOR")) return "RE";
  if (normalizado.includes("TRANSFORMADOR") || normalizado.includes("TRAFO")) return "TR";
  if (normalizado.includes("BARRA")) return "BA";
  if (normalizado.includes("TORRE")) return "TOR";

  const palavras = normalizado.match(/[A-Z0-9]+/g) ?? [];
  if (palavras.length === 1) return palavras[0].slice(0, 4);
  return palavras.map((palavra) => palavra[0]).join("").slice(0, 4);
}

function formatarClasseTensao(valor?: number | string | null) {
  if (valor === undefined || valor === null || valor === "") return "";

  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "";

  return `${Number.isInteger(numero) ? numero : Number(numero.toFixed(2))}KV`;
}

export function especiePorAtivo(ativo?: Ativo | null, tipos: TipoAtivo[] = []) {
  if (!ativo) return "";

  const tipo = tipos.find(
    (item) => Number(item.id_tipo_ativo) === Number(ativo.id_tipo_ativo)
  );
  const abreviacao = abreviarTipoAtivo(tipo?.nome);
  const classeTensao = formatarClasseTensao(ativo.tensao_nominal_kv);
  const fabricante = parteCodigo(ativo.fabricante);

  if (abreviacao && classeTensao && fabricante) {
    return [abreviacao, classeTensao, fabricante].join("_");
  }

  return ativo.especie?.trim() || "";
}
