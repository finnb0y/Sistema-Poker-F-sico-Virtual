# 🃏 Sistema de Poker Físico-Virtual

Sistema de fichas de poker virtual para unificação de jogos de poker com cartas físicas.

## 📋 Sobre o Projeto

Este projeto permite jogar poker usando cartas físicas reais enquanto gerencia fichas, apostas e o pot de forma virtual através de uma interface web moderna.

## 🚀 Tecnologias

- **React** - Biblioteca para construção da interface
- **TypeScript** - Tipagem estática para JavaScript
- **Vite** - Build tool e dev server ultra-rápido
- **Vercel** - Hospedagem e deploy contínuo

## 💻 Rodando Localmente

### Pré-requisitos

- Node.js 16+ instalado
- npm ou yarn

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

- ✅ Gerenciamento de fichas virtuais
- ✅ Controle de apostas e pot
- ✅ Lógica completa do dealer (botão, blinds, ordem de ação)
- ✅ Suporte para heads-up (2 jogadores) e multi-jogador (3+)
- ✅ Interface intuitiva e responsiva
- ✅ Sincronização em tempo real
- ✅ Suporte para múltiplos jogadores e torneios
- ✅ **Ambiente de testes modular para validação de cenários**

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
