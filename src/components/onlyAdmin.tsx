import { useAuth } from "../context/AuthContext";
import { canDelete, canManage } from "../lib/permissions";



export function OnlyAdmin({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();

  if (!canDelete(usuario?.role)) return null;

  return <>{children}</>;
}

export function OnlyMaintainerOrAdmin({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();

  if (!canManage(usuario?.role)) return null;

  return <>{children}</>;
}
