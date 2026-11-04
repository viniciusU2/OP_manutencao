/**
 * Converte o "detail" de erro da API em texto para o usuario.
 *
 * O FastAPI devolve formatos diferentes:
 *   erro de negocio  -> detail: string ("Link invalido, expirado...")
 *   erro de validacao -> detail: [{ loc, msg, type, ... }, ...] (HTTP 422)
 * Sem esse tratamento, um detail em lista entra direto no estado e derruba
 * o React ("Objects are not valid as a React child") com tela branca.
 */
export function textoDoErro(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((item) => (typeof item?.msg === "string" ? item.msg : ""))
      .filter(Boolean);
    if (msgs.length) return msgs.join("; ");
  }
  if (detail && typeof detail === "object") {
    const msg = (detail as { msg?: unknown }).msg;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
}
