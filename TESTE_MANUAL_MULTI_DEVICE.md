# 🧪 Guia de Teste Manual - Sincronização Multi-Dispositivo

## 📋 Pré-requisitos

Antes de iniciar os testes, certifique-se de que:

- ✅ Supabase está configurado com scripts SQL executados
- ✅ Variáveis de ambiente definidas (`.env`)
- ✅ Aplicação compilada (`npm run build`) ou rodando (`npm run dev`)
- ✅ Acesso a pelo menos 2 dispositivos diferentes (ou 2 navegadores/abas)

## 🎯 Cenários de Teste

### Teste 1: Sincronização Básica entre Admin e Jogador

**Objetivo**: Verificar que torneio criado no Dispositivo A é acessível no Dispositivo B via código.

**Passos**:

#### Dispositivo A (Admin)
1. Abra o aplicativo
2. Clique em "Modo Administrativo"
3. Faça login ou registre-se (ex: username: `admin`, password: `admin123`)
4. Crie um torneio:
   - Nome: "Teste Multi-Device"
   - Configurações básicas
   - Selecione 1 mesa
5. Registre uma pessoa no sistema:
   - Nome: "Jogador Teste"
6. Registre o jogador no torneio:
   - Selecione "Jogador Teste"
   - Selecione torneio "Teste Multi-Device"
   - Confirme inscrição
7. **Anote o código do jogador** (4 caracteres, ex: `AB12`)
8. Faça uma ação qualquer (ex: atribuir jogador a uma mesa)

**Resultado Esperado**: 
- Torneio criado ✅
- Jogador registrado ✅
- Código gerado ✅
- Estado salvo no backend ✅

#### Dispositivo B (Jogador)
1. Abra o aplicativo em outro dispositivo/navegador
2. Você deve ver a tela de entrada de código
3. Digite o código anotado (ex: `AB12`)
4. Clique em "ENTRAR"

**Resultado Esperado**:
- ✅ Mensagem no console: "🔍 Código não encontrado localmente, buscando no backend..."
- ✅ Mensagem no console: "✅ Código encontrado! Carregando estado do torneio..."
- ✅ Mensagem no console: "✅ Estado do torneio carregado com sucesso"
- ✅ Interface do jogador carregada com suas fichas visíveis
- ✅ Nome do torneio aparece na interface

**Como Verificar**:
- Abra o console do navegador (F12)
- Verifique as mensagens de log
- Confirme que a interface do jogador está funcionando

---

### Teste 2: Sincronização em Tempo Real

**Objetivo**: Verificar que ações no Dispositivo A aparecem instantaneamente no Dispositivo B.

**Passos**:

#### Preparação
1. Complete o Teste 1 primeiro
2. Mantenha ambos dispositivos abertos
3. Dispositivo A: Modo Admin
4. Dispositivo B: Modo Jogador

#### Dispositivo A (Admin)
1. No painel administrativo, modifique o saldo do jogador:
   - Adicione ou remova fichas
   - Ou faça uma ação de rebuy/add-on
2. Observe a interface

#### Dispositivo B (Jogador)
1. Observe a interface do jogador
2. O saldo deve atualizar automaticamente

**Resultado Esperado**:
- ✅ Mudanças no Dispositivo A aparecem no Dispositivo B em < 2 segundos
- ✅ Sem necessidade de refresh manual
- ✅ Console mostra mensagens de sincronização

**Como Verificar**:
- No Dispositivo B, abra console (F12)
- Procure por mensagens de sincronização
- Confirme que o saldo atualiza automaticamente

---

### Teste 3: Acesso de Dealer via Código

**Objetivo**: Verificar que código de dealer funciona corretamente.

**Passos**:

#### Dispositivo A (Admin)
1. No painel administrativo, visualize as mesas
2. Encontre o código do dealer da Mesa 1 (começa com 'D', ex: `DABC`)
3. **Anote o código do dealer**

#### Dispositivo C (Dealer)
1. Abra o aplicativo em um terceiro dispositivo/navegador
2. Digite o código do dealer
3. Clique em "ENTRAR"

**Resultado Esperado**:
- ✅ Interface de dealer carregada
- ✅ Controles de mesa visíveis (iniciar mão, mover botão, etc.)
- ✅ Estado da mesa sincronizado com admin

---

### Teste 4: Persistência após Refresh

**Objetivo**: Verificar que refresh da página não perde a conexão.

**Passos**:

#### Dispositivo B (Jogador - conectado do Teste 1)
1. Verifique que você está conectado como jogador
2. Pressione F5 (ou Ctrl+R / Cmd+R) para recarregar a página
3. Aguarde o carregamento

**Resultado Esperado**:
- ✅ Página recarrega
- ✅ Interface do jogador reaparece automaticamente
- ✅ Saldo e estado estão corretos
- ✅ Console mostra: "✅ Estado do torneio restaurado após refresh"
- ✅ Sincronização continua funcionando

**Como Verificar**:
- No Dispositivo A, faça uma mudança
- No Dispositivo B (após refresh), verifique que a mudança aparece
- Isso confirma que a sincronização continua ativa após refresh

---

### Teste 5: Múltiplos Jogadores Simultaneamente

**Objetivo**: Verificar escalabilidade com múltiplos dispositivos.

**Passos**:

#### Dispositivo A (Admin)
1. Registre 3 jogadores diferentes
2. Anote os 3 códigos

#### Dispositivos B, C, D (Jogadores)
1. Em 3 dispositivos/navegadores diferentes
2. Entre com cada código em um dispositivo diferente
3. Todos devem conectar simultaneamente

#### Dispositivo A (Admin)
1. Faça uma ação que afeta todos (ex: aumentar blind level)

**Resultado Esperado**:
- ✅ Todos os 3 jogadores conectam com sucesso
- ✅ Todos veem suas próprias fichas
- ✅ Ação do admin sincroniza com todos os 3 simultaneamente

---

### Teste 6: Código Inválido

**Objetivo**: Verificar tratamento de erros.

**Passos**:

1. Em um dispositivo limpo, abra o aplicativo
2. Digite um código inválido (ex: `ZZZZ`)
3. Clique em "ENTRAR"

**Resultado Esperado**:
- ✅ Console mostra: "🔍 Código não encontrado localmente, buscando no backend..."
- ✅ Console mostra: "⚠️ Código não encontrado em nenhum estado de jogo"
- ✅ Alert aparece: "Código não encontrado. Verifique o código e tente novamente."
- ✅ Usuário permanece na tela de entrada

---

### Teste 7: Sincronização sem Supabase (Fallback)

**Objetivo**: Verificar comportamento quando Supabase não está disponível.

**Passos**:

1. Temporariamente remova as variáveis de ambiente do Supabase
2. Reinicie a aplicação
3. Tente acessar com um código

**Resultado Esperado**:
- ✅ Aplicação não quebra
- ✅ Console mostra: "❌ ERRO: Backend não configurado"
- ✅ Mensagem clara para o usuário sobre necessidade de configuração
- ✅ Instruções de configuração são exibidas

**Importante**: Restaure as variáveis de ambiente após o teste!

---

## 📊 Checklist de Validação

Após completar todos os testes, verifique:

- [ ] Torneio criado em Device A é acessível via código em Device B
- [ ] Códigos de jogador funcionam corretamente
- [ ] Códigos de dealer funcionam corretamente
- [ ] Sincronização em tempo real funciona (< 2 segundos de latência)
- [ ] Refresh da página mantém conexão
- [ ] Múltiplos dispositivos podem conectar simultaneamente
- [ ] Código inválido é tratado graciosamente
- [ ] Mensagens de erro são claras e em português
- [ ] Console mostra logs informativos do processo
- [ ] Não há erros no console (exceto avisos esperados)

## 🐛 Problemas Comuns e Soluções

### "Código não encontrado" mas o código está correto

**Possíveis Causas**:
1. Admin não finalizou criação do torneio
2. Estado não foi persistido no backend
3. Tempo de propagação (aguarde alguns segundos)

**Soluções**:
1. No Device A (admin), faça qualquer ação para forçar persist
2. Aguarde 3-5 segundos e tente novamente
3. Verifique console do admin para erros de persistência

### Sincronização lenta ou não funciona

**Possíveis Causas**:
1. Conexão de internet lenta
2. Supabase tem latência
3. Subscription não está ativa

**Soluções**:
1. Verifique conexão com internet
2. Abra console e procure por: "🔄 Iniciando assinatura de sincronização"
3. Verifique se não há erros de conexão com Supabase

### Refresh perde conexão

**Possíveis Causas**:
1. localStorage não está funcionando
2. syncUserId não foi salvo

**Soluções**:
1. Verifique console: deve mostrar "✅ Estado do torneio restaurado após refresh"
2. Inspecione localStorage (F12 > Application > Local Storage)
3. Verifique se `poker_sync_user_id` está presente

## 📝 Como Reportar Problemas

Se encontrar algum problema durante os testes:

1. **Capture Screenshots**: Da interface e do console
2. **Anote Passos**: Como reproduzir o problema
3. **Console Logs**: Copie mensagens de erro relevantes
4. **Configuração**: Confirme que Supabase está configurado
5. **Dispositivos**: Liste quais dispositivos/navegadores usou

Crie uma issue no GitHub com estas informações.

## ✅ Critérios de Sucesso

Os testes são considerados bem-sucedidos quando:

1. ✅ Todos os 7 cenários de teste passam
2. ✅ Nenhum erro crítico no console
3. ✅ Latência de sincronização < 2 segundos
4. ✅ Interface não quebra em nenhum momento
5. ✅ Códigos inválidos são tratados graciosamente
6. ✅ Múltiplos dispositivos sincronizam corretamente
7. ✅ Refresh mantém conexão
8. ✅ Mensagens de erro são claras

---

**Próximos Passos após Testes Bem-Sucedidos**:
1. Deploy para produção
2. Monitorar logs de produção
3. Coletar feedback de usuários reais
4. Otimizar latência se necessário

**Data**: 2025-12-29  
**Versão**: 2.2.0  
**Status**: Pronto para Teste Manual
