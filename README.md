# 🃏 Sistema de Poker Físico-Virtual

Sistema de fichas de poker virtual para unificação de jogos de poker com cartas físicas.

## 📋 Sobre o Projeto

Este projeto permite jogar poker usando cartas físicas reais enquanto gerencia fichas, apostas e o pot de forma virtual através de uma interface web moderna. **O sistema opera em modo multi-dispositivo, permitindo sincronização em tempo real entre múltiplos dispositivos.**

## ✨ Nenhuma Configuração Necessária!

**Acesse, crie sua conta e comece a jogar!** Não é necessário configurar nada - o sistema está pronto para uso.

- ✅ **Sincronização automática** em tempo real
- ✅ **Multi-dispositivo** - jogue de qualquer lugar
- ✅ **Sem instalação** - tudo funciona no navegador
- ✅ **Pronto para usar** - sem configuração complexa

## 🎮 Como Usar

### Para Jogadores e Dealers

**Entrar em uma mesa (não precisa criar conta!):**
1. Receba seu código do organizador do torneio
   - Jogadores: código de 4 caracteres (ex: `AB12`)
   - Dealers: código começando com D (ex: `DABC`)
2. Acesse o site
3. Digite o código na tela inicial
4. Jogue em tempo real!

### Para Organizadores de Torneios

**Criar e gerenciar torneios:**
1. **Acesse o site** e clique em "Modo Administrativo"
2. **Crie sua conta** no primeiro acesso (username e senha)
3. **Crie torneios** e gerencie mesas
4. **Registre jogadores** e gere códigos de acesso
5. **Acompanhe em tempo real** - suas alterações aparecem instantaneamente

📖 **[Guia Completo para Usuários](./USER_GUIDE.md)** - Instruções detalhadas de uso

## 🚀 Tecnologias

- **React** - Biblioteca para construção da interface
- **TypeScript** - Tipagem estática para JavaScript
- **Vite** - Build tool e dev server ultra-rápido
- **Supabase** - Banco de dados PostgreSQL e sincronização em tempo real
- **Vercel** - Hospedagem e deploy contínuo

## 🌐 Acesso ao Sistema

O sistema está hospedado e pronto para uso! Não é necessário instalar ou configurar nada.

**Para usar o sistema:**
1. Acesse o site do poker (URL fornecida pelo mantenedor)
2. Se for organizador: crie sua conta e faça login
3. Se for jogador/dealer: use o código de acesso fornecido
4. Comece a jogar!

## 💻 Para Desenvolvedores

Se você é desenvolvedor ou mantenedor do sistema e precisa configurar o ambiente de desenvolvimento:

📖 **[Guia Completo de Configuração para Desenvolvedores](./DEVELOPER_SETUP.md)**

Este guia contém:
- Configuração do Supabase
- Setup de variáveis de ambiente
- Deploy e build
- Testes e validação

### Deploy em Produção

Para mantenedores que precisam fazer deploy do sistema:

📖 **[Guia de Deploy em Produção](./PRODUCTION_DEPLOYMENT.md)**

Este guia contém:
- Setup do Supabase para produção
- Configuração na Vercel
- Variáveis de ambiente em produção
- Monitoramento e manutenção

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

### Para Todos os Usuários
- ✅ **Interface intuitiva** e responsiva
- ✅ **Sincronização em tempo real** entre dispositivos
- ✅ **Sem instalação** - funciona direto no navegador
- ✅ **Multi-plataforma** - computador, tablet ou celular

### Para Jogadores (sem necessidade de conta)
- ✅ **Acesso por código** - Entre na mesa com código de 4 caracteres
- ✅ Gerenciamento de fichas virtuais
- ✅ Controle de apostas (fold, check, call, raise)
- ✅ Visualização do pot em tempo real
- ✅ Suporte para heads-up (2 jogadores) e multi-jogador (3+)

### Para Dealers (código Dxxx)
- ✅ Iniciar e controlar mãos
- ✅ Lógica completa do dealer (botão, blinds, ordem de ação)
- ✅ Distribuir potes (incluindo side pots automáticos)
- ✅ Gerenciar rodadas de apostas
- ✅ Controlar all-ins e situações especiais

### Para Organizadores (com conta)
- ✅ **Criar conta facilmente** - apenas username e senha
- ✅ **Gerenciamento de torneios** - seus torneios são privados
- ✅ Criar e editar torneios
- ✅ Registrar jogadores e gerar códigos
- ✅ **Sincronização automática** entre seus dispositivos
- ✅ Modo TV para transmissão
- ✅ Acompanhamento em tempo real

## 🔐 Sistema de Acesso

### Modo Simples (Jogadores e Dealers)

**Não precisa criar conta!** Veja [USER_GUIDE.md](./USER_GUIDE.md) para detalhes completos.

**Jogadores:**
- Receba código de 4 caracteres (ex: `AB12`)
- Digite o código na tela inicial
- Entre na mesa e jogue!

**Dealers:**
- Receba código de dealer (ex: `DABC`)
- Digite o código na tela inicial
- Controle a mesa!

### Modo Administrativo (Organizadores)

**Para criar e gerenciar torneios:**

1. **Acesse o site** e clique em "Modo Administrativo"
2. **Primeira vez:**
   - Clique em "Criar Conta"
   - Escolha um username
   - Defina uma senha segura
   - Pronto! Você já está logado
3. **Próximas vezes:**
   - Use suas credenciais para fazer login
   - Seus torneios aparecem automaticamente
4. **Sincronização automática:**
   - Acesse de qualquer dispositivo
   - Mudanças aparecem em tempo real em todos os seus dispositivos

### 🔒 Privacidade e Segurança

- Cada organizador vê **apenas seus próprios torneios**
- Jogadores e dealers só acessam mesas com código válido
- Dados isolados no nível do banco de dados
- Senhas criptografadas
- Sessões expiram automaticamente após 30 dias

## 🧪 Testes

O sistema inclui ambiente completo de testes para cenários de poker.

📖 **[Documentação de Testes - Para Desenvolvedores](./DEVELOPER_SETUP.md#testing)**

## 📁 Estrutura do Projeto

```
├── components/          # Componentes React
├── services/           # Lógica de negócio e serviços
├── utils/              # Utilitários e lógica de jogo
├── docs/               # Documentação técnica
├── USER_GUIDE.md       # Guia para usuários finais
├── DEVELOPER_SETUP.md  # Guia para desenvolvedores
├── README.md           # Este arquivo
└── package.json        # Dependências e scripts
```

📖 **[Guia para Desenvolvedores](./DEVELOPER_SETUP.md)** - Setup completo do ambiente

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 👤 Autor

**finnb0y**
- GitHub: [@finnb0y](https://github.com/finnb0y)

---

## 📚 Documentação Adicional

### Para Usuários
- **[USER_GUIDE.md](./USER_GUIDE.md)** - Guia completo para usuários finais
- **[CODIGO_ACESSO.md](./CODIGO_ACESSO.md)** - Sistema de códigos de acesso

### Para Desenvolvedores e Mantenedores
- **[DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md)** - Setup e configuração para desenvolvedores
- **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** - Guia de deploy em produção
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - Configuração de variáveis de ambiente

---

Feito com ♠️ por finnb0y
