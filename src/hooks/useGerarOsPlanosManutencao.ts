import { useEffect } from "react";
import { toast } from "sonner";

import api from "../api/api";

const STORAGE_KEY = "os-planos-manutencao-geradas";

type GerarOsPlanosResponse = {
  mensagem?: string;
  total_os?: number;
  total_criadas?: number;
  os_criadas?: unknown[];
};

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function useGerarOsPlanosManutencao(isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated) return;

    const todayKey = getLocalDateKey(new Date());

    if (localStorage.getItem(STORAGE_KEY) === todayKey) {
      return;
    }

    let cancelled = false;

    async function gerarOsPlanos() {
      try {
        const { data } = await api.post<GerarOsPlanosResponse>(
          "/os/gerar-os-planos"
        );

        if (cancelled) return;

        localStorage.setItem(STORAGE_KEY, todayKey);

        const totalCriadas =
          data.total_os ?? data.total_criadas ?? data.os_criadas?.length ?? 0;

        if (totalCriadas > 0) {
          toast.success(`${totalCriadas} OS preventiva gerada automaticamente.`);
        }
      } catch (error) {
        console.error("Erro ao gerar OS preventivas automaticamente:", error);
      }
    }

    gerarOsPlanos();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);
}
