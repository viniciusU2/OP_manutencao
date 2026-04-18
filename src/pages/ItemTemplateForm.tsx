import { useState, useEffect } from "react";
import styled from "styled-components";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../components/ui/select";

import type {
  ItemInspecaoTemplateCreate,
  PeriodicidadeEnum,
} from "../types/Inspecao";
import type { TipoAtivo } from "../types/TipoAtivo";

import { toast } from "sonner";
import api from "../api/api";
import { Card } from "../components/ui/card";

// ================= STYLES =================
const Container = styled.div`
  padding: 24px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const FullWidth = styled.div`
  grid-column: span 2;
`;

const Actions = styled.div`
  grid-column: span 2;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

// ================= COMPONENT =================
export default function ItemTemplateForm() {
  const [tiposAtivo, setTiposAtivo] = useState<TipoAtivo[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);

  const [form, setForm] = useState<ItemInspecaoTemplateCreate>({
    id_tipo_ativo: 0,
    nome_item: "",
    descricao: "",
    periodicidade: "MENSAL",
    unidade: "",
    valor_referencia: undefined,
    tolerancia: undefined,
    ativo: true,
  });

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ================= FETCH TIPOS ATIVO =================
  useEffect(() => {
    const fetchTipos = async () => {
      setLoadingTipos(true);
      try {
        const { data } = await api.get("/tipo-ativo");
        setTiposAtivo(data);
      } catch {
        toast.error("Erro ao carregar tipos de ativo");
      } finally {
        setLoadingTipos(false);
      }
    };

    fetchTipos();
  }, []);

  // ================= DEFAULT AUTOMÁTICO =================
  useEffect(() => {
    if (tiposAtivo.length > 0 && form.id_tipo_ativo === 0) {
      setForm((prev) => ({
        ...prev,
        id_tipo_ativo: tiposAtivo[0].id_tipo_ativo,
      }));
    }
  }, [tiposAtivo]);

  // ================= SUBMIT =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.id_tipo_ativo) {
      toast.error("Selecione um tipo de ativo");
      return;
    }

    try {
      await api.post("/inspecoes/item-templates", form);
      toast.success("Item criado com sucesso!");

      // reset
      setForm({
        id_tipo_ativo: tiposAtivo[0]?.id_tipo_ativo || 0,
        nome_item: "",
        descricao: "",
        periodicidade: "MENSAL",
        unidade: "",
        valor_referencia: undefined,
        tolerancia: undefined,
        ativo: true,
      });
    } catch {
      toast.error("Erro ao criar item");
    }
  };

  return (
    <Container>
      <Card className="p-8">
        <Title>Cadastrar Item de Inspeção</Title>

        <Form onSubmit={handleSubmit}>
          {/* Tipo Ativo (SELECT DINÂMICO) */}
          <Select
            value={form.id_tipo_ativo ? String(form.id_tipo_ativo) : ""}
            onValueChange={(value) =>
              handleChange("id_tipo_ativo", Number(value))
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loadingTipos
                    ? "Carregando..."
                    : "Selecione o tipo de ativo"
                }
              />
            </SelectTrigger>

            <SelectContent>
              {tiposAtivo.map((tipo) => (
                <SelectItem
                  key={tipo.id_tipo_ativo}
                  value={String(tipo.id_tipo_ativo)}
                >
                  {tipo.id_tipo_ativo} - {tipo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Nome */}
          <Input
            placeholder="Nome do Item"
            value={form.nome_item}
            onChange={(e) => handleChange("nome_item", e.target.value)}
          />

          {/* Periodicidade */}
          <Select
            value={form.periodicidade}
            onValueChange={(value: PeriodicidadeEnum) =>
              handleChange("periodicidade", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Periodicidade" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="SEMANAL">Semanal</SelectItem>
              <SelectItem value="MENSAL">Mensal</SelectItem>
              <SelectItem value="BIMESTRAL">Bimestral</SelectItem>
              <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
              <SelectItem value="SEMESTRAL">Semestral</SelectItem>
              <SelectItem value="3_ANOS">3 anos</SelectItem>
              <SelectItem value="5_ANOS">5 anos</SelectItem>
              <SelectItem value="6_ANOS">6 anos</SelectItem>
            </SelectContent>
          </Select>

          {/* Unidade */}
          <Input
            placeholder="Unidade (ex: V, A, °C)"
            value={form.unidade}
            onChange={(e) => handleChange("unidade", e.target.value)}
          />

          {/* Valor referência */}
          <Input
            placeholder="Valor referência"
            type="number"
            value={form.valor_referencia ?? ""}
            onChange={(e) =>
              handleChange("valor_referencia", Number(e.target.value))
            }
          />

          {/* Tolerância */}
          <Input
            placeholder="Tolerância"
            type="number"
            value={form.tolerancia ?? ""}
            onChange={(e) =>
              handleChange("tolerancia", Number(e.target.value))
            }
          />

          {/* Descrição */}
          <FullWidth>
            <Textarea
              placeholder="Descrição"
              value={form.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
            />
          </FullWidth>

          {/* Actions */}
          <Actions>
            <Button type="submit">Salvar</Button>
          </Actions>
        </Form>
      </Card>
    </Container>
  );
}