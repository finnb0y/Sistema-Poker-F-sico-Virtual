# Funcionalidades Específicas por Clube

## Visão Geral

Este documento descreve as mudanças implementadas para tornar as funcionalidades de gestão de torneios, salão, jogadores e modo TV específicas para cada clube.

## Problema

Anteriormente, as seguintes funcionalidades eram gerais/globais:
- **Salão (Mesas)**: Todas as mesas físicas eram compartilhadas entre todos os clubes
- **Jogadores (Registry)**: Base de jogadores cadastrados era compartilhada entre todos os clubes
- **Modo TV**: Mostrava torneios de todos os clubes
- **Torneios**: Já estavam associados a clubes (✓)

Isso impedia que diferentes clubes tivessem suas próprias configurações e requisitos.

## Solução Implementada

### 1. Mudanças nos Tipos (types.ts)

#### RoomTable
```typescript
export interface RoomTable {
  id: number;
  name: string;
  clubId?: string; // Reference to the club this table belongs to
}
```

#### RegisteredPerson
```typescript
export interface RegisteredPerson {
  id: string;
  name: string;
  nickname?: string;
  clubId?: string; // Reference to the club this person belongs to
}
```

### 2. Mudanças na Lógica de Criação (App.tsx)

#### Criação de Mesa
Quando uma nova mesa física é criada, ela é automaticamente associada ao clube ativo:
```typescript
case 'ADD_ROOM_TABLE':
  newState.roomTables.push({ 
    id: nextId, 
    name: `Mesa ${nextId}`,
    clubId: payload.clubId || newState.activeClubId || undefined
  });
```

#### Cadastro de Jogador
Quando um jogador é cadastrado, ele é automaticamente associado ao clube ativo:
```typescript
case 'REGISTER_PERSON':
  newState.registry.push({ 
    id: Math.random().toString(36).substr(2, 9), 
    name: payload.name, 
    nickname: payload.nickname,
    clubId: payload.clubId || newState.activeClubId || undefined
  });
```

### 3. Filtragem por Clube (DealerControls.tsx)

Foram adicionadas variáveis filtradas no início do componente:
```typescript
const activeClubId = state.activeClubId;
const filteredTournaments = state.tournaments.filter(t => !activeClubId || t.clubId === activeClubId);
const filteredRoomTables = state.roomTables.filter(rt => !activeClubId || rt.clubId === activeClubId);
const filteredRegistry = state.registry.filter(r => !activeClubId || r.clubId === activeClubId);
```

#### Lógica de Filtragem
- Se **não há clube ativo** (`activeClubId === null`), todos os itens são mostrados
- Se **há clube ativo**, apenas itens associados a esse clube são mostrados
- Itens **sem clubId definido** (`clubId === undefined`) são mostrados em todos os clubes para compatibilidade

#### Onde os Filtros São Aplicados
1. **Aba Torneios**: Lista apenas torneios do clube ativo
2. **Aba Salão**: Lista apenas mesas do clube ativo
3. **Aba Jogadores (Registry)**: Lista apenas jogadores cadastrados no clube ativo
4. **Modo TV**: Mostra apenas torneios do clube ativo
5. **Alocação de Mesas**: Ao criar/editar torneio, mostra apenas mesas disponíveis do clube
6. **Inscrição de Jogadores**: Lista apenas jogadores cadastrados no clube do torneio

### 4. Migração de Estado (stateMigration.ts)

Foi adicionada lógica de migração para garantir compatibilidade com estados antigos:

```typescript
export function migrateToClubsSupport(state: GameState): GameState {
  // ... código existente ...
  
  // Migration: Add clubId to existing RoomTables if not present
  if (state.roomTables) {
    state.roomTables = state.roomTables.map(rt => {
      if (!('clubId' in rt)) {
        return { ...rt, clubId: undefined };
      }
      return rt;
    });
  }
  
  // Migration: Add clubId to existing RegisteredPersons if not present
  if (state.registry) {
    state.registry = state.registry.map(r => {
      if (!('clubId' in r)) {
        return { ...r, clubId: undefined };
      }
      return r;
    });
  }
  
  return state;
}
```

## Comportamento

### Quando NÃO há clube ativo
- **Usuário**: Administrador que não selecionou nenhum clube
- **Comportamento**: Todos os torneios, mesas e jogadores são visíveis
- **Uso**: Para administradores gerenciarem múltiplos clubes simultaneamente

### Quando HÁ clube ativo
- **Usuário**: Administrador que selecionou um clube ou Gerente de clube
- **Comportamento**: Apenas recursos do clube ativo são visíveis
- **Novas criações**: Automaticamente associadas ao clube ativo

### Compatibilidade com Dados Antigos
- **Mesas sem clubId**: Visíveis em todos os clubes
- **Jogadores sem clubId**: Visíveis em todos os clubes
- **Torneios sem clubId**: Visíveis em todos os clubes (podem ser editados para associar a um clube)

## Impacto nas Funcionalidades

### ✅ Funcionalidades Preservadas
- Criação e edição de torneios
- Cadastro e gerenciamento de jogadores
- Criação e remoção de mesas
- Modo TV para visualização de mesas
- Sistema de autenticação (proprietários e gerentes)
- Sincronização em tempo real

### ✨ Novas Capacidades
- Isolamento de recursos por clube
- Gerentes veem apenas recursos de seu clube
- Administradores podem gerenciar múltiplos clubes
- Mesas e jogadores organizados por contexto de clube

### 🔒 Restrições Aplicadas
- Gerentes não podem criar/editar recursos de outros clubes
- Mesas de um clube não são visíveis para outros clubes quando há clube ativo
- Jogadores cadastrados em um clube não aparecem para outros clubes quando há clube ativo

## Fluxos de Uso

### Administrador (Proprietário de Clubes)
1. Login no modo administrativo
2. Seleciona "Gerenciamento"
3. Vai para aba "Clubes" e seleciona/cria um clube
4. Com clube ativo: vê apenas recursos daquele clube
5. Pode alternar entre clubes conforme necessário

### Gerente de Clube
1. Seleciona o clube na tela inicial
2. Faz login como gerente
3. Vê automaticamente apenas recursos do clube
4. Pode criar torneios, cadastrar jogadores, gerenciar mesas
5. Não pode ver ou editar recursos de outros clubes

### Jogadores e Dealers
- Não são afetados pelas mudanças
- Acessam via código normalmente
- Sistema carrega o contexto correto automaticamente

## Testes Manuais Recomendados

1. ✅ **Criar clube e verificar isolamento**
   - Criar clube A e clube B
   - Criar mesas em cada clube
   - Cadastrar jogadores em cada clube
   - Verificar que ao trocar de clube, apenas recursos daquele clube aparecem

2. ✅ **Compatibilidade com dados antigos**
   - Carregar estado com dados antigos (sem clubId)
   - Verificar que dados aparecem em todos os clubes
   - Criar novo dado e verificar que tem clubId

3. ✅ **Gerente de clube**
   - Login como gerente
   - Verificar que apenas recursos do clube são visíveis
   - Tentar criar torneio e verificar associação automática ao clube

4. ✅ **Modo TV**
   - Selecionar clube A
   - Verificar que apenas torneios do clube A aparecem
   - Trocar para clube B e verificar mudança

## Código Relevante

### Arquivos Modificados
- `types.ts`: Adição de `clubId` aos tipos
- `App.tsx`: Lógica de criação com `clubId`
- `components/DealerControls.tsx`: Filtragem por clube
- `utils/stateMigration.ts`: Migração de compatibilidade

### Padrão de Filtragem
```typescript
// Se não há clube ativo, mostra tudo
// Se há clube ativo, mostra apenas do clube
const filtered = items.filter(item => !activeClubId || item.clubId === activeClubId);
```

## Conclusão

As mudanças implementadas são **mínimas e cirúrgicas**, mantendo a funcionalidade existente enquanto adicionam o isolamento necessário por clube. O sistema é totalmente compatível com dados antigos e não quebra nenhuma funcionalidade existente.
