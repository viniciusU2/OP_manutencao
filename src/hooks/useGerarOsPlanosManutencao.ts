import { useEffect } from "react";

export function useGerarOsPlanosManutencao(isAuthenticated: boolean) {
  useEffect(() => {
    void isAuthenticated;
    // Geracao automatica desativada: a rotina de planos deve ser acionada pelo backend/rotina controlada.
  }, [isAuthenticated]);
}
