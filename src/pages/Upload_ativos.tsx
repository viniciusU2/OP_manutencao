import { useState } from "react";
import { AxiosError } from "axios";
import api from "../api/api";
import { toast } from "sonner"; // já que você usa sonner

export function ImportarAtivos() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [tipoImportacao, setTipoImportacao] = useState<"ativos" | "torres">("ativos");

  async function handleUpload() {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const endpoint =
        tipoImportacao === "torres"
          ? "/ativos/importar-torres-xlsx"
          : "/ativos/importar-xlsx";

      const response = await api.post(
        endpoint,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const mensagem =
        response.data.msg ??
        `${response.data.mensagem}. Criadas: ${response.data.criadas}, atualizadas: ${response.data.atualizadas}, ignoradas: ${response.data.ignoradas}`;

      setMsg(mensagem);
      toast.success(mensagem);

    } catch (err) {
      const erro =
        err instanceof AxiosError
          ? err.response?.data?.detail ?? "Erro ao importar"
          : "Erro ao importar";
      setMsg(erro);
      toast.error(erro);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Importar Ativos</h2>

      <label>
        Tipo de importacao
        <select
          value={tipoImportacao}
          onChange={(e) => setTipoImportacao(e.target.value as "ativos" | "torres")}
          style={{ display: "block", marginTop: 8, marginBottom: 16 }}
        >
          <option value="ativos">Ativos comuns</option>
          <option value="torres">Torres / Linha de transmissao</option>
        </select>
      </label>

      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <br /><br />

      <button onClick={handleUpload}>
        Enviar
      </button>

      <p>{msg}</p>
    </div>
  );
}
