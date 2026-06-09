type UsuarioComInstalacao = {
  id_subestacao_padrao?: number | null;
};

type Instalacao = {
  id_subestacao?: number | null;
};

export function filtroInicialInstalacao(
  usuario: UsuarioComInstalacao | null | undefined,
  instalacoes: Instalacao[]
) {
  const idPreferido = usuario?.id_subestacao_padrao;

  if (!idPreferido) return "all";

  const existe = instalacoes.some(
    (instalacao) => Number(instalacao.id_subestacao) === Number(idPreferido)
  );

  return existe ? String(idPreferido) : "all";
}
