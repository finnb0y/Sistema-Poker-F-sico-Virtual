# 🔧 Guia de Configuração de Variáveis de Ambiente (Para Desenvolvedores)

> **⚠️ Nota:** Este guia é para **desenvolvedores e mantenedores** do sistema. Se você é um usuário final, não precisa configurar nada! Veja [USER_GUIDE.md](USER_GUIDE.md) para instruções de uso.

Este guia explica como configurar corretamente as variáveis de ambiente para o projeto de Poker Físico-Virtual, tanto para desenvolvimento local quanto para produção.

## 📋 Visão Geral

O projeto utiliza **Supabase** para sincronização em tempo real entre dispositivos. As credenciais do Supabase devem ser configuradas **uma vez** pelos mantenedores do sistema, permitindo que todos os usuários finais acessem o sistema sem qualquer configuração.

### Variáveis Necessárias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase | `eyJhbGciOiJIUzI1NiIs...` |

> **Nota**: O prefixo `VITE_` é obrigatório para que o Vite exponha essas variáveis no código do cliente.

## 🏠 Desenvolvimento Local

### Passo 1: Criar arquivo .env

O arquivo `.env` contém as variáveis de ambiente para desenvolvimento local e **não deve ser commitado** no Git (já está no `.gitignore`).

```bash
# Copie o arquivo de exemplo para .env
cp .env.example .env
```

### Passo 2: Configurar credenciais

Edite o arquivo `.env` e substitua os valores de placeholder pelas suas credenciais reais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### Passo 3: Obter credenciais do Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** → para `VITE_SUPABASE_URL`
   - **anon public** key → para `VITE_SUPABASE_ANON_KEY`

### Passo 4: Reiniciar servidor de desenvolvimento

Após modificar o arquivo `.env`, **sempre reinicie** o servidor de desenvolvimento:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

> **Importante**: O Vite carrega variáveis de ambiente apenas no início. Mudanças no `.env` não são refletidas automaticamente.

### Passo 5: Validar configuração

Use o script de validação para verificar se tudo está correto:

```bash
npm run validate-env
```

Este script verifica:
- ✅ Se o arquivo `.env` existe
- ✅ Se as variáveis estão configuradas (não são placeholders)
- ✅ Se os valores parecem válidos

## ☁️ Produção (Vercel)

Para deploy em produção na Vercel, as variáveis de ambiente devem ser configuradas **uma única vez** pelos mantenedores no painel da Vercel, **não** no arquivo `.env`.

> **Importante:** Uma vez configurado em produção, todos os usuários finais poderão acessar o sistema sem qualquer configuração adicional.

### Configuração na Vercel (Apenas Mantenedores)

1. Acesse o [painel da Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione as seguintes variáveis:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `sua_chave_anon` | Production, Preview, Development |

5. Clique em **Save**
6. Faça um novo deploy ou aguarde o próximo deploy automático

### Deploy automático

Após configurar as variáveis, todo push para o repositório irá:
1. Carregar as variáveis de ambiente da Vercel
2. Fazer build do projeto com essas variáveis
3. Deploy automático
4. **Usuários finais acessam o site sem configuração**

## 🔍 Verificação

### Script de validação automática

Execute o script de validação para verificar a configuração:

```bash
npm run validate-env
```

**Saída esperada (configuração correta):**
```
✅ Arquivo .env configurado com credenciais
🎉 Configuração parece estar correta!
🚀 Inicie o servidor com: npm run dev
```

**Saída quando .env não existe:**
```
⚠️  Arquivo .env não encontrado
💡 Para sincronização multi-dispositivo:
   1. Execute: cp .env.example .env
   2. Edite .env com suas credenciais do Supabase
   3. Reinicie o servidor de desenvolvimento
```

### Como verificar se as variáveis estão carregadas

Adicione logs temporários no código para verificar:

```typescript
// services/supabaseClient.ts
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado');
```

### Console do navegador

Após iniciar a aplicação, abra o DevTools (F12) e verifique:

**✅ Supabase configurado corretamente:**
```
Subscribing to Supabase Realtime...
Supabase subscription status: SUBSCRIBED
```

**❌ Supabase não configurado:**
```
No sync method available
```

## 🐛 Troubleshooting

### Problema: Variáveis não estão sendo carregadas

**Verificações:**

1. ✅ O arquivo `.env` está na **raiz** do projeto?
2. ✅ As variáveis começam com `VITE_`?
3. ✅ O servidor foi **reiniciado** após criar/modificar `.env`?
4. ✅ Não há espaços extras ou aspas desnecessárias nos valores?

**Exemplo correto:**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
```

**Exemplos incorretos:**
```env
SUPABASE_URL=https://xxxxx.supabase.co           # Falta VITE_
VITE_SUPABASE_URL = https://xxxxx.supabase.co    # Espaços extras
VITE_SUPABASE_URL="https://xxxxx.supabase.co"    # Aspas desnecessárias
```

### Problema: "Cannot read properties of null"

**Causa**: O cliente Supabase não foi inicializado porque as variáveis não foram carregadas.

**Solução**:
1. Verifique se o arquivo `.env` existe e contém as variáveis corretas
2. Reinicie o servidor de desenvolvimento
3. Limpe o cache do navegador (Ctrl+Shift+R)

### Problema: Deploy na Vercel não sincroniza

**Verificações:**

1. ✅ Variáveis de ambiente configuradas na Vercel?
2. ✅ Variáveis estão nos ambientes corretos (Production/Preview)?
3. ✅ Foi feito um novo deploy após configurar as variáveis?
4. ✅ As credenciais do Supabase estão corretas?

**Solução**:
1. Vá em Settings > Environment Variables na Vercel
2. Verifique se as variáveis existem e estão corretas
3. Faça um novo deploy (Deployments > ... > Redeploy)

## 🔒 Segurança

### ❌ NÃO faça

- ❌ **NÃO** commite o arquivo `.env` no Git
- ❌ **NÃO** coloque credenciais reais em `.env.example`
- ❌ **NÃO** compartilhe suas chaves em repositórios públicos
- ❌ **NÃO** use a chave `service_role` no frontend (use apenas `anon`)

### ✅ Faça

- ✅ Use o arquivo `.env` apenas para desenvolvimento local
- ✅ Mantenha `.env.example` com valores de placeholder
- ✅ Configure variáveis de produção no painel da Vercel
- ✅ Use apenas a chave `anon` (pública) no frontend
- ✅ Configure políticas RLS no Supabase para segurança

## 📚 Recursos Adicionais

- [Vite - Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase - API Settings](https://supabase.com/docs/guides/api#api-url-and-keys)

## 🎯 Checklist de Configuração

### Desenvolvimento Local
- [ ] Arquivo `.env` criado na raiz do projeto
- [ ] Credenciais do Supabase adicionadas no `.env`
- [ ] Servidor de desenvolvimento reiniciado
- [ ] Console mostra "Subscribing to Supabase Realtime..."
- [ ] Teste de sincronização entre duas abas funcionando

### Produção (Vercel)
- [ ] Variáveis configuradas no painel da Vercel
- [ ] Deploy realizado após configurar variáveis
- [ ] Build da Vercel executou com sucesso
- [ ] Console do navegador mostra conexão com Supabase
- [ ] Teste multi-dispositivo funcionando

## 💡 Dicas

1. **Desenvolvimento em equipe**: Cada desenvolvedor deve ter seu próprio arquivo `.env` local
2. **Múltiplos ambientes**: Use `.env.development`, `.env.staging`, `.env.production` para diferentes ambientes
3. **Variáveis sensíveis**: Use secrets managers para informações muito sensíveis
4. **Documentação**: Mantenha o `.env.example` atualizado quando adicionar novas variáveis

## ❓ Perguntas Frequentes

### Posso commitar o arquivo .env?

**Não!** O arquivo `.env` contém credenciais sensíveis e deve ser mantido apenas localmente pelos desenvolvedores. O `.gitignore` já está configurado para ignorar este arquivo.

### E se eu não configurar o Supabase?

**Para desenvolvedores:** O sistema não funcionará corretamente sem Supabase configurado, pois ele é necessário para autenticação e sincronização.

**Para usuários finais:** Não é necessário configurar nada! O sistema já vem pré-configurado em produção.

### Preciso configurar para desenvolvimento local?

**Sim, apenas se você for desenvolvedor.** Siga as instruções na seção "Desenvolvimento Local" deste guia ou veja [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md) para instruções completas.

### Como sei se está funcionando?

**Para desenvolvedores:** Abra duas abas do navegador e faça uma ação em uma delas. Se a outra aba atualizar automaticamente, está funcionando!

**Para usuários finais:** Se você consegue criar conta e fazer login, está funcionando corretamente.

---

**Precisa de ajuda?** 
- **Desenvolvedores:** Consulte o [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md) para mais detalhes
- **Usuários finais:** Consulte o [USER_GUIDE.md](USER_GUIDE.md) para instruções de uso
