# 🧪 Guia de Testes - Sistema Multi-Usuário

Este guia mostra como testar o sistema de poker com múltiplos usuários em dispositivos diferentes.

## 📋 Pré-requisitos

- Sistema configurado conforme [SETUP_MULTI_USUARIO.md](SETUP_MULTI_USUARIO.md)
- Supabase configurado (para testes cross-device)
- Pelo menos 2 dispositivos ou navegadores disponíveis

## 🔧 Cenários de Teste

### Teste 1: Múltiplas Abas (Mesmo Dispositivo)

**Objetivo**: Verificar sincronização local via BroadcastChannel

**Passos**:
1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Abra **3 abas** do navegador em `http://localhost:3000`

3. **Aba 1** - Entre como **DIRETOR**:
   - Clique em "DIRETOR"
   - Crie um torneio
   - Registre alguns jogadores

4. **Aba 2** - Entre como **DEALER**:
   - Clique em "DEALER"
   - Selecione uma mesa
   - Observe os jogadores da mesa

5. **Aba 3** - Entre como **JOGADOR**:
   - Digite o código de acesso de um jogador
   - Clique em "SENTAR NA MESA"

**✅ Resultado Esperado**:
- Todas as abas mostram as mesmas informações
- Mudanças em uma aba aparecem instantaneamente nas outras
- Console mostra: "Estado salvo no localStorage"

---

### Teste 2: Múltiplos Dispositivos (Produção)

**Objetivo**: Verificar sincronização via Supabase entre dispositivos diferentes

**Pré-requisitos**:
- Supabase configurado
- App deployado na Vercel ou rodando em servidor acessível

**Passos**:

1. **Dispositivo 1** (Desktop) - DIRETOR:
   ```
   https://seu-app.vercel.app
   ```
   - Entre como DIRETOR
   - Crie um torneio: "Torneio de Teste"
   - Configure buy-in: R$ 100 / 10.000 fichas
   - Adicione 2 mesas
   - Registre 4 jogadores: Alice, Bob, Carlos, Diana

2. **Dispositivo 2** (Tablet) - DEALER Mesa 1:
   ```
   https://seu-app.vercel.app
   ```
   - Entre como DEALER
   - Selecione "Mesa 1"
   - Observe os jogadores da mesa
   - Clique em "Auto-Balancear"
   - Veja jogadores serem distribuídos

3. **Dispositivo 3** (Smartphone) - Jogador Alice:
   ```
   https://seu-app.vercel.app
   ```
   - Digite o código de acesso de Alice (4 letras)
   - Clique em "SENTAR NA MESA"
   - Observe suas fichas e informações

4. **Dispositivo 4** (Smartphone 2) - Jogador Bob:
   ```
   https://seu-app.vercel.app
   ```
   - Digite o código de acesso de Bob
   - Entre na mesa

**Ações de Teste**:

1. **No DEALER** (Dispositivo 2):
   - Clique em "Posicionar Botão"
   - Clique em "Iniciar Mão"
   - Observe blinds serem postados

2. **No Jogador Bob** (Dispositivo 4):
   - Quando for sua vez, clique em "CALL"
   - Observe suas fichas diminuírem

3. **No Jogador Alice** (Dispositivo 3):
   - Quando for sua vez, clique em "RAISE"
   - Digite um valor
   - Observe suas fichas diminuírem

4. **No DEALER** (Dispositivo 2):
   - Observe todas as ações sendo registradas
   - Observe o pot aumentando

**✅ Resultado Esperado**:
- Todos os dispositivos mostram as mesmas informações
- Ações em um dispositivo aparecem em todos os outros
- Console mostra: "Message sent via Supabase"
- Console mostra: "Estado salvo no Supabase"
- Painel do Supabase mostra novos registros em `poker_actions`

---

### Teste 3: Sincronização de Estado Complexo

**Objetivo**: Testar cenários complexos de jogo

**Passos**:

1. Inicie uma mão completa com 4 jogadores
2. Faça várias ações (bet, raise, call, fold)
3. Avance para FLOP, TURN, RIVER
4. Distribua potes no showdown
5. Inicie nova mão

**Verificações**:
- [ ] Pot atualiza em tempo real em todos os dispositivos
- [ ] Turno correto é indicado
- [ ] Apostas são visíveis instantaneamente
- [ ] Histórico de ações está sincronizado
- [ ] Potes laterais são calculados corretamente
- [ ] Fichas dos vencedores são atualizadas
- [ ] Botão do dealer move corretamente

---

### Teste 4: Desconexão e Reconexão

**Objetivo**: Verificar recuperação de estado após perda de conexão

**Passos**:

1. Inicie um jogo com 3 dispositivos
2. **No Dispositivo 1**:
   - Desabilite WiFi / Dados móveis
   - Aguarde 30 segundos
   - Reative a conexão

3. **Nos outros dispositivos**:
   - Continue fazendo ações normalmente

4. **No Dispositivo 1 reconectado**:
   - Recarregue a página
   - Observe se o estado foi recuperado

**✅ Resultado Esperado**:
- Dispositivo reconectado recupera o estado mais recente
- Console mostra: "Estado recuperado do Supabase"
- Jogo continua normalmente

---

## 🐛 Troubleshooting de Testes

### Problema: Ações não sincronizam

**Checklist**:
1. [ ] Variáveis de ambiente configuradas?
   ```bash
   # Verifique no console do navegador
   console.log(import.meta.env.VITE_SUPABASE_URL)
   ```

2. [ ] Realtime habilitado no Supabase?
   - Vá em Database > Replication
   - Verifique se `poker_actions` está ativo

3. [ ] Console mostra erros?
   - Abra DevTools (F12)
   - Vá para a aba Console
   - Procure por erros em vermelho

4. [ ] Conexão com Supabase OK?
   ```javascript
   // No console do navegador
   const { data, error } = await supabase
     .from('poker_actions')
     .select('count')
   console.log(data, error)
   ```

### Problema: Estado não persiste

**Verificações**:
1. localStorage funcional?
   ```javascript
   // No console do navegador
   localStorage.setItem('test', '123')
   console.log(localStorage.getItem('test'))
   ```

2. Tabela `poker_game_state` criada?
   ```sql
   -- No SQL Editor do Supabase
   SELECT * FROM poker_game_state LIMIT 1;
   ```

### Problema: Múltiplas versões do estado

**Solução**:
1. Limpe localStorage:
   ```javascript
   localStorage.clear()
   ```

2. Limpe Supabase:
   ```sql
   DELETE FROM poker_game_state;
   DELETE FROM poker_actions;
   ```

3. Recarregue todas as abas/dispositivos

---

## 📊 Logs e Monitoramento

### Console do Navegador

**Mensagens de Sucesso**:
```
✅ Subscribing to Supabase Realtime...
✅ Supabase subscription status: SUBSCRIBED
✅ Message sent via Supabase
✅ Estado salvo no Supabase
✅ Estado recuperado do Supabase
```

**Mensagens de Fallback**:
```
⚠️ Supabase error: ...
⚠️ Falling back to BroadcastChannel
```

### Painel do Supabase

1. **Table Editor**:
   - Veja registros em `poker_actions` em tempo real
   - Verifique `poker_game_state` sendo atualizado

2. **Realtime Logs**:
   - Observe conexões de clientes
   - Veja mensagens sendo transmitidas

3. **Database Logs**:
   - Verifique queries executadas
   - Identifique problemas de performance

---

## ✅ Checklist de Teste Completo

### Funcionalidade Básica
- [ ] Múltiplas abas sincronizam localmente
- [ ] Estado persiste após recarregar página
- [ ] Diferentes roles funcionam corretamente

### Multi-Dispositivo (Supabase)
- [ ] Dispositivos diferentes se conectam
- [ ] Ações sincronizam em tempo real
- [ ] Estado é compartilhado entre dispositivos
- [ ] Reconexão recupera estado corretamente

### Cenários de Jogo
- [ ] Torneio pode ser criado e configurado
- [ ] Jogadores podem se registrar
- [ ] Mesa pode iniciar mãos
- [ ] Apostas funcionam corretamente
- [ ] Potes laterais são calculados
- [ ] Distribuição de potes funciona
- [ ] Nova mão pode ser iniciada

### Performance
- [ ] Sincronização é instantânea (< 1 segundo)
- [ ] Não há lag perceptível
- [ ] Múltiplas ações simultâneas são tratadas
- [ ] Sistema funciona com 10+ conexões simultâneas

---

## 🎯 Próximos Passos

Após validar todos os testes:

1. ✅ Configure monitoramento de produção
2. ✅ Configure alertas no Supabase
3. ✅ Documente casos de uso específicos
4. ✅ Treine usuários no novo sistema
5. ✅ Estabeleça processo de backup

---

**Dúvidas?** Consulte [SETUP_MULTI_USUARIO.md](SETUP_MULTI_USUARIO.md) ou abra uma issue.
