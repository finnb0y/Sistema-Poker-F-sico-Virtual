# 🃏 Sistema de Poker Físico-Virtual

Sistema de fichas de poker virtual para unificação de jogos de poker com cartas físicas.

## 📋 Sobre o Projeto

Este projeto permite jogar poker usando cartas físicas reais enquanto gerencia fichas, apostas e o pot de forma virtual através de uma interface web moderna. **Jogadores e dealers podem entrar nas mesas usando códigos simples, sem necessidade de criar conta.**

## 🎮 Acesso Rápido

### Para Jogadores e Dealers

**Não precisa criar conta!** Basta:
1. Receber seu código (4 caracteres para jogador, ou Dxxx para dealer)
2. Abrir o aplicativo
3. Digitar o código
4. Jogar!

📖 **[Veja o guia completo de códigos de acesso](./CODIGO_ACESSO.md)**

### Para Administradores

**Criar e gerenciar torneios requer:**
1. **Supabase configurado** - Para sincronização multi-dispositivo
2. **Conta administrativa** - Criada no primeiro acesso
3. **Banco de dados PostgreSQL** - Fornecido automaticamente pelo Supabase

## 🚀 Tecnologias

- **React** - Biblioteca para construção da interface
- **TypeScript** - Tipagem estática para JavaScript
- **Vite** - Build tool e dev server ultra-rápido
- **Vercel** - Hospedagem e deploy contínuo
- **Supabase** - Banco de dados e sincronização em tempo real (opcional para jogadores, obrigatório para admins)

## 💻 Rodando Localmente

### Pré-requisitos

- Node.js 16+ instalado
- npm ou yarn
- **Conta no Supabase (gratuita)** - [Criar conta](https://supabase.com) - **Opcional para testes, obrigatório para uso administrativo**

### Instalação

```bash
# Clone o repositório
git clone https://github.com/finnb0y/Sistema-Poker-F-sico-Virtual.git

# Entre na pasta do projeto
cd Sistema-Poker-F-sico-Virtual

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará rodando em `http://localhost:3000`

### Configuração do Supabase (Opcional)

⚠️ **Necessário apenas para usar funcionalidades administrativas**

Se você deseja criar torneios e gerenciar mesas, configure o Supabase:

```bash
# 1. Crie um projeto no Supabase (https://app.supabase.com)
# 2. Execute o script SQL no SQL Editor do Supabase:
#    - Primeiro: supabase-setup.sql (tabelas base)
#    - Depois: supabase-auth-migration.sql (autenticação e user scope)

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais do Supabase
# VITE_SUPABASE_URL=https://seu-projeto.supabase.co
# VITE_SUPABASE_ANON_KEY=sua-chave-publica

# Valide a configuração (opcional mas recomendado)
npm run validate-env
```

## 🏗️ Build

```bash
# Criar build de produção
npm run build

# Preview do build
npm run preview
```

## 🌐 Deploy

Este projeto está configurado para deploy automático na Vercel:

1. Faça push para o repositório GitHub
2. Conecte o repositório na [Vercel](https://vercel.com)
3. O deploy acontece automaticamente a cada push

### Deploy Manual via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy em produção
vercel --prod
```

## 📁 Estrutura do Projeto

```
├── components/          # Componentes React
├── services/           # Lógica de negócio e serviços
├── utils/              # Utilitários e lógica de jogo
├── docs/               # Documentação técnica
├── App.tsx            # Componente principal
├── index.tsx          # Entry point
├── types.ts           # Definições de tipos TypeScript
├── vite.config.ts     # Configuração do Vite
└── package.json       # Dependências e scripts
```

## 🎮 Funcionalidades

### Para Todos os Usuários (sem necessidade de conta)
- ✅ **Acesso por código** - Entre na mesa com código de 4 caracteres (jogador) ou Dxxx (dealer)
- ✅ Gerenciamento de fichas virtuais
- ✅ Controle de apostas e pot
- ✅ Interface intuitiva e responsiva
- ✅ Suporte para heads-up (2 jogadores) e multi-jogador (3+)

### Para Dealers (com código Dxxx)
- ✅ Iniciar e controlar mãos
- ✅ Lógica completa do dealer (botão, blinds, ordem de ação)
- ✅ Distribuir potes
- ✅ Gerenciar rodadas de apostas

### Para Administradores (com conta e Supabase)
- ✅ **Autenticação de usuários** - Cada administrador possui login único
- ✅ **Gerenciamento isolado de torneios** - Seus torneios são privados e sincronizados entre dispositivos
- ✅ Criar e editar torneios
- ✅ Registrar jogadores e gerar códigos
- ✅ **Sincronização em tempo real entre múltiplos dispositivos**
- ✅ Modo TV para transmissão
- ✅ **Ambiente de testes modular para validação de cenários**

## 🔐 Sistema de Acesso

### Acesso Simples (Jogadores e Dealers)

Não precisa criar conta! Veja [CODIGO_ACESSO.md](./CODIGO_ACESSO.md) para detalhes completos.

**Jogadores:**
1. Receba seu código de 4 caracteres (ex: `AB12`)
2. Digite o código na tela inicial
3. Entre na mesa como jogador

**Dealers:**
1. Receba o código de dealer da mesa (ex: `DABC`)
2. Digite o código na tela inicial
3. Entre na mesa como dealer

### Modo Administrativo

Para criar e gerenciar torneios, o sistema usa **autenticação de usuários e sincronização multi-dispositivo via Supabase**.

### 🔐 Como Funciona

1. **Crie uma conta** - Registre-se na primeira vez que acessar
2. **Faça login** - Use suas credenciais em qualquer dispositivo
3. **Crie torneios** - Seus torneios ficam salvos no servidor
4. **Sincronização automática** - Mudanças aparecem instantaneamente em todos os seus dispositivos

### 🚀 Configuração Rápida

1. **Crie uma conta gratuita no [Supabase](https://supabase.com)**
2. **Crie um novo projeto** no dashboard do Supabase
3. **Execute os scripts SQL** no SQL Editor:
   - Primeiro: `supabase-setup.sql` (estrutura base)
   - Depois: `supabase-auth-migration.sql` (autenticação e isolamento de usuários)
4. **Configure as variáveis de ambiente**:
   ```bash
   cp .env.example .env
   ```
5. **Adicione suas credenciais** do Supabase no arquivo `.env`:
   - `VITE_SUPABASE_URL` - URL do projeto (ex: https://xxxxx.supabase.co)
   - `VITE_SUPABASE_ANON_KEY` - Chave pública/anon do projeto
6. **Reinicie o servidor de desenvolvimento** (`npm run dev`)

📖 **Guias de Configuração:**
- **[Guia Rápido de Variáveis de Ambiente](ENVIRONMENT_SETUP.md)** - Como configurar `.env` corretamente
- **[Guia Completo Multi-Usuário](SETUP_MULTI_USUARIO.md)** - Configuração detalhada do Supabase

### 🔒 Privacidade e Isolamento

- Cada usuário vê **apenas seus próprios torneios e mesas**
- Dados são isolados no nível do banco de dados via Row Level Security (RLS)
- Sessões expiram automaticamente após 30 dias
- Senhas são hasheadas antes de serem armazenadas

## 🧪 Testes

### Ambiente de Testes Modular

Este projeto inclui um ambiente completo de testes para cenários de poker:

```bash
# Executar todos os testes do ambiente modular
npx tsx utils/pokerTestEnvironment.test.ts

# Executar exemplos de uso
npx tsx utils/testExamples.ts

# Executar testes específicos
npx tsx utils/sidePotLogic.test.ts
npx tsx utils/multipleAllInRounds.test.ts
```

**Recursos do ambiente de testes:**
- 🎯 Criação rápida de cenários personalizados
- 📝 Logging automático de todas as ações
- ✅ Validação automática de comportamentos
- 🐛 Detecção e reporte de bugs
- 📊 Relatórios detalhados

Para mais informações, consulte a [documentação completa do ambiente de testes](docs/TESTING_ENVIRONMENT.md).

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 👤 Autor

**finnb0y**
- GitHub: [@finnb0y](https://github.com/finnb0y)

---

Feito com ♠️ por finnb0y
