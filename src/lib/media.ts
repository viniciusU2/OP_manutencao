const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/**
 * Resolve a URL de uma mídia exibida no frontend.
 *
 * Fotos enviadas para a API são gravadas com caminho relativo
 * (`/inspecoes/fotos/...`) e precisam ser abertas no host do backend.
 * URLs externas (SharePoint, OneDrive, data: e blob:) continuam intactas.
 */
export function resolveMediaUrl(url?: string | null) {
  const value = url?.trim();
  if (!value) return "";

  if (/^(data:image\/|blob:)/i.test(value)) return value;

  if (value.startsWith("/inspecoes/fotos/")) {
    return `${API_BASE}${value}`;
  }

  if (!/^https?:\/\//i.test(value)) return value;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();

    if (host === "drive.google.com") {
      // Link "abrir no Drive" (/file/d/ID/view) é uma página HTML e não
      // carrega em <img>; o endpoint thumbnail devolve a imagem.
      const id =
        parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ??
        parsed.searchParams.get("id");
      if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
      return value;
    }

    if (host.includes("sharepoint.com") || host.includes("onedrive.live.com")) {
      parsed.searchParams.set("download", "1");
      return parsed.toString();
    }

    return value;
  } catch {
    return value;
  }
}
