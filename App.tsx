import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Role, GameState, Player, PlayerStatus, ActionMessage, Tournament, RoomTable, RegisteredPerson, TournamentConfig, TableState, BettingRound, BetActionType, Club } from './types';
import { syncService } from './services/syncService';
import { authService, AuthSession, User } from './services/authService';
import { clubService, ClubManagerSession } from './services/clubService';
import { isSupabaseConfigured } from './services/supabaseClient';
import { migrateGameState } from './utils/stateMigration';
import Login from './components/Login';
import ClubSelection from './components/ClubSelection';
import ClubCodeEntry from './components/ClubCodeEntry';
import ManagerLogin from './components/ManagerLogin';
import PlayerDashboard from './components/PlayerDashboard';
import DealerControls from './components/DealerControls';
import TableDealerInterface from './components/TableDealerInterface';
import { calculateDealerPositions, getPostFlopFirstToAct, moveButtonToNextPlayer, getActivePlayers } from './utils/dealerLogic';
import { calculateSidePots, areAllPlayersAllInOrCapped, preparePlayerBetsForPotCalculation } from './utils/sidePotLogic';
import { canPlayerAct } from './utils/playerActionLogic';

const INITIAL_STATE: GameState = {
  roomTables: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Mesa ${i + 1}` })),
  tournaments: [],
  tableStates: [],
  players: [],
  registry: [],
  smallBlind: 50,
  bigBlind: 100,
  activeTournamentId: null,
  clubs: [],
  activeClubId: null
};

const generateAccessCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();
const generateDealerCode = () => 'D' + Math.random().toString(36).substring(2, 5).toUpperCase();

// Debounce delay for state persistence (in milliseconds)
const PERSIST_DEBOUNCE_DELAY = 500;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [managerSession, setManagerSession] = useState<ClubManagerSession | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [tableId, setTableId] = useState<number | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(false);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [syncUserId, setSyncUserId] = useState<string | null>(null); // Track userId for sync subscription
  
  // Club flow states
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showClubSelection, setShowClubSelection] = useState(false);
  const [showManagerLogin, setShowManagerLogin] = useState(false);
  
  // Debounce timer for state persistence to improve performance
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref to the latest gameState for cleanup without causing re-renders
  const gameStateRef = useRef<GameState>(gameState);
  
  // Update gameStateRef whenever gameState changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  // Debounced persist function to reduce database writes
  const debouncedPersistState = useCallback((state: GameState) => {
    // Clear any existing timer
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    
    // Set a new timer to persist after inactivity
    persistTimerRef.current = setTimeout(() => {
      syncService.persistState(state);
      persistTimerRef.current = null;
    }, PERSIST_DEBOUNCE_DELAY);
  }, []);
  
  // Helper function to clear session data (localStorage + state)
  // This prevents black screen when session is invalid
  const clearSessionData = useCallback(() => {
    localStorage.removeItem('poker_current_role');
    localStorage.removeItem('poker_current_player_id');
    localStorage.removeItem('poker_current_table_id');
    localStorage.removeItem('poker_sync_user_id');
    setRole(null);
    setPlayerId(null);
    setTableId(null);
    setSyncUserId(null);
    syncService.setUserId(null);
  }, []);
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setIsLoading(false);
        return;
      }

      try {
        const session = await authService.getCurrentSession();
        if (session) {
          setCurrentUser(session.user);
          // Set user ID in sync service
          syncService.setUserId(session.user.id);
          setSyncUserId(session.user.id);
        } else {
          // Check if there was a previous session that expired
          const hadPreviousRole = localStorage.getItem('poker_current_role');
          const hadPreviousToken = localStorage.getItem('poker_session_token');
          
          // Only clear and log if user had previous session data
          if (hadPreviousRole || hadPreviousToken) {
            // Session is invalid or expired - clear any stale role/player data
            // This prevents the "Cannot subscribe: user not authenticated" error
            console.log('🔄 Sessão inválida ou expirada - limpando dados locais');
            clearSessionData();
            
            // Show message if user had a previous admin session
            if (hadPreviousRole === 'DIRECTOR') {
              setSessionExpiredMessage(true);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        // On error, also clear stale data to prevent black screen
        clearSessionData();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // clearSessionData is stable (useCallback with empty deps), safe to omit
  }, []);

  useEffect(() => {
    const loadInitialState = async () => {
      if (!currentUser) return;

      try {
        const loadedState = await syncService.loadState();
        if (loadedState) {
          // Apply all migrations using centralized migration utility
          const migratedState = migrateGameState(loadedState);
          setGameState(migratedState);
        }
      } catch (error) {
        console.error('Erro ao carregar estado inicial:', error);
      }
    };

    if (currentUser) {
      loadInitialState();
    }
  }, [currentUser]);

  useEffect(() => {
    // Only restore from localStorage after authentication check completes
    // This prevents race conditions where we restore a role but don't have valid auth
    if (isLoading) return;
    
    try {
      const savedRole = localStorage.getItem('poker_current_role');
      const savedPlayerId = localStorage.getItem('poker_current_player_id');
      const savedTableId = localStorage.getItem('poker_current_table_id');
      const savedSyncUserId = localStorage.getItem('poker_sync_user_id');
      
      if (savedRole) setRole(savedRole as Role);
      if (savedPlayerId) setPlayerId(savedPlayerId);
      if (savedTableId) setTableId(parseInt(savedTableId));
      
      // Restore syncUserId for code-based access persistence
      if (savedSyncUserId && !currentUser) {
        // Only restore syncUserId if not logged in as admin
        // This handles page refresh for players/dealers
        syncService.setUserId(savedSyncUserId);
        setSyncUserId(savedSyncUserId);
        
        // Load the tournament state for this user
        syncService.loadStateForUser(savedSyncUserId).then(state => {
          if (state) {
            setGameState(state);
            console.log('✅ Estado do torneio restaurado após refresh');
          }
        }).catch(err => {
          console.error('❌ Erro ao restaurar estado:', err);
        });
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }, [isLoading]);

  const getNextTurnId = (players: Player[], tableId: number, currentId: string | null): string | null => {
    // Only consider players who can still act (not folded, not out, not all-in)
    const tablePlayers = players.filter(p => p.tableId === tableId && canPlayerAct(p));
    if (tablePlayers.length <= 1) return null;
    const sorted = [...tablePlayers].sort((a, b) => a.seatNumber - b.seatNumber);
    const currIdx = sorted.findIndex(p => p.id === currentId);
    
    // If current player was removed (currIdx === -1), find next player after their seat number
    if (currIdx === -1 && currentId) {
      // Try to find the removed player to get their seat number
      const allPlayers = players.filter(p => p.tableId === tableId);
      const removedPlayer = allPlayers.find(p => p.id === currentId);
      if (removedPlayer) {
        // Find next active player after the removed player's seat
        const nextIdx = sorted.findIndex(p => p.seatNumber > removedPlayer.seatNumber);
        return nextIdx !== -1 ? sorted[nextIdx].id : sorted[0].id;
      }
      // If we can't find the removed player, start from the beginning
      return sorted[0].id;
    }
    
    return sorted[(currIdx + 1) % sorted.length].id;
  };

  const getMaxBetAtTable = (players: Player[], tableId: number): number => {
    const tablePlayers = players.filter(p => p.tableId === tableId);
    return Math.max(...tablePlayers.map(p => p.currentBet), 0);
  };

  /**
   * Check if player should be marked as all-in and update status
   * Mutates player object directly as part of state update pattern
   */
  const updateAllInStatus = (player: Player): void => {
    if (player.balance === 0 && player.status !== PlayerStatus.ALL_IN) {
      player.status = PlayerStatus.ALL_IN;
    }
  };

  /**
   * Log a betting action to the table's bet action history
   * @param tableState - The table state to log to
   * @param player - The player making the action
   * @param action - The action type
   * @param amount - The amount bet/raised
   */
  const logBetAction = (tableState: TableState, player: Player, action: BetActionType, amount: number): void => {
    tableState.betActions.push({
      playerId: player.id,
      playerName: player.name,
      action,
      amount,
      timestamp: Date.now(),
      bettingRound: tableState.bettingRound || BettingRound.PRE_FLOP
    });
  };

  /**
   * Checks if the current betting round is complete.
   * A round is complete when:
   * 1. All active players have acted at least once, AND
   * 2. All active players have either matched the highest bet or gone all-in, AND
   * 3. If there's an aggressor, action has returned to them (they've acted after becoming aggressor)
   * 4. OR all remaining players are all-in (no more actions possible)
   * 
   * Special case for pre-flop: Big blind is initially the aggressor and must get a chance to act.
   * 
   * @param players - Array of all players in the game
   * @param tableId - The table ID to check
   * @param tableState - The current table state
   * @returns true if betting round is complete, false otherwise
   */
  const checkBettingRoundComplete = (players: Player[], tableId: number, tableState: TableState): boolean => {
    const activePlayers = players.filter(p => 
      p.tableId === tableId && 
      p.status !== PlayerStatus.FOLDED && 
      p.status !== PlayerStatus.OUT
    );
    
    if (activePlayers.length <= 1) return true;
    
    // Check if all players are all-in or only one can act - betting round must end
    if (areAllPlayersAllInOrCapped(players, tableId)) {
      return true;
    }
    
    const maxBet = getMaxBetAtTable(players, tableId);
    
    // Check if all active players have matched the max bet or are all-in
    const allPlayersMatched = activePlayers.every(p => 
      p.currentBet === maxBet || p.status === PlayerStatus.ALL_IN
    );
    
    if (!allPlayersMatched) return false;
    
    // Check if all active players who can act have acted at least once
    // ALL_IN players cannot act, so they should not be expected to have acted
    const allPlayersActed = activePlayers
      .filter(p => p.status !== PlayerStatus.ALL_IN)
      .every(p => tableState.playersActedInRound.includes(p.id));
    
    if (!allPlayersActed) return false;
    
    // If there's a last aggressor (someone who bet/raised, or big blind in pre-flop),
    // they must have acted for the round to complete, unless they are all-in
    if (tableState.lastAggressorId) {
      const lastAggressor = players.find(p => p.id === tableState.lastAggressorId);
      // If aggressor is all-in, they can't act, so round can complete
      if (lastAggressor && lastAggressor.status === PlayerStatus.ALL_IN) {
        return true;
      }
      return tableState.playersActedInRound.includes(tableState.lastAggressorId);
    }
    
    // If no aggressor and all players acted and matched, round is complete
    return true;
  };

  const processAction = useCallback((msg: ActionMessage) => {
    setGameState(prev => {
      let newState = { ...prev };
      const { type, payload, senderId } = msg;

      switch (type) {
        case 'CREATE_CLUB':
          newState.clubs.push({
            id: payload.id,
            name: payload.name,
            ownerUserId: payload.ownerUserId,
            profilePhotoUrl: payload.profilePhotoUrl,
            bannerUrl: payload.bannerUrl,
            description: payload.description,
            createdAt: new Date(payload.createdAt),
            updatedAt: new Date(payload.updatedAt)
          });
          break;

        case 'UPDATE_CLUB':
          const clubIdx = newState.clubs.findIndex(c => c.id === payload.id);
          if (clubIdx !== -1) {
            newState.clubs[clubIdx] = { 
              ...newState.clubs[clubIdx], 
              ...payload,
              updatedAt: new Date()
            };
          }
          break;

        case 'DELETE_CLUB':
          newState.clubs = newState.clubs.filter(c => c.id !== payload.id);
          // Also delete tournaments associated with this club
          newState.tournaments = newState.tournaments.filter(t => t.clubId !== payload.id);
          break;

        case 'SET_ACTIVE_CLUB':
          newState.activeClubId = payload.id;
          break;

        case 'REGISTER_PERSON':
          newState.registry.push({ id: Math.random().toString(36).substr(2, 9), name: payload.name, nickname: payload.nickname });
          break;

        case 'DELETE_PERSON':
          newState.registry = newState.registry.filter(r => r.id !== payload.personId);
          newState.players = newState.players.filter(p => p.personId !== payload.personId);
          break;

        case 'ADD_ROOM_TABLE':
          const nextId = newState.roomTables.length > 0 ? Math.max(...newState.roomTables.map(t => t.id)) + 1 : 1;
          newState.roomTables.push({ id: nextId, name: `Mesa ${nextId}` });
          break;

        case 'REMOVE_ROOM_TABLE':
          newState.roomTables = newState.roomTables.filter(t => t.id !== payload.id);
          newState.tableStates = newState.tableStates.filter(ts => ts.id !== payload.id);
          break;

        case 'CREATE_TOURNAMENT':
          const newId = Math.random().toString(36).substr(2, 9);
          newState.tournaments.push({
            id: newId,
            name: payload.name,
            acronym: payload.acronym?.toUpperCase() || 'TOU',
            guaranteed: payload.guaranteed || 0,
            config: payload.config,
            assignedTableIds: payload.assignedTableIds,
            isActive: true,
            clubId: payload.clubId || newState.activeClubId || undefined
          });
          payload.assignedTableIds.forEach((tid: number) => {
            if (!newState.tableStates.find(ts => ts.id === tid)) {
              newState.tableStates.push({ 
                id: tid, 
                tournamentId: newId, 
                pot: 0, 
                currentTurn: null, 
                dealerId: null,
                dealerButtonPosition: null,
                currentBlindLevel: 0,
                bettingRound: null,
                currentBet: 0,
                lastRaiseAmount: 0,
                handInProgress: false,
                lastAggressorId: null,
                playersActedInRound: [],
                potDistribution: null,
                betActions: [],
                dealerAccessCode: generateDealerCode()
              });
            }
          });
          break;

        case 'UPDATE_TOURNAMENT':
          const tIdx = newState.tournaments.findIndex(t => t.id === payload.id);
          if (tIdx !== -1) {
            newState.tournaments[tIdx] = { ...newState.tournaments[tIdx], ...payload };
            payload.assignedTableIds.forEach((tid: number) => {
              if (!newState.tableStates.find(ts => ts.id === tid)) {
                newState.tableStates.push({ 
                  id: tid, 
                  tournamentId: payload.id, 
                  pot: 0, 
                  currentTurn: null, 
                  dealerId: null,
                  dealerButtonPosition: null,
                  currentBlindLevel: 0,
                  bettingRound: null,
                  currentBet: 0,
                  lastRaiseAmount: 0,
                  handInProgress: false,
                  lastAggressorId: null,
                  playersActedInRound: [],
                  potDistribution: null,
                  betActions: [],
                  dealerAccessCode: generateDealerCode()
                });
              }
            });
            newState.tableStates = newState.tableStates.filter(ts => 
              ts.tournamentId !== payload.id || payload.assignedTableIds.includes(ts.id)
            );
          }
          break;

        case 'DELETE_TOURNAMENT':
          newState.tournaments = newState.tournaments.filter(t => t.id !== payload.id);
          newState.players = newState.players.filter(p => p.tournamentId !== payload.id);
          newState.tableStates = newState.tableStates.filter(ts => ts.tournamentId !== payload.id);
          break;

        case 'SET_ACTIVE_TOURNAMENT':
          newState.activeTournamentId = payload.id;
          break;

        case 'REGISTER_PLAYER_TO_TOURNAMENT':
          const person = newState.registry.find(r => r.id === payload.personId);
          const tourney = newState.tournaments.find(t => t.id === payload.tournamentId);
          if (!person || !tourney) break;
          
          let totalChips = 0;
          let totalInvestment = 0;
          let rebuysAtStart = payload.rebuys || 0;
          let hasAddonAtStart = payload.addon || false;

          // Buy-in or Re-entry base
          if (payload.entryType === 'reentry') {
            totalChips += tourney.config.reentry.chips;
            totalInvestment += tourney.config.reentry.price;
          } else {
            totalChips += tourney.config.buyIn.chips;
            totalInvestment += tourney.config.buyIn.price;
          }

          // Initial rebuys
          totalChips += rebuysAtStart * tourney.config.rebuy.chips;
          totalInvestment += rebuysAtStart * tourney.config.rebuy.price;

          // Initial addon
          if (hasAddonAtStart) {
            totalChips += tourney.config.addon.chips;
            totalInvestment += tourney.config.addon.price;
          }

          const newPlayerId = Math.random().toString(36).substr(2, 9);
          
          // Create new player
          const newPlayer: Player = {
            id: newPlayerId,
            personId: person.id,
            tournamentId: tourney.id,
            name: person.nickname || person.name,
            balance: totalChips,
            currentBet: 0,
            totalContributedThisHand: 0,
            status: PlayerStatus.SITTING,
            tableId: null,
            seatNumber: 0,
            accessCode: generateAccessCode(),
            rebuysCount: rebuysAtStart,
            hasAddon: hasAddonAtStart,
            totalInvested: totalInvestment
          };

          newState.players.push(newPlayer);

          // Automatic balancing: assign player to table with least players
          const tableUsage = tourney.assignedTableIds.map(tid => ({ 
            id: tid, 
            count: newState.players.filter(p2 => p2.tableId === tid).length 
          }));
          const leastBusyTable = tableUsage.sort((a, b) => a.count - b.count)[0];
          
          // Reserve seat 1 for dealer - maxSeats - 1 available seats for players
          if (leastBusyTable && leastBusyTable.count < (tourney.config.maxSeats - 1)) {
            newPlayer.tableId = leastBusyTable.id;
            const takenSeats = newState.players.filter(p2 => p2.tableId === leastBusyTable.id).map(p2 => p2.seatNumber);
            // Skip seat 1 (dealer position) when assigning seats
            for(let s=2; s<=tourney.config.maxSeats; s++) {
              if (!takenSeats.includes(s)) { 
                newPlayer.seatNumber = s; 
                break; 
              }
            }
          }
          break;

        case 'AUTO_BALANCE':
          const tourId = payload.tournamentId;
          const targetTourney = newState.tournaments.find(t => t.id === tourId);
          if (!targetTourney) break;
          
          const waitingPlayers = newState.players.filter(p => p.tournamentId === tourId && p.tableId === null);
          waitingPlayers.forEach(p => {
             const tableUsage = targetTourney.assignedTableIds.map(tid => ({ 
               id: tid, 
               count: newState.players.filter(p2 => p2.tableId === tid).length 
             }));
             const leastBusyTable = tableUsage.sort((a, b) => a.count - b.count)[0];
             // Reserve seat 1 for dealer - maxSeats - 1 available seats for players
             if (leastBusyTable && leastBusyTable.count < (targetTourney.config.maxSeats - 1)) {
                p.tableId = leastBusyTable.id;
                const takenSeats = newState.players.filter(p2 => p2.tableId === leastBusyTable.id).map(p2 => p2.seatNumber);
                // Skip seat 1 (dealer position) when assigning seats
                for(let s=2; s<=targetTourney.config.maxSeats; s++) {
                   if (!takenSeats.includes(s)) { p.seatNumber = s; break; }
                }
             }
          });
          break;

        case 'BET':
          const bP = newState.players.find(p => p.id === senderId);
          if (bP && bP.tableId) {
            const tState = newState.tableStates.find(t => t.id === bP.tableId);
            // Only allow action if it's player's turn and player can act
            if (tState && tState.currentTurn === senderId && canPlayerAct(bP)) {
              const betDiff = payload.amount - bP.currentBet;
              // Validate that bet doesn't exceed player's balance and is non-negative
              const actualBetDiff = Math.max(0, Math.min(betDiff, bP.balance));
              bP.balance -= actualBetDiff;
              bP.currentBet += actualBetDiff;
              bP.totalContributedThisHand += actualBetDiff;
              tState.pot += actualBetDiff;
              
              // Check and set all-in status if no chips left
              const wasAllIn = bP.balance === 0;
              updateAllInStatus(bP);
              
              // Log the action
              logBetAction(tState, bP, wasAllIn ? 'ALL_IN' : 'BET', actualBetDiff);
              
              // Track that this player acted
              if (!tState.playersActedInRound.includes(senderId)) {
                tState.playersActedInRound.push(senderId);
              }
              
              // If this bet is higher than the current bet, update aggressor
              // This handles both initial bets and raises
              if (bP.currentBet > tState.currentBet) {
                tState.currentBet = bP.currentBet;
                tState.lastAggressorId = senderId;
                // Reset players acted when there's a new bet/raise
                // Only keep the current player in the acted list
                tState.playersActedInRound = [senderId];
              }
              
              const nextTurn = getNextTurnId(newState.players, tState.id, senderId);
              // Check if betting round is complete after setting next turn
              if (checkBettingRoundComplete(newState.players, tState.id, tState)) {
                tState.currentTurn = null; // Return control to dealer
              } else {
                tState.currentTurn = nextTurn;
              }
            }
          }
          break;

        case 'FOLD':
          const foldPlayer = newState.players.find(p => p.id === senderId);
          if (foldPlayer && foldPlayer.tableId) {
            const tState = newState.tableStates.find(t => t.id === foldPlayer.tableId);
            // Only allow action if it's player's turn and player can act
            if (tState && tState.currentTurn === senderId && canPlayerAct(foldPlayer)) {
              foldPlayer.status = PlayerStatus.FOLDED;
              
              // Log the action
              logBetAction(tState, foldPlayer, 'FOLD', 0);
              
              // Track that this player acted
              if (!tState.playersActedInRound.includes(senderId)) {
                tState.playersActedInRound.push(senderId);
              }
              
              const nextTurn = getNextTurnId(newState.players, tState.id, senderId);
              // Check if betting round is complete after setting next turn
              if (checkBettingRoundComplete(newState.players, tState.id, tState)) {
                tState.currentTurn = null; // Return control to dealer
              } else {
                tState.currentTurn = nextTurn;
              }
            }
          }
          break;

        case 'CHECK':
          const checkPlayer = newState.players.find(p => p.id === senderId);
          if (checkPlayer && checkPlayer.tableId) {
            const tState = newState.tableStates.find(t => t.id === checkPlayer.tableId);
            // Only allow action if it's player's turn, no bet to call, and player can act
            if (tState && tState.currentTurn === senderId && canPlayerAct(checkPlayer)) {
              const maxBet = getMaxBetAtTable(newState.players, checkPlayer.tableId);
              // Can only check if current bet matches the max bet
              if (checkPlayer.currentBet === maxBet) {
                // Log the action
                logBetAction(tState, checkPlayer, 'CHECK', 0);
                
                // Track that this player acted
                if (!tState.playersActedInRound.includes(senderId)) {
                  tState.playersActedInRound.push(senderId);
                }
                
                const nextTurn = getNextTurnId(newState.players, tState.id, senderId);
                // Check if betting round is complete after setting next turn
                if (checkBettingRoundComplete(newState.players, tState.id, tState)) {
                  tState.currentTurn = null; // Return control to dealer
                } else {
                  tState.currentTurn = nextTurn;
                }
              }
            }
          }
          break;

        case 'CALL':
          const callPlayer = newState.players.find(p => p.id === senderId);
          if (callPlayer && callPlayer.tableId) {
            const tState = newState.tableStates.find(t => t.id === callPlayer.tableId);
            // Only allow action if it's player's turn and player can act
            if (tState && tState.currentTurn === senderId && canPlayerAct(callPlayer)) {
              const maxBet = getMaxBetAtTable(newState.players, callPlayer.tableId);
              const callAmount = maxBet - callPlayer.currentBet;
              
              if (callAmount > 0) {
                const amountToCall = Math.min(callAmount, callPlayer.balance);
                callPlayer.balance -= amountToCall;
                callPlayer.currentBet += amountToCall;
                callPlayer.totalContributedThisHand += amountToCall;
                tState.pot += amountToCall;
                
                // If player is all-in, mark status
                const wasAllIn = callPlayer.balance === 0;
                if (wasAllIn) {
                  callPlayer.status = PlayerStatus.ALL_IN;
                }
                
                // Log the action
                logBetAction(tState, callPlayer, wasAllIn ? 'ALL_IN' : 'CALL', amountToCall);
              }
              
              // Track that this player acted
              if (!tState.playersActedInRound.includes(senderId)) {
                tState.playersActedInRound.push(senderId);
              }
              
              const nextTurn = getNextTurnId(newState.players, tState.id, senderId);
              // Check if betting round is complete after setting next turn
              if (checkBettingRoundComplete(newState.players, tState.id, tState)) {
                tState.currentTurn = null; // Return control to dealer
              } else {
                tState.currentTurn = nextTurn;
              }
            }
          }
          break;

        case 'START_POT_DISTRIBUTION':
          const tableForDistribution = newState.tableStates.find(t => t.id === payload.tableId);
          if (tableForDistribution) {
            // Prepare player bet information for side pot calculation
            const playerBets = preparePlayerBetsForPotCalculation(
              newState.players,
              payload.tableId
            );
            
            // Calculate side pots based on player bets
            const pots = calculateSidePots(playerBets, tableForDistribution.pot);
            
            tableForDistribution.potDistribution = {
              pots: pots,
              currentPotIndex: 0,
              selectedWinnerIds: []
            };
          }
          break;

        case 'TOGGLE_POT_WINNER':
          const tableForToggle = newState.tableStates.find(t => t.id === payload.tableId);
          if (tableForToggle?.potDistribution) {
            const playerId = payload.playerId;
            const selectedIds = tableForToggle.potDistribution.selectedWinnerIds;
            
            if (selectedIds.includes(playerId)) {
              // Unmark player
              tableForToggle.potDistribution.selectedWinnerIds = selectedIds.filter(id => id !== playerId);
            } else {
              // Mark player
              tableForToggle.potDistribution.selectedWinnerIds = [...selectedIds, playerId];
            }
          }
          break;

        case 'DELIVER_CURRENT_POT':
          const tableForDelivery = newState.tableStates.find(t => t.id === payload.tableId);
          if (tableForDelivery?.potDistribution) {
            const { pots, currentPotIndex, selectedWinnerIds } = tableForDelivery.potDistribution;
            
            if (selectedWinnerIds.length > 0 && currentPotIndex < pots.length) {
              const currentPot = pots[currentPotIndex];
              const amountPerWinner = Math.floor(currentPot.amount / selectedWinnerIds.length);
              
              // Distribute pot to selected winners
              selectedWinnerIds.forEach(winnerId => {
                const winner = newState.players.find(p => p.id === winnerId);
                if (winner) {
                  winner.balance += amountPerWinner;
                }
              });
              
              // Subtract distributed amount from main pot
              // Ensure we don't go negative due to rounding errors
              tableForDelivery.pot = Math.max(0, tableForDelivery.pot - currentPot.amount);
              
              // Move to next pot or clear distribution state
              if (currentPotIndex + 1 < pots.length) {
                tableForDelivery.potDistribution.currentPotIndex = currentPotIndex + 1;
                tableForDelivery.potDistribution.selectedWinnerIds = [];
              } else {
                // All pots distributed - end hand
                tableForDelivery.potDistribution = null;
                tableForDelivery.handInProgress = false;
                tableForDelivery.bettingRound = null;
                tableForDelivery.currentBet = 0;
                tableForDelivery.currentTurn = null;
                tableForDelivery.lastAggressorId = null;
                tableForDelivery.playersActedInRound = [];
                tableForDelivery.betActions = []; // Clear bet actions
                newState.players.filter(p => p.tableId === tableForDelivery.id).forEach(p => {
                  p.currentBet = 0;
                  p.totalContributedThisHand = 0;
                  // Mark players with zero balance as OUT
                  if (p.balance <= 0) {
                    p.status = PlayerStatus.OUT;
                  } else if (p.status !== PlayerStatus.OUT) {
                    p.status = PlayerStatus.SITTING;
                  }
                });
              }
            }
          }
          break;

        case 'DELIVER_ALL_ELIGIBLE_POTS':
          const tableForAutoDelivery = newState.tableStates.find(t => t.id === payload.tableId);
          if (tableForAutoDelivery?.potDistribution && payload.winnerId) {
            const { pots } = tableForAutoDelivery.potDistribution;
            const winnerId = payload.winnerId;
            const winner = newState.players.find(p => p.id === winnerId);
            
            if (winner) {
              let totalAwarded = 0;
              
              // Deliver all pots where this player is eligible
              // NOTE: This implementation awards full pot amounts to a single winner.
              // In real poker with split pots (multiple winners with equal hands), 
              // the pot would be divided equally among winners. 
              // Current limitation: Does not support automatic split pot calculation.
              // For split pots, use manual distribution (TOGGLE_POT_WINNER + DELIVER_CURRENT_POT).
              pots.forEach((pot) => {
                if (pot.eligiblePlayerIds.includes(winnerId)) {
                  winner.balance += pot.amount;
                  totalAwarded += pot.amount;
                }
              });
              
              // Clear pot and end hand
              tableForAutoDelivery.pot = Math.max(0, tableForAutoDelivery.pot - totalAwarded);
              tableForAutoDelivery.potDistribution = null;
              tableForAutoDelivery.handInProgress = false;
              tableForAutoDelivery.bettingRound = null;
              tableForAutoDelivery.currentBet = 0;
              tableForAutoDelivery.currentTurn = null;
              tableForAutoDelivery.lastAggressorId = null;
              tableForAutoDelivery.playersActedInRound = [];
              tableForAutoDelivery.betActions = []; // Clear bet actions
              newState.players.filter(p => p.tableId === tableForAutoDelivery.id).forEach(p => {
                p.currentBet = 0;
                p.totalContributedThisHand = 0;
                // Mark players with zero balance as OUT
                if (p.balance <= 0) {
                  p.status = PlayerStatus.OUT;
                } else if (p.status !== PlayerStatus.OUT) {
                  p.status = PlayerStatus.SITTING;
                }
              });
            }
          }
          break;

        case 'AWARD_POT':
          const winner = newState.players.find(p => p.id === payload.winnerId);
          if (winner) {
            const tState = newState.tableStates.find(t => t.id === winner.tableId);
            if (tState) {
              winner.balance += tState.pot;
              tState.pot = 0;
              tState.currentTurn = null;
              newState.players.filter(p => p.tableId === tState.id).forEach(p => {
                p.currentBet = 0;
                p.totalContributedThisHand = 0;
              });
            }
          }
          break;

        case 'REMOVE_PLAYER':
          const playerToRemove = newState.players.find(p => p.id === payload.playerId);
          if (playerToRemove && playerToRemove.tableId) {
            const tableState = newState.tableStates.find(ts => ts.id === playerToRemove.tableId);
            // If it's the removed player's turn, advance to next player before removing
            if (tableState && tableState.currentTurn === payload.playerId) {
              tableState.currentTurn = getNextTurnId(newState.players, playerToRemove.tableId, payload.playerId);
            }
          }
          newState.players = newState.players.filter(p => p.id !== payload.playerId);
          break;

        case 'MOVE_PLAYER':
          const playerToMove = newState.players.find(p => p.id === payload.playerId);
          if (playerToMove) {
            const targetTable = payload.targetTableId;
            const targetTourney = newState.tournaments.find(t => t.id === playerToMove.tournamentId);
            if (targetTourney) {
              playerToMove.tableId = targetTable;
              playerToMove.currentBet = 0;
              playerToMove.totalContributedThisHand = 0;
              playerToMove.status = PlayerStatus.SITTING;
              // Find available seat at target table (skip seat 1 - dealer position)
              const takenSeats = newState.players.filter(p => p.tableId === targetTable && p.id !== payload.playerId).map(p => p.seatNumber);
              for(let s=2; s<=targetTourney.config.maxSeats; s++) {
                if (!takenSeats.includes(s)) { playerToMove.seatNumber = s; break; }
              }
            }
          }
          break;

        case 'REBUY_PLAYER':
          const rebuyPlayer = newState.players.find(p => p.id === payload.playerId);
          if (rebuyPlayer) {
            const rebuyTourney = newState.tournaments.find(t => t.id === rebuyPlayer.tournamentId);
            if (rebuyTourney && rebuyTourney.config.rebuy.enabled) {
              if (rebuyPlayer.rebuysCount < rebuyTourney.config.rebuy.maxCount) {
                rebuyPlayer.balance += rebuyTourney.config.rebuy.chips;
                rebuyPlayer.rebuysCount += 1;
                rebuyPlayer.totalInvested += rebuyTourney.config.rebuy.price;
              }
            }
          }
          break;

        case 'REENTRY_PLAYER':
          const reentryPlayer = newState.players.find(p => p.id === payload.playerId);
          if (reentryPlayer) {
            const reentryTourney = newState.tournaments.find(t => t.id === reentryPlayer.tournamentId);
            if (reentryTourney && reentryTourney.config.reentry.enabled) {
              reentryPlayer.balance = reentryTourney.config.reentry.chips;
              reentryPlayer.currentBet = 0;
              reentryPlayer.totalContributedThisHand = 0;
              reentryPlayer.status = PlayerStatus.SITTING;
              reentryPlayer.totalInvested += reentryTourney.config.reentry.price;
              reentryPlayer.tableId = null;
              reentryPlayer.seatNumber = 0;
            }
          }
          break;

        case 'MOVE_DEALER_BUTTON':
          const tableStateForDealer = newState.tableStates.find(ts => ts.id === payload.tableId);
          if (tableStateForDealer) {
            const tablePlayers = getActivePlayers(newState.players, payload.tableId);
            
            if (tablePlayers.length > 0) {
              const newButtonPosition = moveButtonToNextPlayer(
                tablePlayers,
                tableStateForDealer.dealerButtonPosition
              );
              tableStateForDealer.dealerButtonPosition = newButtonPosition;
            }
          }
          break;

        case 'START_HAND':
          const tableForHand = newState.tableStates.find(ts => ts.id === payload.tableId);
          if (tableForHand) {
            const tournament = newState.tournaments.find(t => t.id === tableForHand.tournamentId);
            if (!tournament) break;
            
            const currentBlindLevel = tournament.config.blindStructure.levels[tableForHand.currentBlindLevel];
            if (!currentBlindLevel) break;
            
            // First, mark players with zero or negative balance as OUT
            const allTablePlayers = newState.players.filter(p => p.tableId === payload.tableId);
            allTablePlayers.forEach(p => {
              if (p.balance <= 0 && p.status !== PlayerStatus.OUT) {
                p.status = PlayerStatus.OUT;
              }
            });
            
            const tablePlayers = getActivePlayers(newState.players, payload.tableId);
            
            if (tablePlayers.length < 2) break;
            
            // Calculate dealer positions based on player count
            const positions = calculateDealerPositions(
              tablePlayers,
              tableForHand.dealerButtonPosition!
            );
            
            if (!positions) break;
            
            // Reset for new hand
            tableForHand.pot = 0;
            tableForHand.currentBet = currentBlindLevel.bigBlind;
            tableForHand.lastRaiseAmount = currentBlindLevel.bigBlind;
            tableForHand.bettingRound = 'PRE_FLOP' as any;
            tableForHand.handInProgress = true;
            tableForHand.playersActedInRound = []; // Reset action tracking
            tableForHand.betActions = []; // Clear bet action log for new hand
            // In pre-flop, big blind is the initial aggressor (they posted the big blind)
            // Note: BB is NOT added to playersActedInRound yet - posting blind is not an action
            // BB must still get a chance to check or raise when action returns to them
            tableForHand.lastAggressorId = tablePlayers[positions.bigBlindIdx].id;
            
            tablePlayers.forEach(p => {
              p.currentBet = 0;
              p.totalContributedThisHand = 0;
              p.status = PlayerStatus.ACTIVE;
            });
            
            // Post blinds - ensure players have enough chips
            const sbPlayer = tablePlayers[positions.smallBlindIdx];
            const bbPlayer = tablePlayers[positions.bigBlindIdx];
            
            // Small blind
            const sbAmount = Math.min(currentBlindLevel.smallBlind, sbPlayer.balance);
            sbPlayer.balance -= sbAmount;
            sbPlayer.currentBet = sbAmount;
            sbPlayer.totalContributedThisHand = sbAmount;
            tableForHand.pot += sbAmount;
            if (sbPlayer.balance === 0) {
              sbPlayer.status = PlayerStatus.ALL_IN;
            }
            
            // Big blind
            const bbAmount = Math.min(currentBlindLevel.bigBlind, bbPlayer.balance);
            bbPlayer.balance -= bbAmount;
            bbPlayer.currentBet = bbAmount;
            bbPlayer.totalContributedThisHand = bbAmount;
            tableForHand.pot += bbAmount;
            if (bbPlayer.balance === 0) {
              bbPlayer.status = PlayerStatus.ALL_IN;
            }
            
            // Set first to act based on player count and positions
            tableForHand.currentTurn = tablePlayers[positions.firstToActIdx].id;
          }
          break;

        case 'RAISE':
          const raisePlayer = newState.players.find(p => p.id === senderId);
          if (raisePlayer && raisePlayer.tableId) {
            const tableForRaise = newState.tableStates.find(ts => ts.id === raisePlayer.tableId);
            // Only allow action if player can act
            if (tableForRaise && canPlayerAct(raisePlayer)) {
              const raiseAmount = payload.amount;
              const callAmount = tableForRaise.currentBet - raisePlayer.currentBet;
              const totalToPay = callAmount + raiseAmount;
              
              // Validate that raise doesn't exceed player's balance
              const actualToPay = Math.min(totalToPay, raisePlayer.balance);
              raisePlayer.balance -= actualToPay;
              raisePlayer.currentBet += actualToPay;
              raisePlayer.totalContributedThisHand += actualToPay;
              tableForRaise.pot += actualToPay;
              
              // Check and set all-in status if no chips left
              const wasAllIn = raisePlayer.balance === 0;
              updateAllInStatus(raisePlayer);
              
              // Log the action
              logBetAction(tableForRaise, raisePlayer, wasAllIn ? 'ALL_IN' : 'RAISE', actualToPay);
              
              // Only update table's current bet if player's bet is higher (actual raise)
              if (raisePlayer.currentBet > tableForRaise.currentBet) {
                tableForRaise.currentBet = raisePlayer.currentBet;
                // Calculate actual raise amount: only consider it a raise if player raised above call amount
                const actualRaiseAmount = Math.max(0, actualToPay - callAmount);
                // Only set raise amount if player actually raised (not just called or partial call)
                if (actualRaiseAmount > 0) {
                  tableForRaise.lastRaiseAmount = actualRaiseAmount;
                  tableForRaise.lastAggressorId = senderId; // Mark this player as the aggressor
                }
              }              
              // When someone raises, reset the acted tracking so everyone must act again
              // Only the raiser is marked as having acted
              tableForRaise.playersActedInRound = [senderId];
              
              const nextTurn = getNextTurnId(newState.players, tableForRaise.id, senderId);
              // Check if betting round is complete after setting next turn
              if (checkBettingRoundComplete(newState.players, tableForRaise.id, tableForRaise)) {
                tableForRaise.currentTurn = null; // Return control to dealer
              } else {
                tableForRaise.currentTurn = nextTurn;
              }
            }
          }
          break;

        case 'ADVANCE_BETTING_ROUND':
          const tableForAdvance = newState.tableStates.find(ts => ts.id === payload.tableId);
          if (tableForAdvance && tableForAdvance.handInProgress) {
            const roundOrder = ['PRE_FLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'];
            const currentRoundIdx = roundOrder.indexOf(tableForAdvance.bettingRound || 'PRE_FLOP');
            
            if (currentRoundIdx < roundOrder.length - 1) {
              const nextRound = roundOrder[currentRoundIdx + 1] as any;
              tableForAdvance.bettingRound = nextRound;
              
              // CRITICAL: Reset all betting state for new round
              // This ensures players can CHECK at start of post-flop rounds (FLOP, TURN, RIVER)
              // SHOWDOWN has no betting, so this also ensures clean state
              tableForAdvance.currentBet = 0;
              tableForAdvance.lastRaiseAmount = 0;
              tableForAdvance.lastAggressorId = null; // Reset aggressor for new round
              tableForAdvance.playersActedInRound = []; // Reset action tracking for new round
              
              // Reset ALL players' current bets for the new round
              // This is critical: ALL players at this table, regardless of status, 
              // must have their currentBet reset to 0
              // This ensures that when the new round starts, players can CHECK (not forced to CALL)
              const allTablePlayers = newState.players.filter(p => p.tableId === payload.tableId);
              allTablePlayers.forEach(p => p.currentBet = 0);
              
              // Determine who can act in this new round (exclude FOLDED, OUT, ALL_IN)
              // Derived from allTablePlayers to avoid redundant filtering
              const playersWhoCanAct = allTablePlayers.filter(p => canPlayerAct(p));
              
              // Set first player to act for post-flop rounds
              // During SHOWDOWN, no one acts (no betting allowed)
              if (nextRound !== 'SHOWDOWN' && tableForAdvance.dealerButtonPosition && playersWhoCanAct.length > 0) {
                const firstToActIdx = getPostFlopFirstToAct(
                  playersWhoCanAct,
                  tableForAdvance.dealerButtonPosition
                );
                
                if (firstToActIdx !== -1) {
                  tableForAdvance.currentTurn = playersWhoCanAct[firstToActIdx].id;
                }
              } else if (nextRound === 'SHOWDOWN') {
                // At SHOWDOWN, no player has a turn (no betting allowed)
                tableForAdvance.currentTurn = null;
              }
            }
          }
          break;

        case 'ADVANCE_BLIND_LEVEL':
          const tableStateForBlinds = newState.tableStates.find(ts => ts.id === payload.tableId);
          if (tableStateForBlinds) {
            const tournament = newState.tournaments.find(t => t.id === tableStateForBlinds.tournamentId);
            if (tournament && tournament.config.blindStructure.levels) {
              const nextLevel = tableStateForBlinds.currentBlindLevel + 1;
              if (nextLevel < tournament.config.blindStructure.levels.length) {
                tableStateForBlinds.currentBlindLevel = nextLevel;
              }
            }
          }
          break;

        case 'START_TOURNAMENT':
          const tournamentToStart = newState.tournaments.find(t => t.id === payload.tournamentId);
          if (tournamentToStart) {
            tournamentToStart.isStarted = true;
            tournamentToStart.startedAt = new Date();
            tournamentToStart.currentBlindLevelStartTime = new Date();
          }
          break;

        case 'STOP_TOURNAMENT':
          const tournamentToStop = newState.tournaments.find(t => t.id === payload.tournamentId);
          if (tournamentToStop) {
            tournamentToStop.isStarted = false;
          }
          break;

        case 'AUTO_ADVANCE_BLIND_LEVEL':
          const tournamentForBlindAdvance = newState.tournaments.find(t => t.id === payload.tournamentId);
          if (tournamentForBlindAdvance && tournamentForBlindAdvance.isStarted) {
            // Advance all tables in this tournament to the next blind level
            const tablesToAdvance = newState.tableStates.filter(ts => ts.tournamentId === payload.tournamentId);
            const currentLevel = tablesToAdvance[0]?.currentBlindLevel || 0;
            const nextLevel = currentLevel + 1;
            
            if (nextLevel < tournamentForBlindAdvance.config.blindStructure.levels.length) {
              tablesToAdvance.forEach(table => {
                table.currentBlindLevel = nextLevel;
              });
              
              // Update the tournament's blind level start time
              tournamentForBlindAdvance.currentBlindLevelStartTime = new Date();
            }
          }
          break;
      }

      debouncedPersistState(newState);
      return newState;
    });
  }, [debouncedPersistState]);

  useEffect(() => {
    // Only subscribe after authentication check is complete and we have a user ID
    // This subscribes when admin logs in OR when code-based access sets a userId
    if (isLoading) return;
    if (!syncUserId) return;
    
    console.log('🔄 Iniciando assinatura de sincronização para userId:', syncUserId);
    const unsubscribe = syncService.subscribe(processAction);
    
    return () => {
      console.log('🔌 Encerrando assinatura de sincronização');
      unsubscribe();
      
      // Flush any pending persistence on unmount using the ref to avoid dependency issues
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        syncService.persistState(gameStateRef.current);
      }
    };
  }, [processAction, isLoading, syncUserId]);

  const dispatch = (msg: ActionMessage) => {
    // Only send to Supabase - will be processed once when received via subscription
    // This prevents duplicate processing: local + subscription callback
    syncService.sendMessage(msg).catch(error => {
      console.error('❌ Erro ao enviar ação:', error);
      // In case of error, still process locally to prevent UI from breaking
      processAction(msg);
    });
  };

  const selectRole = (r: Role, tId?: number) => {
    setRole(r);
    if (tId !== undefined) {
      setTableId(tId);
      localStorage.setItem('poker_current_table_id', tId.toString());
    }
    localStorage.setItem('poker_current_role', r);
  };

  const exitRole = () => {
    setRole(null);
    setPlayerId(null);
    setTableId(null);
    setShowAdminLogin(false);
    localStorage.removeItem('poker_current_role');
    localStorage.removeItem('poker_current_player_id');
    localStorage.removeItem('poker_current_table_id');
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setRole(null);
    setPlayerId(null);
    setTableId(null);
    setShowAdminLogin(false);
    setGameState(INITIAL_STATE);
    syncService.setUserId(null);
  };

  const handleLoginSuccess = (session: AuthSession) => {
    setCurrentUser(session.user);
    syncService.setUserId(session.user.id);
    setShowAdminLogin(false); // Exit admin login mode after successful login
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center poker-felt">
        <div className="text-center">
          <div className="text-6xl font-outfit font-black text-white mb-4 italic tracking-tighter animate-pulse">
            POKER<span className="text-yellow-500"> 2</span>
          </div>
          <div className="text-white/40 text-xs font-bold uppercase tracking-widest">Carregando...</div>
        </div>
      </div>
    );
  }

  // Show login screen for admin mode only
  if (showAdminLogin) {
    // Check if Supabase is configured when trying to use admin mode
    if (!isSupabaseConfigured()) {
      return (
        <div className="min-h-screen flex items-center justify-center poker-felt p-6">
          <div className="max-w-2xl glass p-10 rounded-[40px] shadow-2xl border-white/20 border">
            <button 
              onClick={() => setShowAdminLogin(false)}
              className="mb-6 px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black uppercase transition-all tracking-widest"
            >
              ← VOLTAR
            </button>
            <div className="text-center">
              <div className="text-6xl font-outfit font-black text-white mb-4 italic tracking-tighter">
                POKER<span className="text-yellow-500"> 2</span>
              </div>
              <div className="text-white/40 mb-6 text-[10px] font-bold tracking-[6px] uppercase">
                Gerenciador de Fichas & Suite Profissional
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-left">
                <h2 className="text-yellow-400 font-black text-xl mb-4">⚠️ Sistema não Configurado</h2>
                <p className="text-white/80 mb-4">
                  O backend do sistema ainda não foi configurado pelo administrador.
                </p>
                <div className="bg-black/40 rounded-xl p-4 mb-4">
                  <p className="text-white/70 text-sm mb-3">
                    <strong>👤 Se você é um usuário:</strong> Entre em contato com o administrador do sistema.
                  </p>
                  <p className="text-white/70 text-sm">
                    <strong>🔧 Se você é o mantenedor:</strong> Configure o Supabase seguindo o guia:
                  </p>
                  <ul className="text-white/60 text-xs mt-2 space-y-1 list-disc list-inside">
                    <li><code className="bg-black/40 px-2 py-1 rounded">DEVELOPER_SETUP.md</code> - Setup completo</li>
                    <li><code className="bg-black/40 px-2 py-1 rounded">ENVIRONMENT_SETUP.md</code> - Variáveis de ambiente</li>
                  </ul>
                </div>
                <p className="text-white/60 text-sm">
                  📖 Após configurado, o modo administrativo estará disponível para criação de torneios.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Supabase is configured, show login if not authenticated
    if (!currentUser) {
      return (
        <div>
          <button 
            onClick={() => setShowAdminLogin(false)}
            className="absolute top-6 left-6 px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black uppercase transition-all tracking-widest"
          >
            ← VOLTAR
          </button>
          <Login onLoginSuccess={handleLoginSuccess} />
        </div>
      );
    }
  }

  // Main interface - authentication required for all operations
  // Show backend not configured message if Supabase is not set up
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 poker-felt">
        <div className="w-full max-w-2xl glass p-10 rounded-[40px] shadow-2xl border-white/20 border">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-outfit font-black text-white mb-2 italic tracking-tighter">
              POKER<span className="text-yellow-500"> 2</span>
            </h1>
            <p className="text-white/40 mb-2 text-[10px] font-bold tracking-[6px] uppercase">
              Gerenciador de Fichas & Suite Profissional
            </p>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl">⚠️</span>
              <div>
                <h2 className="text-yellow-400 font-black text-xl mb-2">Sistema em Configuração</h2>
                <p className="text-white/80 mb-4 leading-relaxed">
                  O backend deste sistema ainda não foi configurado pelo administrador.
                </p>
              </div>
            </div>
            
            <div className="bg-black/40 rounded-xl p-4 mb-4">
              <h3 className="text-white font-bold text-sm mb-3">
                👤 Se você é um USUÁRIO:
              </h3>
              <p className="text-white/70 text-sm mb-3">
                Não se preocupe! Isso não é algo que você precisa resolver. 
                Entre em contato com o administrador do sistema para que ele configure o servidor.
              </p>
              <p className="text-white/60 text-xs">
                O sistema foi projetado para funcionar sem nenhuma configuração do lado do usuário.
              </p>
            </div>
            
            <div className="bg-black/40 rounded-xl p-4">
              <h3 className="text-blue-300 font-bold text-sm mb-3">
                🔧 Se você é um DESENVOLVEDOR/MANTENEDOR:
              </h3>
              <p className="text-white/70 text-sm mb-3">
                Configure o backend do Supabase seguindo os passos em:
              </p>
              <ul className="text-white/60 text-xs space-y-1 list-disc list-inside mb-3">
                <li><code className="bg-black/40 px-2 py-1 rounded text-blue-300">DEVELOPER_SETUP.md</code> - Guia completo</li>
                <li><code className="bg-black/40 px-2 py-1 rounded text-blue-300">ENVIRONMENT_SETUP.md</code> - Configuração de variáveis</li>
              </ul>
              <p className="text-white/50 text-xs">
                Após configurar, todos os usuários poderão acessar sem setup adicional.
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-white/40 text-xs">
              📖 Precisa de ajuda? Consulte <code className="bg-black/40 px-2 py-1 rounded text-yellow-300">USER_GUIDE.md</code> 
              para usuários ou <code className="bg-black/40 px-2 py-1 rounded text-blue-300">DEVELOPER_SETUP.md</code> para desenvolvedores
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show club selection for unauthenticated users (requires Supabase to be configured)
  if (!role && !currentUser && !managerSession) {
    // Show manager login if a club is selected and user clicked "Enter as Manager"
    if (showManagerLogin && selectedClub) {
      return (
        <ManagerLogin
          club={selectedClub}
          onLoginSuccess={(session) => {
            setManagerSession(session);
            setShowManagerLogin(false);
            // Load the club owner's game state for the manager
            syncService.setUserId(selectedClub.ownerUserId);
            setSyncUserId(selectedClub.ownerUserId);
            localStorage.setItem('poker_sync_user_id', selectedClub.ownerUserId);
            
            // Load state
            syncService.loadStateForUser(selectedClub.ownerUserId).then(state => {
              if (state) {
                setGameState(state);
                // Set active club
                dispatch({
                  type: 'SET_ACTIVE_CLUB',
                  payload: { id: selectedClub.id },
                  senderId: 'system'
                });
              }
            });
          }}
          onBack={() => setShowManagerLogin(false)}
        />
      );
    }

    // Show code entry if club is selected
    if (selectedClub && !showClubSelection) {
      const handleCodeSubmit = async (code: string) => {
        const upperCode = code.toUpperCase();
        
        // First, try to find the code in local state
        let foundPlayer = gameState.players.find(p => p.accessCode === upperCode);
        let foundTable = gameState.tableStates.find(ts => ts.dealerAccessCode === upperCode);
        
        // If not found locally and Supabase is configured, search in backend
        if (!foundPlayer && !foundTable && isSupabaseConfigured()) {
          console.log('🔍 Código não encontrado localmente, buscando no backend...');
          
          try {
            // Find which user owns this code
            const ownerUserId = await syncService.findUserByAccessCode(upperCode);
            
            if (ownerUserId) {
              console.log('✅ Código encontrado! Carregando estado do torneio...');
              
              // Load that user's game state
              const ownerState = await syncService.loadStateForUser(ownerUserId);
              
              if (ownerState) {
                // Update local game state with the owner's state
                setGameState(ownerState);
                
                // Set this user ID for synchronization (guest access to owner's session)
                syncService.setUserId(ownerUserId);
                setSyncUserId(ownerUserId); // Trigger subscription effect
                
                // Save to localStorage for persistence across page refreshes
                localStorage.setItem('poker_sync_user_id', ownerUserId);
                
                // Now find the player/table in the loaded state
                foundPlayer = ownerState.players.find(p => p.accessCode === upperCode);
                foundTable = ownerState.tableStates.find(ts => ts.dealerAccessCode === upperCode);
                
                console.log('✅ Estado do torneio carregado com sucesso');
              } else {
                console.error('❌ Falha ao carregar estado do torneio');
                alert('Erro ao carregar dados do torneio. Tente novamente.');
                return;
              }
            }
          } catch (error) {
            console.error('❌ Erro ao buscar código no backend:', error);
            alert('Erro ao buscar código. Verifique sua conexão e tente novamente.');
            return;
          }
        }
        
        // Check if it's a player code
        if (foundPlayer) {
          setPlayerId(foundPlayer.id);
          localStorage.setItem('poker_current_player_id', foundPlayer.id);
          selectRole(Role.PLAYER);
          return;
        }
        
        // Check if it's a dealer code
        if (foundTable) {
          selectRole(Role.DEALER, foundTable.id);
          return;
        }
        
        // Code not found
        alert('Código não encontrado. Verifique o código e tente novamente.');
      };

      return (
        <ClubCodeEntry
          club={selectedClub}
          onCodeSubmit={handleCodeSubmit}
          onBack={() => {
            setSelectedClub(null);
            setShowClubSelection(false);
          }}
          onManagerLogin={() => setShowManagerLogin(true)}
        />
      );
    }

    // Show club selection (first screen for non-authenticated users)
    // But first check if user wants club selection or admin mode
    if (showClubSelection) {
      return (
        <ClubSelection
          userId="guest" // Guest users can search all clubs
          onClubSelect={(club) => {
            setSelectedClub(club);
            setShowClubSelection(false);
            // Load the club owner's state
            syncService.loadStateForUser(club.ownerUserId).then(state => {
              if (state) {
                setGameState(state);
              }
            });
          }}
          onBack={() => setShowClubSelection(false)}
        />
      );
    }

    // Default home screen: Choose between club selection or admin mode
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 poker-felt">
        <div className="w-full max-w-md glass p-10 rounded-[40px] shadow-2xl text-center border-white/20 border">
          <h1 className="text-6xl font-outfit font-black text-white mb-2 italic tracking-tighter">POKER<span className="text-yellow-500"> 2</span></h1>
          <p className="text-white/40 mb-2 text-[10px] font-bold tracking-[6px] uppercase">Gerenciador de Fichas & Suite Profissional</p>
          <p className="text-white/60 text-sm mb-8">Bem-vindo ao sistema</p>
          
          {sessionExpiredMessage && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-left">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏱️</span>
                <div>
                  <h3 className="text-yellow-400 font-black text-sm mb-1">Sessão Expirada</h3>
                  <p className="text-white/70 text-xs leading-relaxed">
                    Sua sessão de administrador expirou. Por favor, faça login novamente no modo administrativo.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSessionExpiredMessage(false)}
                className="mt-3 w-full text-yellow-400/60 hover:text-yellow-400 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                OK, ENTENDI
              </button>
            </div>
          )}
          
          <div className="space-y-4">
            <button 
              onClick={() => setShowClubSelection(true)}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-5 rounded-3xl text-xl shadow-xl transition-all"
            >
              ENTRAR EM UM CLUBE
            </button>
            <button 
              onClick={() => setShowAdminLogin(true)} 
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white font-black py-3 rounded-2xl transition-all uppercase text-[10px] tracking-widest"
            >
              Modo Administrativo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin authenticated - show director role selection
  if (currentUser && !role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 poker-felt">
        <div className="w-full max-w-md glass p-10 rounded-[40px] shadow-2xl text-center border-white/20 border">
          <h1 className="text-6xl font-outfit font-black text-white mb-2 italic tracking-tighter">POKER<span className="text-yellow-500"> 2</span></h1>
          <p className="text-white/40 mb-2 text-[10px] font-bold tracking-[6px] uppercase">Gerenciador de Fichas & Suite Profissional</p>
          <p className="text-white/60 text-sm mb-8">Bem-vindo, <span className="text-yellow-400 font-bold">{currentUser.username}</span></p>
          <div className="space-y-4">
            <button onClick={() => selectRole(Role.DIRECTOR)} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-5 rounded-3xl text-xl shadow-xl transition-all">GERENCIAMENTO</button>
            <button onClick={handleLogout} className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-black py-3 rounded-2xl transition-all uppercase text-[10px] tracking-widest">SAIR</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {role === Role.PLAYER && playerId && <PlayerDashboard state={gameState} playerId={playerId} onDispatch={dispatch} />}
      {role === Role.DEALER && tableId && <TableDealerInterface state={gameState} tableId={tableId} onDispatch={dispatch} onExit={exitRole} />}
      {role === Role.DIRECTOR && (currentUser || managerSession) && (
        <div className="h-screen flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center font-black text-black text-xl">
                 {managerSession ? 'M' : 'D'}
               </div>
               <div>
                 <h1 className="text-2xl font-outfit font-black text-white italic tracking-tight uppercase">Gerenciamento</h1>
                 <p className="text-white/40 text-xs">
                   {currentUser ? `Usuário: ${currentUser.username}` : `Gerente: ${managerSession?.manager.username}`}
                   {managerSession && <span className="ml-2 text-yellow-500/60">(Permissões Limitadas)</span>}
                 </p>
               </div>
            </div>
            <div className="flex gap-2">
              <button onClick={exitRole} className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black uppercase transition-all tracking-widest">VOLTAR</button>
              <button 
                onClick={async () => {
                  if (managerSession) {
                    await clubService.managerLogout();
                    setManagerSession(null);
                  } else {
                    await handleLogout();
                  }
                }} 
                className="px-6 py-2 rounded-xl bg-white/5 hover:bg-red-600/20 text-white/40 hover:text-red-500 text-[10px] font-black uppercase transition-all tracking-widest"
              >
                LOGOUT
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-[#0a0a0a]">
            <DealerControls state={gameState} onDispatch={dispatch} isManager={!!managerSession} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
