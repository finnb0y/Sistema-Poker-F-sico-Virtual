# Ambiente de Testes Modular para Cenários de Mesa de Poker

Este ambiente de testes foi criado para facilitar a identificação de bugs e validação de comportamentos em diferentes cenários de poker.

## 📋 Visão Geral

O ambiente de testes modular permite:
- ✅ Criar cenários personalizados de mesas de poker rapidamente
- ✅ Simular dinâmicas complexas (all-ins múltiplos, potes paralelos, etc.)
- ✅ Capturar logs detalhados de cada ação automaticamente
- ✅ Validar automaticamente comportamentos esperados vs. reais
- ✅ Detectar e reportar bugs de forma clara e objetiva

## 🚀 Como Executar

### Requisitos
- Node.js 16+
- npm

### Instalação
```bash
# Se tsx não estiver instalado
npm install --save-dev tsx
```

### Executar Testes
```bash
# Executar todos os testes
npx tsx utils/pokerTestEnvironment.test.ts

# Executar um teste específico (modificar o arquivo primeiro)
npx tsx utils/pokerTestEnvironment.test.ts
```

## 📁 Estrutura dos Arquivos

### 1. `testScenarioBuilder.ts`
Módulo para criar cenários de teste personalizados.

**Funções principais:**
- `createTestPlayer()` - Cria um jogador com configuração customizada
- `createTestPlayers()` - Cria múltiplos jogadores rapidamente
- `createTestTableState()` - Cria estado da mesa configurável
- `createTestTournament()` - Cria configuração de torneio

**Cenários pré-configurados:**
- `createRebuyTournamentScenario()` - Torneio com recompra (6 jogadores)
- `createMultipleAllInScenario()` - Múltiplos all-ins com potes paralelos
- `createHeadsUpAllInScenario()` - Heads-up com all-in

### 2. `testActionLogger.ts`
Sistema de logging e validação de ações.

**Classe TestLogger:**
- `info()` - Log informativo
- `action()` - Log de ação de jogador
- `validate()` - Valida expectativa vs. realidade
- `bug()` - Reporta bug encontrado
- `printLogs()` - Imprime todos os logs formatados
- `getSummary()` - Retorna estatísticas do teste

**Funções de validação:**
- `validatePlayerCanAct()` - Valida se jogador pode agir
- `validateAvailableActions()` - Valida ações disponíveis
- `validatePotAmount()` - Valida valor do pote
- `validateSidePots()` - Valida cálculo de potes paralelos
- `simulateBettingRound()` - Simula rodada de apostas com logs

### 3. `pokerTestEnvironment.test.ts`
Suite de testes completa com 6 cenários.

**Testes implementados:**
1. **Rebuy Tournament Scenario** - Cenário do problema original
2. **Multiple All-In with Side Pots** - Validação de potes paralelos
3. **Heads-Up All-In** - Teste heads-up
4. **River Check Bug Detection** - Detecção específica do bug do river
5. **Multiple All-Ins Across Rounds** - All-ins em diferentes rodadas
6. **Side Pot Distribution** - Distribuição correta de potes

## 🎯 Casos de Uso

### Criar um Novo Cenário de Teste

```typescript
import { createTestPlayers, createTestTableState } from './testScenarioBuilder';
import { TestLogger, simulateBettingRound } from './testActionLogger';

function meuNovoTeste() {
  const logger = new TestLogger();
  
  // Criar jogadores
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'João',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 1,
      currentBet: 100
    },
    {
      id: 'p2',
      name: 'Maria',
      balance: 3000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 2,
      currentBet: 100
    }
  ]);
  
  // Criar estado da mesa
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'test',
    pot: 200,
    currentBet: 100,
    bettingRound: BettingRound.FLOP
  });
  
  // Simular e validar
  simulateBettingRound(logger, players, tableState, 'Meu Cenário');
  
  // Imprimir logs
  logger.printLogs();
}
```

### Validar Ações Disponíveis

```typescript
import { validateAvailableActions } from './testActionLogger';

// Validar que jogador pode CHECK, BET ou FOLD
validateAvailableActions(
  logger,
  player,
  tableState,
  ['CHECK', 'BET', 'FOLD']
);
```

### Validar Potes Paralelos

```typescript
import { validateSidePots } from './testActionLogger';
import { preparePlayerBetsForPotCalculation, calculateSidePots } from './sidePotLogic';

// Validar que há 3 potes (1 principal + 2 paralelos)
validateSidePots(
  logger, 
  players, 
  tableState, 
  3,
  calculateSidePots,
  preparePlayerBetsForPotCalculation
);
```

## 🐛 Detecção de Bugs

O sistema automaticamente detecta e reporta bugs comuns:

### Bug 1: Check não disponível no river
```
🐛 BUG: On river, Player X should be able to CHECK (matched current bet), 
but CHECK not available
Details: {
  playerCurrentBet: 15000,
  tableCurrentBet: 15000,
  availableActions: ['BET', 'FOLD']  // CHECK está faltando!
}
```

### Bug 2: Distribuição incorreta de potes
```
🐛 BUG: Incorrect side pot calculation
Details: {
  expectedPotCount: 3,
  actualPotCount: 2,
  pots: [...]
}
```

### Bug 3: Jogador não pode agir quando deveria
```
🐛 BUG: Incorrect available actions for Player X
Details: {
  playerStatus: 'ACTIVE',
  playerBalance: 5000,
  playerCurrentBet: 0,
  tableCurrentBet: 1000
}
```

## 📊 Saída dos Testes

### Exemplo de Log Detalhado
```
================================================================================
TEST EXECUTION LOG
================================================================================

ℹ️ Scenario: 6-player rebuy tournament
ℹ️ --- Rebuy Tournament - River Action ---
ℹ️ Betting Round: RIVER
ℹ️ Current Bet: 10000
ℹ️ Pot: 35300

ℹ️ Player States:
ℹ️   Player 1 (ALL_IN): 0 chips, bet 10000, total contributed 10000
ℹ️   Player 2 (ALL_IN): 0 chips, bet 5000, total contributed 5000
ℹ️   Player 5 (ACTIVE): 5000 chips, bet 10000, total contributed 10000
ℹ️   Player 6 (ACTIVE): 5000 chips, bet 10000, total contributed 10000

ℹ️ Validating Available Actions:
ℹ️   Player 5: FOLD, CHECK, BET
ℹ️   Player 6: FOLD, CHECK, BET

✅ ✓ Available actions for Player 5
✅ ✓ Available actions for Player 6
✅ ✓ Pot amount is correct

ℹ️ Side pots calculated: 2 pots
ℹ️   Pot 1: 20000 chips, eligible players: p1, p2, p5, p6
ℹ️   Pot 2: 15300 chips, eligible players: p1, p5, p6

✅ ✓ Correct number of pots (2 expected)

================================================================================
SUMMARY
================================================================================
Total Logs: 22
Validations: 4/4 passed
Bugs Found: 0
================================================================================
```

### Exemplo de Sumário Final
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                            FINAL TEST SUMMARY                                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝
Total Tests: 6
✅ Passed: 6
❌ Failed: 0

🎉 All tests passed successfully!
```

## 🔧 Configurações Personalizáveis

### Configurar Jogadores
```typescript
{
  id: string;              // ID único do jogador
  name: string;            // Nome para exibição
  balance: number;         // Fichas disponíveis
  status?: PlayerStatus;   // ACTIVE, ALL_IN, FOLDED, OUT
  seatNumber: number;      // Posição na mesa (1-9)
  currentBet?: number;     // Aposta atual na rodada
  totalContributedThisHand?: number;  // Total contribuído na mão
  rebuysCount?: number;    // Número de recompras
}
```

### Configurar Mesa
```typescript
{
  id: number;                    // ID da mesa
  tournamentId: string;          // ID do torneio
  pot?: number;                  // Valor total no pote
  currentBet?: number;           // Aposta atual a igualar
  bettingRound?: BettingRound;   // PRE_FLOP, FLOP, TURN, RIVER
  dealerButtonPosition?: number; // Posição do dealer button
  currentBlindLevel?: number;    // Nível atual de blinds
  handInProgress?: boolean;      // Mão em progresso
}
```

### Configurar Torneio
```typescript
{
  id: string;              // ID do torneio
  name: string;            // Nome do torneio
  buyInChips?: number;     // Fichas do buy-in (padrão: 10000)
  rebuyEnabled?: boolean;  // Recompra habilitada (padrão: true)
  rebuyChips?: number;     // Fichas da recompra (padrão: 10000)
  maxSeats?: number;       // Máximo de lugares (padrão: 9)
  smallBlind?: number;     // Small blind (padrão: 50)
  bigBlind?: number;       // Big blind (padrão: 100)
}
```

## 📝 Adicionando Novos Testes

1. Crie um novo cenário em `testScenarioBuilder.ts` (opcional)
2. Escreva a função de teste em `pokerTestEnvironment.test.ts`
3. Use `TestLogger` para capturar logs e validações
4. Adicione validações específicas usando funções de `testActionLogger.ts`
5. Execute o teste e revise os logs

### Template de Novo Teste
```typescript
function testMeuNovoScenario() {
  const logger = new TestLogger();
  
  // 1. Criar cenário
  const players = createTestPlayers([...]);
  const tableState = createTestTableState({...});
  
  // 2. Descrever cenário
  logger.info('Scenario: Descrição do cenário');
  
  // 3. Simular rodada
  simulateBettingRound(logger, players, tableState, 'Nome do Teste');
  
  // 4. Validações específicas
  validateAvailableActions(logger, player, tableState, expectedActions);
  validatePotAmount(logger, actualPot, expectedPot);
  
  // 5. Imprimir logs
  logger.printLogs();
  
  // 6. Verificar erros
  const summary = logger.getSummary();
  if (summary.bugsFound > 0 || summary.failedValidations > 0) {
    throw new Error(`Found ${summary.bugsFound} bugs`);
  }
}

// Adicionar ao runner
runTest('Meu Novo Cenário', testMeuNovoScenario);
```

## 🎓 Cenários de Exemplo Incluídos

### 1. Torneio com Recompra (Problema Original)
- 6 jogadores
- 2 all-in (valores diferentes)
- 2 folds
- 2 ativos no river
- Valida: Ações de CHECK disponíveis no river

### 2. Múltiplos All-Ins
- 4 jogadores
- 3 all-in (stacks diferentes)
- 1 ativo
- Valida: Cálculo correto de 3 potes

### 3. Heads-Up All-In
- 2 jogadores
- 1 all-in
- 1 deve decidir
- Valida: Ações CALL/FOLD/RAISE disponíveis

### 4. Bug do River Check
- Teste específico do bug mencionado
- Valida: CHECK disponível quando aposta está igualada

### 5. All-Ins em Múltiplas Rodadas
- 5 jogadores
- All-ins em pré-flop, flop e turn
- 2 ativos no river
- Valida: Múltiplos potes e ações corretas

### 6. Distribuição de Potes
- 3 jogadores all-in
- Stacks: 2000, 5000, 10000
- Valida: Valores exatos de cada pote

## 🔍 Troubleshooting

### Erro: "require is not defined"
**Solução:** Certifique-se de usar imports ES6 em vez de require.

### Teste falha com validação incorreta
**Solução:** Verifique se a lógica esperada está correta. O teste pode estar identificando um bug real.

### Logs não aparecem
**Solução:** Certifique-se de chamar `logger.printLogs()` ao final do teste.

## 🤝 Contribuindo

Para adicionar novos cenários de teste:
1. Identifique o bug ou comportamento a testar
2. Crie um cenário que reproduza o problema
3. Adicione validações para detectar o bug
4. Execute e documente os resultados

## 📚 Referências

- Tipos principais: `types.ts`
- Lógica de potes paralelos: `sidePotLogic.ts`
- Lógica de ações de jogadores: `playerActionLogic.ts`
- Lógica do dealer: `dealerLogic.ts`

---

**Desenvolvido para facilitar a identificação e correção de bugs no Sistema de Poker Físico-Virtual**
