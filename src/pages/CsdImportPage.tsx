import { useState } from "react";
import { ArrowLeft, FileUp, RefreshCw, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { canManage } from "../lib/permissions";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

function errorMessage(error: unknown) {
  return (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Não foi possível concluir a importação.";
}

export default function CsdImportPage() {
  const { usuario } = useAuth();
  const [paramFile, setParamFile] = useState<File | null>(null);
  const [measuresFile, setMeasuresFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function importFiles() {
    if (!paramFile || !measuresFile) return;
    const formData = new FormData();
    formData.append("param_file", paramFile);
    formData.append("measures_file", measuresFile);
    setUploading(true);
    try {
      const { data } = await api.post("/csd-monitor/importar", formData);
      toast.success(data.message || "Importação concluída.");
      setParamFile(null);
      setMeasuresFile(null);
      document.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => { input.value = ""; });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  if (!canManage(usuario?.role)) {
    return <div className="mx-auto max-w-3xl"><Card><CardHeader><CardTitle>Acesso restrito</CardTitle><CardDescription>A importação está disponível somente para administradores e mantenedores.</CardDescription></CardHeader></Card></div>;
  }

  return <div className="mx-auto grid max-w-4xl gap-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="m-0 text-2xl font-semibold text-slate-900">Importar operação CSD</h1><p className="mt-1 text-sm text-slate-500">Envie o par de arquivos XML do mesmo evento do disjuntor.</p></div>
      <Button variant="outline" asChild><Link to="/csd-monitor/controle"><ArrowLeft size={16} />Controle de importações</Link></Button>
    </div>
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UploadCloud size={18} className="text-blue-600" />Arquivos da operação</CardTitle><CardDescription>A importação é transacional e idempotente. Se o mesmo measures.xml já foi processado, ele não será duplicado.</CardDescription></CardHeader>
      <CardContent className="grid gap-5">
        <label className="grid gap-2 text-sm font-medium text-slate-700">param.xml<input className="rounded-md border bg-white px-3 py-2 text-sm font-normal" type="file" accept=".xml,text/xml" onChange={(event) => setParamFile(event.target.files?.[0] || null)} /></label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">measures.xml<input className="rounded-md border bg-white px-3 py-2 text-sm font-normal" type="file" accept=".xml,text/xml" onChange={(event) => setMeasuresFile(event.target.files?.[0] || null)} /></label>
        <div className="flex flex-wrap items-center gap-3"><Button onClick={() => void importFiles()} disabled={!paramFile || !measuresFile || uploading}><FileUp size={16} />{uploading ? "Importando…" : "Importar para o banco"}</Button>{uploading && <span className="flex items-center gap-2 text-sm text-slate-500"><RefreshCw size={15} className="animate-spin" />Processando arquivos…</span>}</div>
      </CardContent>
    </Card>
  </div>;
}
