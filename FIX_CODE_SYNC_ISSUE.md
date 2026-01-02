# Fix: Sincronização de Códigos entre Dispositivos

## 🐛 Problema Identificado

### Sintomas
1. Códigos de torneio criados em um dispositivo não são encontrados em outros dispositivos
2. Console exibe "⚠️ Código não encontrado em nenhum estado de jogo"
3. Alert aparece: "Código não encontrado. Verifique o código e tente novamente"
4. Erro 400 ao buscar clubes na rota REST `poker_clubs`

### Causa Raiz

O problema estava relacionado às políticas de Row Level Security (RLS) do Supabase:

1. **Política RLS muito restritiva**: A função `findUserByAccessCode` no `syncService.ts` tentava ler TODOS os estados de jogo de TODOS os usuários para encontrar um código específico
2. **Bloqueio pela política**: A política "Users can read own game state" (linha 110 de `supabase-auth-migration.sql`) bloqueava o acesso cross-user
3. **Consulta sem autenticação**: A busca era feita sem contexto de autenticação apropriado para bypass de RLS

## ✅ Solução Implementada

### 1. Função de Banco de Dados com SECURITY DEFINER

Criada uma função PostgreSQL que usa `SECURITY DEFINER` para bypass seguro de RLS:

```sql
CREATE OR REPLACE FUNCTION find_user_by_access_code(access_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  game_record RECORD;
  player_record JSONB;
  table_record JSONB;
BEGIN
  -- Search through all game states to find matching access code
  FOR game_record IN 
    SELECT user_id, state FROM poker_game_state
  LOOP
    -- Check player access codes
    IF game_record.state ? 'players' THEN
      FOR player_record IN SELECT * FROM jsonb_array_elements(game_record.state->'players')
      LOOP
        IF player_record->>'accessCode' = access_code THEN
          RETURN game_record.user_id;
        END IF;
      END LOOP;
    END IF;
    
    -- Check dealer access codes
    IF game_record.state ? 'tableStates' THEN
      FOR table_record IN SELECT * FROM jsonb_array_elements(game_record.state->'tableStates')
      LOOP
        IF table_record->>'dealerAccessCode' = access_code THEN
          RETURN game_record.user_id;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  
  -- Code not found
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Benefícios:**
- ✅ Executa com privilégios elevados (SECURITY DEFINER)
- ✅ Bypass seguro de RLS para busca de códigos
- ✅ Processa JSONB eficientemente no servidor
- ✅ Retorna apenas o user_id, mantendo privacidade

### 2. Atualização do syncService

Modificado `services/syncService.ts` para usar RPC:

```typescript
findUserByAccessCode: async (accessCode: string): Promise<string | null> => {
  // Use database function to search across all users
  const { data, error } = await supabase
    .rpc('find_user_by_access_code', { access_code: accessCode });
  
  if (error) {
    console.error('❌ Erro ao buscar código de acesso via RPC:', error);
    // Fallback to direct query if RPC fails
    return await syncService.findUserByAccessCodeFallback(accessCode);
  }

  if (data) {
    console.log('✅ Código encontrado para usuário:', data);
    return data;
  }

  return null;
}
```

**Benefícios:**
- ✅ Usa RPC para chamar função do banco
- ✅ Fallback para método direto caso RPC falhe
- ✅ Logs detalhados para diagnóstico

### 3. Melhor Tratamento de Erros

Adicionado logging detalhado em:
- `clubService.ts`: diagnóstico de erros ao buscar clubes
- `App.tsx`: mensagens de erro mais informativas para usuários
- `syncService.ts`: logs de debug para troubleshooting

## 📋 Instruções de Deploy

### Para Projetos Existentes

Se você já tem um projeto Supabase em produção:

1. **Execute a migração SQL atualizada**:
   ```bash
   # No SQL Editor do Supabase, execute:
   ```
   ```sql
   -- Cole o conteúdo atualizado de supabase-auth-migration.sql
   -- A função find_user_by_access_code será criada
   ```

2. **Deploy do código frontend**:
   ```bash
   npm run build
   # Deploy para Vercel ou sua plataforma
   ```

### Para Novos Projetos

1. Execute os scripts SQL na ordem:
   - `supabase-setup.sql`
   - `supabase-auth-migration.sql` (agora inclui a função)
   - `supabase-clubs-migration.sql`

2. Configure as variáveis de ambiente
3. Deploy da aplicação

## 🧪 Como Testar

### Teste Multi-Dispositivo

1. **Dispositivo A (Admin)**:
   - Login com usuário
   - Crie um torneio
   - Registre jogadores (códigos são gerados)
   - Anote um código de jogador (ex: "XY9Z")

2. **Dispositivo B (Jogador)**:
   - Abra a aplicação (sem login)
   - Entre com o código "XY9Z"
   - Verifique o console:
     ```
     🔍 Código não encontrado localmente, buscando no backend...
     ✅ Código encontrado! Carregando estado do torneio...
     ✅ Estado do torneio carregado com sucesso
     ```
   - Deve acessar o torneio com sucesso

### Verificação no Console

Console esperado em caso de sucesso:
```
🔍 Código não encontrado localmente, buscando no backend...
✅ Código encontrado para usuário: abc123-...
✅ Código encontrado! Carregando estado do torneio...
✅ Estado carregado para usuário: abc123-...
✅ Estado do torneio carregado com sucesso
✅ Conectado ao Supabase Realtime - sincronização multi-dispositivo ativa
```

## 🔍 Troubleshooting

### "Erro ao buscar código via RPC"

**Problema**: Função não existe no banco de dados

**Solução**:
1. Verifique se executou o script SQL atualizado
2. No Supabase, vá em Database > Functions
3. Confirme que `find_user_by_access_code` existe

### "Código não encontrado" mas código está correto

**Causas possíveis**:
1. Admin não salvou o estado no backend (persistState não foi chamada)
2. Problema de conexão com Supabase
3. Admin criou torneio em modo offline

**Solução**:
1. Admin deve garantir que está online
2. Admin deve fazer uma ação (ex: mover jogador) para forçar persistência
3. Verificar conectividade com Supabase

### Erro 400 em poker_clubs

**Causas possíveis**:
1. Tabela não existe (não executou supabase-clubs-migration.sql)
2. Problema com RLS
3. Credenciais Supabase inválidas

**Solução**:
1. Execute supabase-clubs-migration.sql
2. Verifique as políticas RLS no Supabase Dashboard
3. Confira VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

## 📚 Referências

- `supabase-auth-migration.sql`: Migração com a função
- `services/syncService.ts`: Implementação do cliente
- `MULTI_DEVICE_CODE_SYNC.md`: Documentação da arquitetura multi-dispositivo
- `TESTE_MANUAL_MULTI_DEVICE.md`: Guia de testes manuais

## 🔐 Considerações de Segurança

A função `find_user_by_access_code` usa `SECURITY DEFINER` para bypass de RLS, mas é segura porque:

1. ✅ **Acesso Limitado**: Apenas retorna o `user_id`, não expõe dados sensíveis
2. ✅ **Read-Only**: Não modifica dados, apenas lê
3. ✅ **Propósito Específico**: Usado apenas para lookup de códigos públicos (access codes)
4. ✅ **Códigos São Públicos**: Access codes são compartilhados intencionalmente

**Nota**: Os access codes são projetados para serem compartilhados entre dispositivos, então não há risco de segurança ao permitir busca cross-user.
