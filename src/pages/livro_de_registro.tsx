import { useEffect, useState } from "react"
import api from "../api/api"
import Container from "../components/Container"

import { Card, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Textarea } from "../components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"

import { toast } from "sonner"

type Registro = {
  id: number
  tipo: string
  descricao: string

  id_os?: number
  id_subestacao?: number

  data_registro_inicio: string
  data_registro_fim?: string

  foto?: string
  usuario: string
}

export function LivroRegistro() {
  const [registros, setRegistros] = useState<Registro[]>([])

  const [tipo, setTipo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [id_os, setIdOs] = useState("")
  const [id_subestacao, setIdSubestacao] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [foto, setFoto] = useState("")
  const [usuario, setUsuario] = useState("admin")

  const [filtroData, setFiltroData] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("all")

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    let url = "/livro"
    const params: string[] = []

    if (filtroData) params.push(`data=${filtroData}`)
    if (filtroTipo && filtroTipo !== "all") {
      params.push(`tipo=${filtroTipo}`)
    }

    if (params.length > 0) {
      url += "?" + params.join("&")
    }

    const response = await api.get(url)
    setRegistros(response.data)
  }

  async function salvar(e: any) {
    e.preventDefault()

    const promise = api.post("/livro", {
      tipo,
      descricao,
      id_os: id_os ? Number(id_os) : null,
      id_subestacao: id_subestacao ? Number(id_subestacao) : null,
      data_registro_fim: dataFim || null,
      foto: foto || null,
      usuario,
    })

    toast.promise(promise, {
      loading: "Salvando registro...",
      success: "Registro criado com sucesso!",
      error: "Erro ao salvar registro",
    })

    try {
      await promise

      // reset
      setTipo("")
      setDescricao("")
      setIdOs("")
      setIdSubestacao("")
      setDataFim("")
      setFoto("")

      carregar()
    } catch (error) {
      console.error(error)
    }
  }

  async function iniciarOS(id: number) {
    const promise = api.post(`/livro/iniciar-os/${id}?usuario=${usuario}`)

    toast.promise(promise, {
      loading: "Iniciando OS...",
      success: "OS iniciada!",
      error: "Erro ao iniciar OS",
    })

    await promise
    carregar()
  }

  async function finalizarOS(id: number) {
    const promise = api.post(`/livro/finalizar-os/${id}?usuario=${usuario}`)

    toast.promise(promise, {
      loading: "Finalizando OS...",
      success: "OS finalizada!",
      error: "Erro ao finalizar OS",
    })

    await promise
    carregar()
  }

  return (
    <Container>
      <h1 className="text-2xl font-bold mb-4">Nota Informativa</h1>

      {/* FORM */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          <form onSubmit={salvar} className="space-y-3">

            <Select onValueChange={setTipo} value={tipo || undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de registro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inicio_os">Início de OS</SelectItem>
                <SelectItem value="termino_os">Término de OS</SelectItem>
                <SelectItem value="atividade">Atividade</SelectItem>
                <SelectItem value="observacao">Observação</SelectItem>
                <SelectItem value="foto">Foto</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="ID da OS"
              value={id_os}
              onChange={(e) => setIdOs(e.target.value)}
            />

            <Input
              placeholder="ID da Subestação"
              value={id_subestacao}
              onChange={(e) => setIdSubestacao(e.target.value)}
            />

            <Textarea
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />

            <Input
              type="datetime-local"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />

            <Input
              placeholder="URL da foto"
              value={foto}
              onChange={(e) => setFoto(e.target.value)}
            />

            <Input
              placeholder="Usuário"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />

            <Button type="submit">Registrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* FILTROS */}
      <Card className="mb-6">
        <CardContent className="p-4 flex gap-3 flex-wrap">
          <Input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
          />

          <Select onValueChange={setFiltroTipo} value={filtroTipo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="inicio_os">Início OS</SelectItem>
              <SelectItem value="termino_os">Término OS</SelectItem>
              <SelectItem value="atividade">Atividade</SelectItem>
              <SelectItem value="observacao">Observação</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={carregar}>Filtrar</Button>
        </CardContent>
      </Card>

      {/* LISTA */}
      <div className="space-y-4">
        {registros.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 space-y-2">

              <div className="flex justify-between">
                <strong>{r.tipo}</strong>
                <span className="text-sm text-muted-foreground">
                  {new Date(r.data_registro_inicio).toLocaleString()}
                </span>
              </div>

              <p>{r.descricao}</p>

              {r.id_os && <div>OS: {r.id_os}</div>}
              {r.id_subestacao && <div>Subestação: {r.id_subestacao}</div>}

              {r.data_registro_fim && (
                <div className="text-sm text-muted-foreground">
                  Finalizado em:{" "}
                  {new Date(r.data_registro_fim).toLocaleString()}
                </div>
              )}

              {r.foto && (
                <img
                  src={r.foto}
                  className="rounded-md mt-2 max-h-60 object-cover"
                />
              )}

              <div className="text-xs text-muted-foreground">
                Usuário: {r.usuario}
              </div>

              {r.id_os && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => iniciarOS(r.id_os!)}>
                    Iniciar
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => finalizarOS(r.id_os!)}
                  >
                    Finalizar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  )
}