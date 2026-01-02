BEGIN;

-- Limpar sessões de usuários
DO $$
BEGIN
  DELETE FROM poker_user_sessions;
END $$;

-- Limpar sessões de gerentes de clubes
DO $$
BEGIN
  DELETE FROM poker_club_manager_sessions;
END $$;

-- Limpar gerentes de clubes
DO $$
BEGIN
  DELETE FROM poker_club_managers;
END $$;

-- Limpar ações de jogos
DO $$
BEGIN
  DELETE FROM poker_actions;
END $$;

-- Limpar estados do jogo
DO $$
BEGIN
  DELETE FROM poker_game_state;
END $$;

-- Limpar clubes
DO $$
BEGIN
  DELETE FROM poker_clubs;
END $$;

-- Limpar contas de usuários
DO $$
BEGIN
  DELETE FROM poker_users;
END $$;

-- Reinício das sequências
DO $$
BEGIN
  PERFORM setval(pg_get_serial_sequence('poker_actions', 'id'), 1, false);
END $$;

-- Validação final de limpeza
DO $$
DECLARE
  user_count INTEGER;
  session_count INTEGER;
  state_count INTEGER;
  action_count INTEGER;
  club_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM poker_users;
  SELECT COUNT(*) INTO session_count FROM poker_user_sessions;
  SELECT COUNT(*) INTO state_count FROM poker_game_state;
  SELECT COUNT(*) INTO action_count FROM poker_actions;
  SELECT COUNT(*) INTO club_count FROM poker_clubs;

  -- Mensagem de validação
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'RESET COMPLETE - System is now clean';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Users: % (should be 0)', user_count;
  RAISE NOTICE 'Sessions: % (should be 0)', session_count;
  RAISE NOTICE 'Game States: % (should be 0)', state_count;
  RAISE NOTICE 'Actions: % (should be 0)', action_count;
  RAISE NOTICE 'Clubs: % (should be 0)', club_count;
  RAISE NOTICE '===========================================';
END $$;

COMMIT;
