-- Execute este script na VPS antes de subir o backend atualizado.
-- Objetivo:
-- 1. criar vinculos entre OS e plano de manutencao;
-- 2. permitir que a rotina nao gere OS duplicada;
-- 3. vincular execucoes antigas a OS pendentes ja existentes quando possivel.

ALTER TABLE ordem_servico
  ADD COLUMN IF NOT EXISTS id_plano_manutencao INT NULL,
  ADD COLUMN IF NOT EXISTS id_plano_item INT NULL,
  ADD COLUMN IF NOT EXISTS id_plano_execucao INT NULL,
  ADD COLUMN IF NOT EXISTS origem VARCHAR(50) NULL;

ALTER TABLE plano_execucao
  ADD COLUMN IF NOT EXISTS id_os INT NULL;

CREATE INDEX IF NOT EXISTS idx_os_plano_execucao
  ON ordem_servico (id_plano_execucao);

CREATE INDEX IF NOT EXISTS idx_os_origem_plano
  ON ordem_servico (origem, id_plano_manutencao, id_ativo);

CREATE INDEX IF NOT EXISTS idx_plano_execucao_os
  ON plano_execucao (id_os);

-- Regularizacao conservadora:
-- Para cada execucao do plano, vincula a OS pendente mais recente do mesmo ativo
-- cuja descricao seja igual a descricao geral do plano.
UPDATE plano_execucao pe
JOIN plano_item pi ON pi.id_plano_item = pe.id_plano_item
JOIN plano_manutencao pm ON pm.id_plano_manutencao = pi.id_plano_manutencao
JOIN ordem_servico os ON os.id_os = (
  SELECT MAX(os2.id_os)
  FROM ordem_servico os2
  WHERE os2.id_ativo = pe.id_ativo
    AND os2.descricao_servicos = pm.descricao_geral
    AND os2.status IN ('ABERTA', 'PROGRAMADA', 'EM_EXECUCAO')
)
SET
  pe.id_os = os.id_os,
  os.origem = COALESCE(os.origem, 'PLANO_MANUTENCAO'),
  os.id_plano_manutencao = COALESCE(os.id_plano_manutencao, pm.id_plano_manutencao),
  os.id_plano_item = COALESCE(os.id_plano_item, pi.id_plano_item),
  os.id_plano_execucao = COALESCE(os.id_plano_execucao, pe.id_execucao)
WHERE pe.id_os IS NULL;

-- Conferencia: mostra possiveis duplicadas pendentes ainda abertas/programadas/em execucao.
SELECT
  os.id_ativo,
  os.descricao_servicos,
  os.status,
  COUNT(*) AS total,
  GROUP_CONCAT(os.numero_os ORDER BY os.id_os DESC SEPARATOR ', ') AS ordens
FROM ordem_servico os
WHERE os.status IN ('ABERTA', 'PROGRAMADA', 'EM_EXECUCAO')
  AND os.descricao_servicos IS NOT NULL
GROUP BY os.id_ativo, os.descricao_servicos, os.status
HAVING COUNT(*) > 1
ORDER BY total DESC, os.id_ativo;
