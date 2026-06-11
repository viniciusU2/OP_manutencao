-- Rode primeiro este script se o backend parou de carregar /os
-- com erro de coluna desconhecida após a mudança dos planos.
--
-- Se alguma coluna já existir, o MySQL pode retornar "Duplicate column name".
-- Nesse caso, ignore essa linha e rode as demais.

ALTER TABLE ordem_servico ADD COLUMN id_plano_manutencao INT NULL;
ALTER TABLE ordem_servico ADD COLUMN id_plano_item INT NULL;
ALTER TABLE ordem_servico ADD COLUMN id_plano_execucao INT NULL;
ALTER TABLE ordem_servico ADD COLUMN origem VARCHAR(50) NULL;

ALTER TABLE plano_execucao ADD COLUMN id_os INT NULL;
