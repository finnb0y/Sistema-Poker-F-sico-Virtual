# 🔐 Guia de Configuração de Autenticação de Usuários

Este guia explica como configurar o sistema de autenticação de usuários e sincronização multi-dispositivo no Sistema de Poker Físico-Virtual.

## 📋 Visão Geral

O sistema agora requer autenticação de usuários para funcionar. Cada usuário:
- Possui login único (username + senha)
- Tem seus próprios torneios e mesas isolados
- Pode acessar seus dados de qualquer dispositivo
- Tem sincronização automática em tempo real entre dispositivos

## ⚠️ Requisitos Obrigatórios

1. **Conta no Supabase** (gratuita)
2. **Projeto criado no Supabase**
3. **Scripts SQL executados** no banco de dados
4. **Variáveis de ambiente configuradas** no arquivo `.env`

## 🚀 Passo a Passo de Configuração

### Passo 1: Criar Conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub, Google ou email
4. É gratuito e não requer cartão de crédito

### Passo 2: Criar Novo Projeto

1. No dashboard do Supabase, clique em "New Project"
2. Escolha um nome para o projeto (ex: `poker-system`)
3. Crie uma senha forte para o banco de dados
4. Escolha uma região próxima de você
5. Selecione o plano "Free" (gratuito)
6. Clique em "Create new project"
7. Aguarde 2-3 minutos até o projeto ser provisionado

### Passo 3: Executar Scripts SQL

1. No menu lateral do Supabase, clique em **"SQL Editor"**
2. Clique em "New query"

**Primeiro Script: Estrutura Base**
3. Copie todo o conteúdo do arquivo `supabase-setup.sql`
4. Cole no editor SQL
5. Clique em "Run" (ou pressione Ctrl+Enter)
6. Verifique se aparece mensagem de sucesso

**Segundo Script: Autenticação**
7. Crie uma nova query (botão "New query")
8. Copie todo o conteúdo do arquivo `supabase-auth-migration.sql`
9. Cole no editor SQL
10. Clique em "Run" (ou pressione Ctrl+Enter)
11. Verifique se aparece mensagem de sucesso

### Passo 4: Obter Credenciais do Supabase

1. No menu lateral, clique em **"Settings"** (ícone de engrenagem)
2. Clique em **"API"** no submenu
3. Você verá duas informações importantes:

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```

**Project API keys > anon public:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJl...
```

⚠️ **Use a chave `anon` (pública), NÃO a `service_role` (privada)**

### Passo 5: Configurar Variáveis de Ambiente

1. Na raiz do projeto, copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Abra o arquivo `.env` em um editor de texto

3. Substitua os valores pelas suas credenciais:
```env
# URL do projeto Supabase (copie do passo anterior)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Chave pública/anon do projeto Supabase (copie do passo anterior)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
```

4. Salve o arquivo `.env`

### Passo 6: Validar Configuração

Execute o comando para validar:
```bash
npm run validate-env
```

Se tudo estiver correto, você verá:
```
✓ Environment variables are configured correctly
```

### Passo 7: Iniciar o Servidor

```bash
npm run dev
```

O servidor iniciará em `http://localhost:3000`

## 🔒 Primeiro Uso

1. Abra o navegador em `http://localhost:3000`
2. Você verá a tela de login
3. Clique em "CRIAR CONTA"
4. Escolha um nome de usuário (mínimo 3 caracteres)
5. Escolha uma senha (mínimo 6 caracteres)
6. Clique em "REGISTRAR"
7. Você será automaticamente logado e verá a tela de seleção de papel

## 🌐 Usando em Múltiplos Dispositivos

### No seu computador:
1. Abra `http://localhost:3000`
2. Faça login com suas credenciais

### No seu celular/tablet (mesma rede):
1. Descubra o IP local do seu computador:
   - Windows: `ipconfig` → procure por "IPv4"
   - Mac/Linux: `ifconfig` → procure por "inet"
   - Exemplo: `192.168.1.100`

2. No dispositivo móvel, acesse: `http://192.168.1.100:3000`
3. Faça login com as mesmas credenciais
4. Suas mudanças sincronizarão automaticamente!

### Em produção (Vercel/outro host):
1. Configure as variáveis de ambiente no painel do hosting
2. Use as mesmas credenciais do Supabase
3. Acesse de qualquer lugar do mundo!

## 🔐 Segurança

### Senhas
- Senhas são hasheadas com SHA-256 antes de serem armazenadas
- Para produção, considere usar bcrypt ou argon2

### Sessões
- Sessões expiram automaticamente após 30 dias
- Tokens de sessão são gerados aleatoriamente
- Logout deleta a sessão do servidor

### Row Level Security (RLS)
- Cada usuário só pode ver/editar seus próprios dados
- Implementado no nível do banco de dados
- Não é possível burlar via API

## ❌ Sem Supabase?

O sistema **NÃO funcionará** sem Supabase configurado. A aplicação mostrará uma tela de aviso com instruções.

**Por quê?**
- Autenticação de usuários requer banco de dados
- Sincronização multi-dispositivo requer servidor
- localStorage foi completamente removido para dados de jogo

## 🆘 Problemas Comuns

### "Supabase não configurado"
- Verifique se o arquivo `.env` existe
- Verifique se as variáveis começam com `VITE_`
- Reinicie o servidor após editar `.env`

### "Nome de usuário ou senha inválidos"
- Verifique se você criou a conta primeiro
- Senhas são case-sensitive
- Nomes de usuário são convertidos para minúsculas

### "Failed to persist state to Supabase"
- Verifique se os scripts SQL foram executados
- Verifique se as credenciais estão corretas
- Verifique a conexão com a internet

### Dados não sincronizam
- Verifique se você está logado com o mesmo usuário
- Abra o console do navegador para ver logs
- Verifique se o Realtime está ativo no Supabase

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Dashboard do Supabase](https://app.supabase.com)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Próximos Passos

Depois de configurar:
1. Crie sua conta
2. Acesse como DIRETOR para criar torneios
3. Registre pessoas no sistema
4. Crie um torneio
5. Atribua jogadores ao torneio
6. Inicie o jogo!

---

Se encontrar problemas, abra uma issue no GitHub com:
- Mensagem de erro completa
- Passos para reproduzir
- Prints de tela (sem expor suas credenciais!)
