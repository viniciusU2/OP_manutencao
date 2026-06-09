import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { RefreshCw, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import type { Subestacao } from "../types/Subestacao";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

type PerfilRole = "admin" | "mantenedor" | "usuario";

type UsuarioPerfil = {
  id: number;
  nome: string;
  email: string;
  foto?: string | null;
  ativo: boolean;
  criado_em: string;
  role: PerfilRole | string;
  id_subestacao_padrao?: number | null;
};

type ApiError = {
  detail?: string;
};

const PERFIS: Array<{ value: PerfilRole; label: string; description: string }> = [
  {
    value: "admin",
    label: "Admin",
    description: "Acesso completo, incluindo exclusoes e perfis.",
  },
  {
    value: "mantenedor",
    label: "Mantenedor",
    description: "Acesso operacional completo, sem deletar.",
  },
  {
    value: "usuario",
    label: "Usuario",
    description: "Acesso basico ao sistema.",
  },
];

function normalizarPerfil(role?: string | null): PerfilRole {
  const normalized = (role ?? "usuario").trim().toLowerCase();
  if (normalized === "admin" || normalized === "mantenedor" || normalized === "usuario") {
    return normalized;
  }
  return "usuario";
}

function formatarData(valor?: string) {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

function extrairErro(error: unknown) {
  const axiosError = error as AxiosError<ApiError>;
  return axiosError.response?.data?.detail ?? "Nao foi possivel concluir a alteracao.";
}

export default function PerfisPage() {
  const { usuario, login } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState<Set<number>>(new Set());

  const totais = useMemo(() => {
    return {
      usuarios: usuarios.length,
      ativos: usuarios.filter((item) => item.ativo).length,
      admins: usuarios.filter((item) => normalizarPerfil(item.role) === "admin").length,
    };
  }, [usuarios]);

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      const { data } = await api.get<UsuarioPerfil[]>("/usuarios");
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      setErro(extrairErro(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  useEffect(() => {
    api
      .get<Subestacao[]>("/subestacao")
      .then(({ data }) => setSubestacoes(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Erro ao carregar instalacoes"));
  }, []);

  async function atualizarUsuario(
    id: number,
    payload: Partial<Pick<UsuarioPerfil, "role" | "ativo" | "id_subestacao_padrao">>
  ) {
    setAtualizando((prev) => new Set(prev).add(id));

    try {
      const { data } = await api.put<UsuarioPerfil>(`/usuarios/${id}`, payload);
      setUsuarios((prev) => prev.map((item) => (item.id === id ? data : item)));
      if (data.id === usuario?.id) {
        const token = localStorage.getItem("token");
        if (token) login(data, token);
      }
      toast.success("Perfil atualizado");
    } catch (error) {
      toast.error(extrairErro(error));
    } finally {
      setAtualizando((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
            <UserCog size={16} />
            Controle de acesso
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Perfis de usuarios</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Gerencie o perfil e o status de acesso das pessoas cadastradas no sistema.
          </p>
        </div>

        <Button className="w-full sm:w-auto" variant="outline" onClick={carregarUsuarios} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg py-5">
          <CardHeader className="gap-1 px-5">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{totais.usuarios}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-lg py-5">
          <CardHeader className="gap-1 px-5">
            <CardDescription>Ativos</CardDescription>
            <CardTitle className="text-2xl">{totais.ativos}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-lg py-5">
          <CardHeader className="gap-1 px-5">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-2xl">{totais.admins}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Usuarios cadastrados</CardTitle>
          <CardDescription>Admins podem alterar perfis e ativar ou desativar acessos.</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {erro && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Instalacao inicial</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                    Carregando usuarios...
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                usuarios.map((item) => {
                  const isSelf = item.id === usuario?.id;
                  const isUpdating = atualizando.has(item.id);
                  const perfilAtual = normalizarPerfil(item.role);

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                            {item.nome?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 font-medium text-slate-950">
                              <span className="truncate">{item.nome}</span>
                              {isSelf && <Badge variant="secondary">Voce</Badge>}
                            </div>
                            <div className="text-xs text-slate-500">ID {item.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        <Select
                          value={perfilAtual}
                          disabled={isUpdating || isSelf}
                          onValueChange={(value) =>
                            atualizarUsuario(item.id, { role: value as PerfilRole })
                          }
                        >
                          <SelectTrigger className="w-[140px] sm:w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PERFIS.map((perfil) => (
                              <SelectItem key={perfil.value} value={perfil.value}>
                                {perfil.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.id_subestacao_padrao ? String(item.id_subestacao_padrao) : "all"}
                          disabled={isUpdating}
                          onValueChange={(value) =>
                            atualizarUsuario(item.id, {
                              id_subestacao_padrao: value === "all" ? null : Number(value),
                            })
                          }
                        >
                          <SelectTrigger className="w-[170px] sm:w-[200px]">
                            <SelectValue placeholder="Todas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {subestacoes.map((subestacao) => (
                              <SelectItem
                                key={subestacao.id_subestacao}
                                value={String(subestacao.id_subestacao ?? "")}
                              >
                                {subestacao.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.ativo
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }
                          variant="outline"
                        >
                          {item.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatarData(item.criado_em)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={item.ativo ? "outline" : "default"}
                          className="w-full sm:w-auto"
                          disabled={isUpdating || isSelf}
                          onClick={() => atualizarUsuario(item.id, { ativo: !item.ativo })}
                        >
                          <ShieldCheck />
                          {item.ativo ? "Desativar" : "Ativar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

              {!loading && usuarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                    Nenhum usuario cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {PERFIS.map((perfil) => (
          <div key={perfil.value} className="rounded-lg border bg-white p-4">
            <div className="font-medium text-slate-950">{perfil.label}</div>
            <div className="mt-1 text-sm text-slate-600">{perfil.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
