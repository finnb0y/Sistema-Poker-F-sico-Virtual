# 🚀 Guia de Deploy - Fix de Sincronização de Códigos

## 📋 Resumo Executivo

Esta fix resolve o problema onde códigos de torneio criados em um dispositivo não são encontrados em outros dispositivos. A solução implementa uma função PostgreSQL com `SECURITY DEFINER` que permite busca cross-user de códigos de acesso.

## ⚠️ IMPORTANTE: Ação Necessária no Supabase

### Para que a fix funcione, você DEVE executar a migração SQL no Supabase

## 🔧 Passos de Deploy

### 1. Preparação

Antes de começar, certifique-se de ter:
- ✅ Acesso ao painel do Supabase (https://app.supabase.com)
- ✅ Projeto Supabase já configurado
- ✅ Credenciais de administrador do banco de dados

### 2. Executar a Migração SQL

#### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole APENAS o seguinte código SQL:

```sql
-- Function to find user by access code (player or dealer)
-- Uses SECURITY DEFINER to bypass RLS and search across all users
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

6. Clique em **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
7. Verifique se aparece a mensagem "Success. No rows returned"

#### Opção B: Via CLI do Supabase (Avançado)

Se você usa o Supabase CLI:

```bash
# 1. Crie um arquivo de migração
supabase migration new add_code_lookup_function

# 2. Cole o código SQL no arquivo criado
# O arquivo estará em: supabase/migrations/[timestamp]_add_code_lookup_function.sql

# 3. Execute a migração
supabase db push
```

### 3. Verificar a Instalação

Para confirmar que a função foi criada com sucesso:

1. No **SQL Editor** do Supabase, execute:

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'find_user_by_access_code';
```

2. Você deve ver um resultado como:
```
routine_name              | routine_type
--------------------------+-------------
find_user_by_access_code  | FUNCTION
```

### 4. Deploy da Aplicação

Depois de executar a migração SQL:

#### Via Vercel (se estiver usando):

```bash
# A aplicação já foi atualizada no repositório
# O deploy automático via Vercel irá pegar as mudanças
# Ou force um novo deploy:
vercel --prod
```

#### Via outro provedor:

```bash
# Build da aplicação
npm run build

# Deploy dos arquivos em dist/ para seu provedor
```

### 5. Testar a Fix

#### Teste Multi-Dispositivo:

1. **Dispositivo A (Admin)**:
   ```
   → Login com usuário existente
   → Criar novo torneio
   → Registrar jogadores
   → Anotar código de um jogador (ex: "AB12")
   ```

2. **Dispositivo B (Jogador)**:
   ```
   → Abrir aplicação (sem login)
   → Entrar código "AB12"
   → Verificar console do navegador (F12)
   ```

3. **Console Esperado** (Dispositivo B):
   ```
   🔍 Código não encontrado localmente, buscando no backend...
   ✅ Código encontrado para usuário: [user_id]
   ✅ Código encontrado! Carregando estado do torneio...
   ✅ Estado carregado para usuário: [user_id]
   ✅ Estado do torneio carregado com sucesso
   ✅ Conectado ao Supabase Realtime - sincronização multi-dispositivo ativa
   ```

4. **Resultado Esperado**:
   - ✅ Dispositivo B acessa o torneio com sucesso
   - ✅ Ambos dispositivos sincronizam em tempo real
   - ✅ Mudanças em um aparecem no outro

## ❌ Troubleshooting

### "Código não encontrado" após deploy

**Problema**: A função SQL não foi executada

**Solução**:
1. Verifique se executou o SQL no Supabase
2. Confirme que a função existe (veja seção 3)
3. Verifique os logs de erro no console do navegador

### "Error calling RPC function"

**Problema**: Permissões incorretas ou função não existe

**Solução**:
1. Re-execute o SQL da função
2. Verifique que usou `SECURITY DEFINER`
3. Confirme que o nome é exatamente `find_user_by_access_code`

### Erro 400 em poker_clubs

**Problema**: Tabela não existe ou RLS bloqueando

**Solução**:
1. Execute `supabase-clubs-migration.sql` se ainda não executou
2. Verifique políticas RLS no Supabase Dashboard
3. Confirme variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Console mostra fallback sendo usado

**Sintoma**: 
```
⚠️ Tentando busca direta como fallback...
```

**Causa**: RPC não funcionou, usando método direto

**Impacto**: 
- Pode funcionar se houver apenas um usuário
- Não funcionará para multi-usuário devido a RLS

**Solução**: 
- Executar a migração SQL corretamente
- Função deve retornar sem erros

## 📊 Monitoramento

### Métricas para Observar

1. **Console do Navegador**:
   - Mensagens de sucesso na busca de códigos
   - Tempo de resposta da busca
   - Erros de RPC

2. **Supabase Dashboard**:
   - Vá para **Logs** > **Postgres Logs**
   - Procure por execuções de `find_user_by_access_code`
   - Verifique performance

3. **Sinais de Sucesso**:
   - ✅ Códigos encontrados rapidamente
   - ✅ Sem mensagens de fallback
   - ✅ Sincronização funciona entre dispositivos

4. **Sinais de Problema**:
   - ❌ Códigos não encontrados
   - ❌ Fallback sendo usado frequentemente
   - ❌ Erros de RPC no console

## 🔐 Segurança

### Por que SECURITY DEFINER é seguro aqui?

A função usa `SECURITY DEFINER` que permite bypass de RLS, mas é segura porque:

1. **Acesso Limitado**: Retorna apenas o `user_id`, não dados sensíveis
2. **Read-Only**: Não modifica nada, apenas lê
3. **Propósito Específico**: Códigos são públicos por design
4. **Validado**: Código revisado e testado

### O que é exposto?

- ✅ Códigos de acesso (já são públicos)
- ✅ Mapeamento código → user_id (necessário)
- ❌ **NÃO** expõe senhas ou dados de jogo
- ❌ **NÃO** permite modificações

## 📚 Arquivos de Referência

1. **Migração SQL**: `supabase-auth-migration.sql` (linhas 152-190)
2. **Implementação Cliente**: `services/syncService.ts`
3. **Documentação Técnica**: `FIX_CODE_SYNC_ISSUE.md`
4. **Testes**: `utils/codeSyncRpcTest.ts`

## 🆘 Suporte

Se encontrar problemas:

1. Verifique o console do navegador (F12)
2. Consulte `FIX_CODE_SYNC_ISSUE.md` para troubleshooting detalhado
3. Verifique logs no Supabase Dashboard
4. Confirme que executou a migração SQL

## ✅ Checklist Final

Antes de considerar o deploy completo:

- [ ] Executei o SQL no Supabase
- [ ] Verifiquei que a função foi criada
- [ ] Deploy da aplicação foi feito
- [ ] Testei com 2 dispositivos diferentes
- [ ] Códigos são encontrados com sucesso
- [ ] Sincronização funciona em tempo real
- [ ] Sem erros no console do navegador
- [ ] Sem uso de fallback

## 🎉 Resultado Esperado

Após seguir todos os passos:

✅ **Problema Resolvido**: Códigos criados em um dispositivo são encontrados em outros
✅ **Sincronização Funcional**: Mudanças propagam em tempo real
✅ **Melhor UX**: Mensagens de erro mais claras e informativas
✅ **Diagnósticos**: Logs detalhados facilitam troubleshooting
✅ **Performance**: Busca server-side mais eficiente

---

**Data da Fix**: Janeiro 2026  
**Versão**: 1.0  
**Status**: Pronto para Produção ✅
