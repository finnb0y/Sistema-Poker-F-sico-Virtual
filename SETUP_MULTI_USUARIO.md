# 🌐 Guia de Configuração - Sistema Multi-Usuário Online

Este guia explica como configurar o sistema de poker para funcionar com múltiplos usuários em dispositivos diferentes usando Supabase para sincronização em tempo real.

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com) (gratuita)
- Node.js 16+ instalado
- npm ou yarn

## 🚀 Configuração Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Clique em "New Project"
3. Escolha um nome para o projeto (ex: "poker-online")
4. Defina uma senha forte para o banco de dados
5. Escolha a região mais próxima dos seus usuários
6. Clique em "Create new project" e aguarde alguns minutos

### 2. Configurar Banco de Dados

1. No painel do Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em "+ New query"
3. Copie todo o conteúdo do arquivo `supabase-setup.sql`
4. Cole no editor e clique em "Run"
5. Verifique se as tabelas foram criadas com sucesso

**Tabelas criadas:**
- `poker_game_state`: Armazena o estado completo do jogo
- `poker_actions`: Armazena as ações em tempo real para sincronização

### 3. Habilitar Realtime

1. No painel do Supabase, vá em **Database** > **Replication**
2. Encontre a tabela `poker_actions`
3. Ative o toggle "Enable Realtime" para esta tabela
4. Clique em "Save"

### 4. Obter Credenciais

1. No painel do Supabase, vá em **Settings** > **API**
2. Copie os seguintes valores:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (uma chave longa começando com `eyJ...`)

### 5. Configurar Variáveis de Ambiente

#### Desenvolvimento Local

1. Crie um arquivo `.env` na raiz do projeto:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e adicione suas credenciais:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Salve o arquivo e **reinicie o servidor de desenvolvimento**

> **📖 Para instruções detalhadas sobre configuração de variáveis de ambiente, consulte o [Guia de Configuração de Ambiente](ENVIRONMENT_SETUP.md)**

#### Produção (Vercel)

1. Acesse o painel da [Vercel](https://vercel.com)
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione as seguintes variáveis:
   - `VITE_SUPABASE_URL`: Cole a URL do seu projeto
   - `VITE_SUPABASE_ANON_KEY`: Cole a chave anon
5. Clique em "Save"
6. Faça um novo deploy ou aguarde o deploy automático

## 🧪 Testar a Configuração

### Teste Local (Mesmo Dispositivo)

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abra **duas abas** do navegador em `http://localhost:3000`

4. Em uma aba, entre como **DIRETOR** ou **DEALER**

5. Em outra aba, entre como **JOGADOR** (usando código de acesso)

6. Faça uma ação em uma aba e observe se ela aparece na outra

✅ **Esperado**: Ações devem sincronizar entre as duas abas

### Teste Multi-Dispositivo (Produção)

1. Faça deploy na Vercel:
   ```bash
   npm run build
   vercel --prod
   ```

2. Abra a URL do deploy em **diferentes dispositivos**:
   - Computador desktop
   - Tablet
   - Smartphone

3. Entre com diferentes roles em cada dispositivo

4. Faça ações e observe a sincronização em tempo real

✅ **Esperado**: Todos os dispositivos devem ver as mesmas atualizações instantaneamente

## 🔍 Verificação de Problemas

### Console do Navegador

Abra o DevTools (F12) e verifique o console:

**Mensagens de sucesso:**
```
Subscribing to Supabase Realtime...
Supabase subscription status: SUBSCRIBED
Message sent via Supabase
Estado salvo no Supabase
```

**Mensagens de problema:**
```
Failed to send message via Supabase
Supabase error: ...
```

### Verificar Conexão no Supabase

1. No painel do Supabase, vá em **Database** > **Tables**
2. Clique na tabela `poker_actions`
3. Verifique se novos registros aparecem quando você faz ações no jogo

## 📊 Monitoramento

### Logs do Supabase

1. Vá em **Logs** no painel do Supabase
2. Selecione **Realtime Logs** para ver conexões em tempo real
3. Selecione **Database Logs** para ver queries executadas

### Estatísticas

1. Vá em **Reports** no painel do Supabase
2. Observe:
   - Conexões ativas
   - Queries por segundo
   - Uso de banda

## 🎮 Modo Fallback (Sem Supabase)

Se não configurar o Supabase, o sistema continua funcionando:

- ✅ Sincronização entre abas do mesmo dispositivo (BroadcastChannel)
- ✅ Salvamento local (localStorage)
- ❌ Sincronização entre dispositivos diferentes

**Cenários de uso:**
- **Com Supabase**: Torneios multi-mesa com jogadores em vários dispositivos
- **Sem Supabase**: Testes locais ou jogo em um único dispositivo

## 🔒 Segurança

### Políticas Atuais (RLS)

Atualmente, as tabelas estão configuradas para:
- ✅ Permitir leitura para todos
- ✅ Permitir escrita para todos

**Recomendado para produção:**
1. Implementar autenticação de usuários
2. Adicionar políticas RLS baseadas em usuário autenticado
3. Restringir acesso por session_id

### Melhorias Futuras

```sql
-- Exemplo: Restringir por autenticação
CREATE POLICY "Apenas usuários autenticados"
ON poker_actions FOR ALL
TO authenticated
USING (true);
```

## 🛠️ Troubleshooting

### Problema: "Supabase error: JWT expired"

**Solução**: Recarregue a página. O token é renovado automaticamente.

### Problema: Ações não sincronizam

**Verificações:**
1. ✅ Credenciais corretas no `.env`?
2. ✅ Realtime habilitado na tabela `poker_actions`?
3. ✅ Políticas RLS configuradas?
4. ✅ Console mostra "SUBSCRIBED"?

### Problema: "Cannot read properties of null"

**Solução**: Verifique se as variáveis de ambiente estão sendo carregadas:
```bash
# Reinicie o servidor após alterar .env
npm run dev
```

📖 **Para mais detalhes sobre troubleshooting de variáveis de ambiente, consulte o [Guia de Configuração de Ambiente](ENVIRONMENT_SETUP.md#-troubleshooting)**

## 📚 Recursos Adicionais

- [Documentação Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## ✅ Checklist de Configuração

- [ ] Projeto Supabase criado
- [ ] Script SQL executado com sucesso
- [ ] Realtime habilitado em `poker_actions`
- [ ] Credenciais copiadas
- [ ] Arquivo `.env` criado e configurado
- [ ] Teste local funcionando
- [ ] Variáveis de ambiente na Vercel configuradas
- [ ] Deploy realizado
- [ ] Teste multi-dispositivo funcionando

---

## 🎉 Pronto!

Seu sistema de poker agora está configurado para funcionar com múltiplos usuários em dispositivos diferentes com sincronização em tempo real!

**Próximos Passos:**
1. Teste com amigos em diferentes dispositivos
2. Configure autenticação para maior segurança
3. Monitore uso e performance no painel do Supabase
4. Ajuste limites e políticas conforme necessário

---

**Dúvidas?** Consulte a documentação ou abra uma issue no repositório.
