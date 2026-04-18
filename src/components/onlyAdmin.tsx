import { useAuth } from "../context/AuthContext";



export function OnlyAdmin({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  console.log(usuario);

  if (usuario?.role !== "admin") return null;

  return <>{children}</>;
}