import { useState } from "react";
import api from "../api/api";
import { toast } from "sonner"; // já que você usa sonner

export function ImportarAtivos() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  async function handleUpload() {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(
        "/ativos/importar-xlsx",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMsg(response.data.msg);
      toast.success(response.data.msg);

    } catch (err) {
      const erro = err.response?.data?.detail || "Erro ao importar";
      setMsg(erro);
      toast.error(erro);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Importar Ativos</h2>

      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={handleUpload}>
        Enviar
      </button>

      <p>{msg}</p>
    </div>
  );
}