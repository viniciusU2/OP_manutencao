import { useEffect, useState } from "react";
import api from "../api/api";

import { Plus, Search, Pencil, Trash2, Building2, MapPin } from "lucide-react";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";

import {StatusBadge} from "../components/statusBadge"
import { OnlyAdmin } from "../components/onlyAdmin";
//import SubstationFormDialog from "../components/SubstationFormDialog";

interface Subestacao {
  id_subestacao: number;
  nome: string;
  codigo: string;
  tensao?: string;
  localizacao?: string;
  status: string;
}

export  function SubestacoesPage() {

  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subestacao | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubestacoes();
  }, []);

  async function fetchSubestacoes() {
    const res = await api.get("/subestacao");
    setSubestacoes(res.data);
  }

  async function deleteSubestacao(id: number) {

    await api.delete(`/subestacao/${id}`);

    setSubestacoes((prev) =>
      prev.filter((s) => s.id_subestacao !== id)
    );

    setDeleteId(null);
  }

  const filtered = subestacoes.filter((s) =>

    !search ||
    s.nome?.toLowerCase().includes(search.toLowerCase()) ||
    s.codigo?.toLowerCase().includes(search.toLowerCase())

  );

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-semibold">
            Subestações
          </h1>

          <p className="text-sm text-gray-500">
            {subestacoes.length} subestações cadastradas
          </p>
        </div>
        <OnlyAdmin>
<Button
          onClick={() => navigate("/subestacao")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Subestação
        </Button>

        </OnlyAdmin>

        

      </div>

      {/* BUSCA */}

      <Card className="p-4">

        <div className="relative">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <Input
            placeholder="Buscar por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />

        </div>

      </Card>

      {/* LISTA */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {filtered.map((sub) => (

          <Card
            key={sub.id_subestacao}
            className="p-5 hover:shadow-md transition"
          >

            <div className="flex items-start justify-between">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">

                  <Building2 className="w-5 h-5 text-blue-600" />

                </div>

                <div>

                  <h3 className="text-sm font-semibold">
                    {sub.nome}
                  </h3>

                  <p className="text-xs text-gray-400 font-mono">
                    {sub.codigo}
                  </p>

                </div>

              </div>

              <StatusBadge status={sub.status} />

            </div>

            <div className="mt-4 space-y-2">

              {sub.tensao && (
                <p className="text-xs text-gray-500">
                  Tensão:
                  <span className="font-medium text-gray-700 ml-1">
                    {sub.tensao}
                  </span>
                </p>
              )}

              {sub.localizacao && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {sub.localizacao}
                </p>
              )}

            </div>

            {/* AÇÕES */}
           


            <div className="mt-4 pt-3 border-t flex justify-end gap-1">
               <OnlyAdmin>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(sub);
                  setFormOpen(true);
                }}
              >

                <Pencil className="w-4 h-4 mr-1" />
                Editar
 
              </Button>

              
            </OnlyAdmin>
           
   <OnlyAdmin>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500"
                onClick={() => setDeleteId(sub.id_subestacao)}
              >

                <Trash2 className="w-4 h-4 mr-1" />
                Excluir

              </Button>
</OnlyAdmin>
            </div>

          </Card>

        ))}

      </div>

      {/* MODAL FORM */}

      {/*<SubstationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        substation={editing}
        onSave={fetchSubestacoes}
      />*/}

      {/* MODAL DELETE */}

      {deleteId && (

        <div className="fixed inset-0 flex items-center justify-center bg-black/30">

          <Card className="p-6 w-[350px]">

            <h3 className="font-semibold mb-2">
              Excluir subestação?
            </h3>

            <p className="text-sm text-gray-500 mb-4">
              Esta ação não pode ser desfeita.
            </p>

            <div className="flex justify-end gap-2">

              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
              >
                Cancelar
              </Button>

              <Button
                variant="destructive"
                onClick={() => deleteSubestacao(deleteId)}
              >
                Excluir
              </Button>

            </div>

          </Card>

        </div>

      )}

    </div>

  );
}