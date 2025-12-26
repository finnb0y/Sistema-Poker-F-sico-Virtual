-- =====================================================
-- SQL para configuração do Supabase
-- Execute este script no SQL Editor do seu projeto Supabase
-- =====================================================

-- Tabela para armazenar o estado do jogo
CREATE TABLE IF NOT EXISTS poker_game_state (
  session_id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por session_id
CREATE INDEX IF NOT EXISTS idx_poker_game_state_session 
ON poker_game_state(session_id);

-- Tabela para armazenar as ações do jogo (para sincronização em tempo real)
CREATE TABLE IF NOT EXISTS poker_actions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  sender_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por session_id e timestamp
CREATE INDEX IF NOT EXISTS idx_poker_actions_session_time 
ON poker_actions(session_id, created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE poker_game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE poker_actions ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para todos os usuários autenticados e anônimos
CREATE POLICY "Permitir leitura para todos"
ON poker_game_state FOR SELECT
TO public
USING (true);

-- Política para permitir escrita para todos os usuários autenticados e anônimos
CREATE POLICY "Permitir escrita para todos"
ON poker_game_state FOR INSERT
TO public
WITH CHECK (true);

-- Política para permitir atualização para todos os usuários autenticados e anônimos
CREATE POLICY "Permitir atualização para todos"
ON poker_game_state FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Políticas para poker_actions
CREATE POLICY "Permitir leitura de ações para todos"
ON poker_actions FOR SELECT
TO public
USING (true);

CREATE POLICY "Permitir inserção de ações para todos"
ON poker_actions FOR INSERT
TO public
WITH CHECK (true);

-- Habilitar Realtime para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE poker_actions;

-- Opcional: Criar função para limpar ações antigas (manter apenas últimas 24 horas)
CREATE OR REPLACE FUNCTION cleanup_old_poker_actions()
RETURNS void AS $$
BEGIN
  DELETE FROM poker_actions
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Opcional: Agendar limpeza automática (requer extensão pg_cron)
-- SELECT cron.schedule('cleanup-poker-actions', '0 */6 * * *', 'SELECT cleanup_old_poker_actions();');

-- =====================================================
-- Verificação das tabelas criadas
-- =====================================================
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('poker_game_state', 'poker_actions')
ORDER BY table_name;
