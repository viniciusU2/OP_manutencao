-- Migração aditiva: grupos de ativos para OS, SI e SS.
-- Execute primeiro em homologação. Não apaga nem altera o id_ativo histórico.
START TRANSACTION;

CREATE TABLE IF NOT EXISTS grupo_ativo (
  id_grupo_ativo INT NOT NULL AUTO_INCREMENT,
  id_subestacao INT NOT NULL,
  id_funcao_operacao INT NULL,
  id_tipo_ativo INT NOT NULL,
  codigo_ativo VARCHAR(50) NOT NULL,
  bay VARCHAR(50) NULL,
  descricao VARCHAR(300) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (id_grupo_ativo),
  INDEX idx_grupo_ativo_subestacao (id_subestacao),
  INDEX idx_grupo_ativo_fo (id_funcao_operacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE ativo ADD COLUMN IF NOT EXISTS id_grupo_ativo INT NULL;
ALTER TABLE ordem_servico ADD COLUMN IF NOT EXISTS id_grupo_ativo INT NULL, ADD COLUMN IF NOT EXISTS id_funcao_operacao INT NULL, ADD COLUMN IF NOT EXISTS escopo_ativo VARCHAR(10) NULL;
ALTER TABLE solicitacao_intervencao ADD COLUMN IF NOT EXISTS id_grupo_ativo INT NULL, ADD COLUMN IF NOT EXISTS id_funcao_operacao INT NULL, ADD COLUMN IF NOT EXISTS escopo_ativo VARCHAR(10) NULL;
ALTER TABLE solicitacao_servico ADD COLUMN IF NOT EXISTS id_grupo_ativo INT NULL, ADD COLUMN IF NOT EXISTS id_funcao_operacao INT NULL, ADD COLUMN IF NOT EXISTS escopo_ativo VARCHAR(10) NULL;

-- O backend cria os grupos e associa os ativos na primeira chamada dos endpoints de grupos.
COMMIT;
