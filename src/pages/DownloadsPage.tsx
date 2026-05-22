import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import api from "../api/api";
import Container from "../components/Container";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

type DownloadConfig = {
  title: string;
  description: string;
  endpoint: string;
  filename: string;
};

const downloads: DownloadConfig[] = [
  {
    title: "OS, SI e SS",
    description: "Baixa uma planilha com tres abas: ordens de servico, solicitacoes de intervencao e solicitacoes de servico.",
    endpoint: "/downloads/operacionais",
    filename: "os_si_ss.xlsx",
  },
  {
    title: "Ativos",
    description: "Baixa uma planilha com todos os ativos cadastrados.",
    endpoint: "/downloads/ativos",
    filename: "ativos.xlsx",
  },
];

export default function DownloadsPage() {
  async function baixarArquivo(config: DownloadConfig) {
    try {
      const response = await api.get(config.endpoint, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", config.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Download iniciado");
    } catch {
      toast.error("Erro ao baixar planilha");
    }
  }

  return (
    <Container>
      <div className="mb-6">
        <h2 className="m-0 text-2xl font-semibold text-slate-900">
          Downloads
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Baixe planilhas consolidadas para consulta e relatorios.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {downloads.map((item) => (
          <Card key={item.endpoint} className="rounded-lg">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                <FileSpreadsheet size={20} />
              </div>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => baixarArquivo(item)}>
                <Download size={16} />
                Baixar planilha
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
