# 🎯 Sistema de Acesso por Códigos

## 📋 Visão Geral

O sistema agora suporta dois tipos de códigos para acesso simplificado às mesas, sem necessidade de criar conta:

1. **Código de Jogador**: Permite entrar na mesa como jogador
2. **Código de Dealer**: Permite entrar na mesa como dealer com controles especiais

## 🎮 Como Funciona

### Interface Inicial

Quando você abre o aplicativo, verá uma tela simples solicitando um código:

```
┌─────────────────────────────────┐
│        POKER 2                  │
│  Entre com o código da mesa     │
│                                 │
│     [____________________]      │
│                                 │
│     [    ENTRAR    ]            │
│                                 │
│  [ Modo Administrativo ]        │
└─────────────────────────────────┘
```

### Tipos de Acesso

#### 1. Acesso como Jogador 🃏

**Formato do código**: 4 caracteres alfanuméricos (ex: `AB12`, `XY9Z`)

**Como obter**:
- O administrador do torneio cria sua inscrição
- Você recebe um código único de 4 caracteres
- Este código está vinculado ao seu nome e fichas

**O que você pode fazer**:
- Ver suas fichas
- Fazer apostas (bet, raise, call, check, fold)
- Ver o pot e status da mesa
- Ver outros jogadores

**O que você NÃO pode fazer**:
- Iniciar mãos
- Controlar o dealer button
- Gerenciar outros jogadores
- Criar torneios

#### 2. Acesso como Dealer 🎰

**Formato do código**: Começa com 'D' seguido de 3 caracteres (ex: `DABC`, `D12X`)

**Como obter**:
- O administrador cria uma mesa no torneio
- Cada mesa recebe automaticamente um código de dealer único
- O código é exibido no painel administrativo

**O que você pode fazer**:
- Iniciar mãos (start hand)
- Mover o dealer button
- Avançar rodadas de apostas
- Distribuir potes aos vencedores
- Ver todas as ações e histórico

**O que você NÃO pode fazer**:
- Criar ou editar torneios
- Gerenciar jogadores
- Ver outras mesas

#### 3. Modo Administrativo 👑

**Acesso**: Clique no botão "Modo Administrativo" na tela inicial

**Requisito**: Precisa ter Supabase configurado e uma conta administrativa

**O que você pode fazer**:
- Criar e editar torneios
- Gerenciar estrutura de blinds
- Registrar jogadores
- Ver todas as mesas simultaneamente
- Acessar modo TV para transmissão
- Ver códigos de jogadores e dealers

## 🔐 Segurança

### Códigos de Jogador
- Únicos por jogador
- Vinculados ao nome do jogador
- Não podem ser reutilizados em outros torneios

### Códigos de Dealer
- Únicos por mesa
- Permitem controle total da mesa específica
- Não dão acesso a outras mesas ou funções administrativas

### Modo Administrativo
- Requer autenticação completa
- Dados isolados por usuário (cada admin só vê seus torneios)
- Sessões expiram após 30 dias
- Requer Supabase configurado

## 📱 Fluxo de Uso Típico

### Para Jogadores

1. Chegue ao local do torneio
2. Abra o aplicativo no seu celular
3. Digite o código que recebeu (4 caracteres)
4. Clique em "ENTRAR"
5. Você será redirecionado para sua interface de jogador
6. Veja suas fichas e jogue normalmente

### Para Dealers

1. Receba o código da mesa do organizador (formato Dxxx)
2. Abra o aplicativo
3. Digite o código de dealer
4. Clique em "ENTRAR"
5. Você será redirecionado para a interface de dealer daquela mesa
6. Controle a mesa durante o torneio

### Para Administradores

1. Clique em "Modo Administrativo"
2. Faça login (ou crie uma conta se for a primeira vez)
3. Crie seu torneio
4. Registre os jogadores
5. Distribua os códigos:
   - Código de 4 caracteres para cada jogador
   - Código de dealer (Dxxx) para o dealer de cada mesa
6. Monitore o torneio pelo painel administrativo

## 🎯 Exemplos Práticos

### Exemplo 1: Torneio Caseiro

**Setup**:
- Torneio com 8 jogadores em 1 mesa
- Admin: João
- Dealer: Maria
- Jogadores: Pedro, Ana, Carlos, etc.

**Passos**:

1. João (admin) acessa o "Modo Administrativo" e cria o torneio
2. João registra os 8 jogadores no sistema
3. Sistema gera códigos:
   - Jogadores: `AB12`, `CD34`, `EF56`, `GH78`, etc.
   - Dealer da Mesa 1: `DABC`

4. João distribui os códigos:
   - Envia via WhatsApp para cada jogador
   - Passa o código `DABC` para Maria (dealer)

5. Cada um acessa:
   - Pedro digita `AB12` → vê sua interface de jogador
   - Maria digita `DABC` → vê interface de dealer da Mesa 1
   - João permanece no painel admin monitorando

### Exemplo 2: Torneio Profissional

**Setup**:
- Torneio com 50 jogadores em 5 mesas
- Admin: Organizador
- 5 dealers (1 por mesa)

**Processo**:

1. Organizador cria torneio com 5 mesas
2. Sistema gera automaticamente:
   - 50 códigos de jogador únicos
   - 5 códigos de dealer (um por mesa):
     - Mesa 1: `DXYZ`
     - Mesa 2: `DABC`
     - Mesa 3: `DDEF`
     - Mesa 4: `DGHI`
     - Mesa 5: `DJKL`

3. No painel admin, organizador vê todos os códigos
4. Imprime ou envia códigos para cada participante
5. Cada dealer recebe seu código específico
6. Durante o torneio:
   - Jogadores entram com seus códigos
   - Dealers controlam suas mesas específicas
   - Admin monitora tudo pelo painel

## ⚠️ Observações Importantes

### Sem Supabase Configurado

- ✅ Jogadores podem entrar com códigos
- ✅ Dealers podem controlar mesas
- ❌ Modo administrativo não funciona
- ❌ Dados não sincronizam entre dispositivos
- ❌ Torneios não são salvos no servidor

**Recomendação**: Configure o Supabase para usar todas as funcionalidades, especialmente se for gerenciar torneios ou precisar de sincronização.

### Com Supabase Configurado

- ✅ Todas as funcionalidades disponíveis
- ✅ Sincronização em tempo real
- ✅ Dados salvos no servidor
- ✅ Acesso de múltiplos dispositivos
- ✅ Modo administrativo completo

## 🔧 Para Desenvolvedores

### Geração de Códigos

```typescript
// Código de Jogador (4 caracteres aleatórios)
const generateAccessCode = () => 
  Math.random().toString(36).substring(2, 6).toUpperCase();

// Código de Dealer (D + 3 caracteres aleatórios)
const generateDealerCode = () => 
  'D' + Math.random().toString(36).substring(2, 5).toUpperCase();
```

### Validação de Códigos

```typescript
const handleCodeSubmit = (code: string) => {
  // Tenta encontrar jogador
  const player = players.find(p => p.accessCode === code);
  if (player) {
    // Redireciona para PlayerDashboard
    return;
  }
  
  // Tenta encontrar mesa de dealer
  const table = tableStates.find(ts => ts.dealerAccessCode === code);
  if (table) {
    // Redireciona para TableDealerInterface
    return;
  }
  
  // Código inválido
  alert('Código não encontrado');
};
```

### Estrutura de Dados

```typescript
interface Player {
  accessCode: string; // 4 caracteres, ex: "AB12"
  // ... outros campos
}

interface TableState {
  dealerAccessCode?: string; // Formato: "Dxxx"
  // ... outros campos
}
```

## 📚 Referências

- [README.md](./README.md) - Documentação geral do sistema
- [IMPLEMENTACAO_AUTENTICACAO.md](./IMPLEMENTACAO_AUTENTICACAO.md) - Detalhes do sistema de autenticação
- [SETUP_MULTI_USUARIO.md](./SETUP_MULTI_USUARIO.md) - Configuração do Supabase
