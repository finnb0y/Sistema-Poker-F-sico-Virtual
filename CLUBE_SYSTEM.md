# Sistema de Clubes - Documentação

## Visão Geral

O sistema de clubes foi implementado para permitir que usuários organizem e gerenciem torneios de poker de forma mais estruturada e modular. Cada clube funciona como uma organização independente com suas próprias configurações, torneios e gerentes.

## Estrutura do Sistema

### 1. Componentes Principais

#### Clube (Club)
- **ID único**: Identificador UUID gerado pelo banco de dados
- **Nome**: Nome do clube (mínimo 3 caracteres)
- **Proprietário**: Referência ao usuário criador (owner_user_id)
- **Foto de Perfil**: URL opcional para imagem de perfil
- **Banner**: URL opcional para imagem de banner
- **Descrição**: Texto descritivo opcional
- **Datas**: created_at e updated_at

#### Gerente de Clube (ClubManager)
- **ID único**: Identificador UUID
- **Clube**: Referência ao clube (club_id)
- **Usuário**: Username único dentro do clube
- **Senha**: Hash SHA-256 (⚠️ usar bcrypt em produção)
- **Permissões**: Limitadas - não podem alterar configurações do clube

### 2. Fluxo de Usuários

#### Para Jogadores e Dealers (Sem Conta)
1. **Tela Inicial**: Escolher "ENTRAR EM UM CLUBE" ou "Modo Administrativo"
2. **Seleção de Clube**: 
   - Buscar clubes pelo nome
   - Visualizar clubes disponíveis
3. **Entrada com Código**:
   - Inserir código de 4 caracteres (jogador) ou código D (dealer)
   - Visualizar banner do clube selecionado
   - Opção "Entrar como Gerente"

#### Para Proprietários de Clubes
1. **Login Administrativo**: Fazer login com conta de usuário
2. **Gerenciamento**: Acessar a aba "Clubes"
3. **Criar Clubes**: Através da tela de seleção de clubes
4. **Criar Torneios**: Torneios são automaticamente associados ao clube ativo
5. **Visualizar Estatísticas**: Ver número de torneios e mesas por clube

#### Para Gerentes
1. **Seleção de Clube**: Escolher o clube na tela de seleção
2. **Entrada com Código**: Na tela de código, clicar em "Entrar como Gerente"
3. **Login**: Inserir credenciais de gerente
4. **Gerenciamento Limitado**:
   - Criar e gerenciar torneios do clube
   - Registrar jogadores
   - Gerenciar mesas
   - **Não podem**: Alterar configurações do clube, criar outros gerentes

## Estrutura do Banco de Dados

### Tabela: poker_clubs
```sql
CREATE TABLE poker_clubs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_user_id UUID REFERENCES poker_users(id),
  profile_photo_url TEXT,
  banner_url TEXT,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Tabela: poker_club_managers
```sql
CREATE TABLE poker_club_managers (
  id UUID PRIMARY KEY,
  club_id UUID REFERENCES poker_clubs(id),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP,
  UNIQUE(club_id, username)
);
```

### Tabela: poker_club_manager_sessions
```sql
CREATE TABLE poker_club_manager_sessions (
  id UUID PRIMARY KEY,
  manager_id UUID REFERENCES poker_club_managers(id),
  session_token TEXT UNIQUE,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

## Implementação Técnica

### Services

#### clubService.ts
Responsável por todas as operações relacionadas a clubes:
- `createClub`: Criar novo clube
- `getClubsByOwner`: Listar clubes de um proprietário
- `searchClubs`: Buscar clubes por nome
- `getClubById`: Obter detalhes de um clube
- `updateClub`: Atualizar informações do clube
- `deleteClub`: Deletar clube e todos os dados associados
- `createManager`: Criar gerente para um clube
- `managerLogin`: Autenticar gerente
- `getCurrentManagerSession`: Validar sessão de gerente
- `managerLogout`: Encerrar sessão de gerente
- `getClubManagers`: Listar gerentes de um clube
- `deleteManager`: Remover gerente

### Components

#### ClubSelection.tsx
Componente para seleção/criação de clubes:
- Busca de clubes
- Listagem de clubes do usuário
- Formulário de criação de clube
- Navegação para tela de código

#### ClubCodeEntry.tsx
Tela de entrada de código com branding do clube:
- Exibição de banner do clube
- Entrada de código de acesso
- Botão "Entrar como Gerente"
- Informações do clube (nome, descrição, foto)

#### ManagerLogin.tsx
Formulário de autenticação para gerentes:
- Input de username e senha
- Validação de credenciais
- Criação de sessão de gerente

### State Management

#### GameState
```typescript
interface GameState {
  clubs: Club[];
  activeClubId: string | null;
  tournaments: Tournament[]; // incluem clubId
  // ... outros campos
}
```

#### Actions
- `CREATE_CLUB`: Adicionar clube ao estado
- `UPDATE_CLUB`: Atualizar informações do clube
- `DELETE_CLUB`: Remover clube e torneios associados
- `SET_ACTIVE_CLUB`: Definir clube ativo

## Fluxo de Dados

### Criação de Clube
1. Usuário preenche formulário em ClubSelection
2. clubService.createClub → Supabase
3. Banco cria registro em poker_clubs
4. Retorna clube criado
5. Adiciona ao estado local via CREATE_CLUB action
6. syncService persiste estado

### Login de Gerente
1. Gerente seleciona clube
2. Clica "Entrar como Gerente"
3. Insere credenciais
4. clubService.managerLogin valida no Supabase
5. Cria sessão em poker_club_manager_sessions
6. Retorna ClubManagerSession
7. App carrega estado do proprietário do clube
8. Gerente tem acesso com flag isManager=true

### Associação de Torneios
1. Quando CREATE_TOURNAMENT é disparado
2. Sistema verifica activeClubId
3. Associa torneio ao clube ativo
4. Torneio fica visível apenas para usuários desse clube

## Segurança

### Row Level Security (RLS)
- Todos os dados têm políticas RLS habilitadas
- Clubes são visíveis para todos (busca pública)
- Game states são isolados por user_id
- Managers não podem modificar configurações de clubes

### Autenticação
- Proprietários: Autenticação completa via poker_users
- Gerentes: Autenticação separada via poker_club_managers
- Sessões expiram após 30 dias
- Tokens únicos e seguros

### Limitações Atuais
⚠️ **IMPORTANTE**: SHA-256 não é seguro para produção!
- Usar bcrypt, argon2 ou PBKDF2
- Implementar salt automático
- Adicionar rate limiting
- Considerar 2FA para proprietários

## Casos de Uso

### 1. Clube de Poker Local
- Proprietário cria clube "Poker Club São Paulo"
- Adiciona banner com logo do clube
- Cria gerente "joao_admin"
- Gerente gerencia torneios semanais
- Jogadores acessam via código do torneio

### 2. Rede de Clubes
- Proprietário possui múltiplos clubes
- Cada clube tem seu próprio gerente
- Torneios isolados por clube
- Estatísticas separadas

### 3. Torneio Privado
- Clube criado para evento específico
- Apenas participantes conhecem o nome do clube
- Acesso via código de mesa
- Após evento, clube pode ser arquivado

## Migrações e Setup

### Ordem de Execução SQL
1. `supabase-setup.sql` - Tabelas básicas
2. `supabase-auth-migration.sql` - Sistema de usuários
3. `supabase-clubs-migration.sql` - Sistema de clubes

### Estado Migração
O sistema inclui lógica de migração automática:
- Verifica se `clubs` existe no GameState
- Adiciona campos vazios se não existir
- Carrega clubes do banco em syncService.loadState
- Compatível com estados antigos

## Próximos Passos / Melhorias

### Funcionalidades
- [ ] Upload real de fotos (integration com storage)
- [ ] Permissões granulares para gerentes
- [ ] Convites para gerentes via email
- [ ] Histórico de torneios por clube
- [ ] Rankings e estatísticas de clubes
- [ ] Modo privado/público para clubes

### Segurança
- [ ] Migrar para bcrypt/argon2
- [ ] Rate limiting em logins
- [ ] Logs de auditoria
- [ ] 2FA opcional
- [ ] Recuperação de senha

### UX
- [ ] Paginação na busca de clubes
- [ ] Filtros avançados
- [ ] Notificações de eventos
- [ ] Dashboard de analytics
- [ ] Temas personalizados por clube

## Referências

- [Documentação Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Bcrypt vs Argon2](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [React Best Practices](https://react.dev/learn)
