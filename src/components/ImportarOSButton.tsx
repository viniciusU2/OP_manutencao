import { useState } from "react";
import styled from "styled-components";
import api from "../api/api";

const Button = styled.button`
  background: #16a34a;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #15803d;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

export default function ImportarOSButton() {
  const [loading, setLoading] = useState(false);

  async function importar() {
    try {
      setLoading(true);

      const res = await api.post("/importacao/os");

      alert(
        `Importação concluída!\n\nImportadas: ${res.data.importadas}\nErros: ${res.data.erros.length}`
      );

      console.log(res.data);

    } catch (err) {
      console.error(err);
      alert("Erro ao importar OS");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={importar} disabled={loading}>
      {loading ? "Importando..." : "Importar OS"}
    </Button>
  );
}