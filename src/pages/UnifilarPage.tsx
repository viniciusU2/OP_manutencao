/**
 * UnifilarPage — entrada do módulo de diagrama unifilar por subestação.
 * Rota: /subestacoes/:id/unifilar
 * Modo: navegação para todos os autenticados; edição para admin/mantenedor.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import api from "../api/api";
import { Button } from "../components/ui/button";
import EditorUnifilar from "../components/unifilar/EditorUnifilar";

const ROLES_EDICAO = new Set(["admin", "mantenedor"]);

function textoErro(erro: unknown, padrao: string) {
  const detalhe = (erro as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detalhe === "string" && detalhe.trim()) return detalhe;
  if (Array.isArray(detalhe)) {
    const msgs = detalhe.map((i) => (typeof (i as { msg?: unknown })?.msg === "string" ? (i as { msg: string }).msg : "")).filter(Boolean);
    if (msgs.length) return msgs.join("; ");
  }
  return padrao;
}

export default function UnifilarPage() {
  const { id } = useParams();
  const idSubestacao = Number(id);
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState<string>("usuario");

  useEffect(() => {
    try {
      const cru = localStorage.getItem("user");
      if (cru) setPapel(JSON.parse(cru)?.role?.toLowerCase?.() ?? "usuario");
    } catch { /* papel default */ }
  }, []);

  useEffect(() => {
    api.get("/subestacao").then(({ data }) => {
      const alvo = (data as Array<{ id_subestacao: number; nome: string }>).find(
        (s) => Number(s.id_subestacao) === idSubestacao,
      );
      setNome(alvo?.nome ?? `Subestação #${idSubestacao}`);
    }).catch((err) => toast.error(textoErro(err, "Não foi possível carregar a subestação.")));
  }, [idSubestacao]);

  const podeEditar = useMemo(() => ROLES_EDICAO.has(papel), [papel]);

  if (!Number.isFinite(idSubestacao) || idSubestacao <= 0) {
    return <div className="p-8 text-sm text-slate-500">Subestação inválida.</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex items-center gap-3 border-b bg-white px-3 py-2 shadow-sm">
        <Link to="/subestacaoPage">
          <Button variant="ghost" size="sm" className="h-8 px-2" title="Voltar às subestações">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-slate-900">Unifilar — {nome || "carregando…"}</h1>
          <p className="text-[11px] text-slate-500">Diagrama unifilar interativo da subestação</p>
        </div>
      </header>
      <main className="min-h-0 flex-1">
        <EditorUnifilar idSubestacao={idSubestacao} nomeSubestacao={nome} podeEditar={podeEditar} />
      </main>
    </div>
  );
}
