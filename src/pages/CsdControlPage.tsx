import { useCallback, useEffect, useState } from "react";
import { FilePlus2, RefreshCw, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { canManage } from "../lib/permissions";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

type Importacao = { id_importacao: number; nome_arquivo?: string | null; data_inicio?: string | null; data_fim?: string | null; status?: string | null; linhas_xml?: number | null; medicoes_inseridas?: number | null; alarmes_inseridos?: number | null; contadores_inseridos?: number | null; mensagem_erro?: string | null };
const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
const count = (value?: number | null) => Number(value || 0).toLocaleString("pt-BR");
const statusVariant = (status?: string | null): "default" | "secondary" | "destructive" => status === "SUCESSO" ? "default" : status === "ERRO" ? "destructive" : "secondary";

function errorMessage(error: unknown) {
  return (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Não foi possível concluir a operação.";
}

export default function CsdControlPage() {
  const { usuario } = useAuth();
  const [imports, setImports] = useState<Importacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Importacao | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get<Importacao[]>("/csd-monitor/importacoes?limite=100"); setImports(data); }
    catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);

  async function deleteImport() {
    if (!selected) return;
    setDeleting(true);
    try { await api.delete(`/csd-monitor/importacoes/${selected.id_importacao}`); toast.success("Importação excluída com sucesso."); setSelected(null); await loadData(); }
    catch (error) { toast.error(errorMessage(error)); }
    finally { setDeleting(false); }
  }

  return <div className="mx-auto grid max-w-[1500px] gap-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="m-0 text-2xl font-semibold text-slate-900">Controle de importações CSD</h1><p className="mt-1 text-sm text-slate-500">Controle dos arquivos enviados e processados no banco de dados.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void loadData()} disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Atualizar</Button>{canManage(usuario?.role) && <Button asChild><Link to="/csd-monitor/importar"><FilePlus2 size={16} />Nova importação</Link></Button>}</div></div>
    <Card><CardHeader><CardTitle>Arquivos enviados</CardTitle><CardDescription>Cada registro representa um par formado por param.xml e measures.xml.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Arquivos</TableHead><TableHead>Status</TableHead><TableHead>Início</TableHead><TableHead>Fim</TableHead><TableHead>Linhas</TableHead><TableHead>Medições</TableHead><TableHead>Alarmes</TableHead><TableHead>Contadores</TableHead><TableHead className="w-24 text-right">Ação</TableHead></TableRow></TableHeader><TableBody>{imports.length ? imports.map((item) => <TableRow key={item.id_importacao}><TableCell><div className="font-medium text-slate-800">param.xml</div><div className="text-xs text-slate-500">{item.nome_arquivo || "measures.xml"}</div></TableCell><TableCell><Badge variant={statusVariant(item.status)}>{item.status || "PROCESSANDO"}</Badge>{item.status === "ERRO" && item.mensagem_erro && <p className="mt-1 max-w-xs truncate text-xs text-red-600" title={item.mensagem_erro}>{item.mensagem_erro}</p>}</TableCell><TableCell className="text-xs">{dateTime(item.data_inicio)}</TableCell><TableCell className="text-xs">{dateTime(item.data_fim)}</TableCell><TableCell>{count(item.linhas_xml)}</TableCell><TableCell>{count(item.medicoes_inseridas)}</TableCell><TableCell>{count(item.alarmes_inseridos)}</TableCell><TableCell>{count(item.contadores_inseridos)}</TableCell><TableCell className="text-right">{canManage(usuario?.role) && <Button variant="destructive" size="icon-sm" aria-label={`Excluir importação ${item.id_importacao}`} onClick={() => setSelected(item)}><Trash2 size={16} /></Button>}</TableCell></TableRow>) : <TableRow><TableCell colSpan={9} className="h-24 text-center text-slate-500">Nenhum arquivo enviado.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open && !deleting) setSelected(null); }}><DialogContent><DialogHeader><DialogTitle>Excluir importação?</DialogTitle><DialogDescription>Essa ação remove a auditoria e os dados do evento associados ao arquivo <strong>{selected?.nome_arquivo || "measures.xml"}</strong>. Ela não pode ser desfeita.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setSelected(null)} disabled={deleting}>Cancelar</Button><Button variant="destructive" onClick={() => void deleteImport()} disabled={deleting}>{deleting ? "Excluindo…" : "Excluir importação"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
