-- Rollback estrutural. Execute somente após validar que nenhum documento novo usa grupo_ativo.
START TRANSACTION;
ALTER TABLE ordem_servico DROP COLUMN id_grupo_ativo, DROP COLUMN id_funcao_operacao, DROP COLUMN escopo_ativo;
ALTER TABLE solicitacao_intervencao DROP COLUMN id_grupo_ativo, DROP COLUMN id_funcao_operacao, DROP COLUMN escopo_ativo;
ALTER TABLE solicitacao_servico DROP COLUMN id_grupo_ativo, DROP COLUMN id_funcao_operacao, DROP COLUMN escopo_ativo;
ALTER TABLE ativo DROP COLUMN id_grupo_ativo;
DROP TABLE grupo_ativo;
COMMIT;
