import { useEffect, useMemo, useState } from "react";
import type { SelectHTMLAttributes } from "react";

import api from "../api/api";

interface UsuarioAtivoOption {
  id: number;
  nome: string;
  role: string;
}

type UsuarioSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  value?: string | null;
};

let usuariosCache: UsuarioAtivoOption[] | null = null;

export default function UsuarioSelect({
  value,
  disabled,
  ...props
}: UsuarioSelectProps) {
  const [usuarios, setUsuarios] = useState<UsuarioAtivoOption[]>(
    usuariosCache ?? []
  );
  const [loading, setLoading] = useState(!usuariosCache);

  useEffect(() => {
    let cancelled = false;

    async function carregarUsuarios() {
      if (usuariosCache) return;

      try {
        const { data } = await api.get<UsuarioAtivoOption[]>("/usuarios/ativos");

        if (cancelled) return;

        usuariosCache = data;
        setUsuarios(data);
      } catch (error) {
        console.error("Erro ao carregar usuarios ativos:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    carregarUsuarios();

    return () => {
      cancelled = true;
    };
  }, []);

  const opcoes = useMemo(() => {
    const nomes = new Set(usuarios.map((usuario) => usuario.nome));

    if (value && !nomes.has(value)) {
      return [{ id: -1, nome: value, role: "valor_atual" }, ...usuarios];
    }

    return usuarios;
  }, [usuarios, value]);

  return (
    <select value={value ?? ""} disabled={disabled || loading} {...props}>
      <option value="">{loading ? "Carregando..." : "Selecione"}</option>
      {opcoes.map((usuario) => (
        <option key={`${usuario.id}-${usuario.nome}`} value={usuario.nome}>
          {usuario.nome}
        </option>
      ))}
    </select>
  );
}
