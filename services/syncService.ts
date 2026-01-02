
import { ActionMessage, GameState, Player, TableState } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Game session ID is now user-specific
const getGameSessionId = (userId: string) => `poker_game_session_${userId}`;
const POKER_CHANNEL = 'poker_actions';

// Current user ID - must be set before using sync service
// Can be either:
// - Admin's userId (authenticated user who created the tournament)
// - Tournament owner's userId (for guest players/dealers accessing via code)
let currentUserId: string | null = null;

// Track if the current user is authenticated (admin) or guest (code-based access)
let isAdminMode: boolean = false;

// Realtime channel for Supabase synchronization
let realtimeChannel: RealtimeChannel | null = null;

export const syncService = {
  /**
   * Set the current user ID for scoped operations
   * @deprecated Use setAdminUserId or setGuestUserId for clarity
   */
  setUserId: (userId: string | null) => {
    currentUserId = userId;
    isAdminMode = false; // Default to guest mode for backward compatibility
  },

  /**
   * Set user ID for an authenticated administrator
   * Use this when a user logs in with credentials
   */
  setAdminUserId: (userId: string | null) => {
    currentUserId = userId;
    isAdminMode = userId !== null; // Only set admin mode if userId is not null
  },

  /**
   * Set user ID for guest access (player/dealer entering via code)
   * This sets the tournament owner's userId to enable synchronization
   */
  setGuestUserId: (ownerId: string | null) => {
    currentUserId = ownerId;
    isAdminMode = false; // Always guest mode
  },

  /**
   * Join a table using mesaId (table ID) by finding and setting the owner's userId
   * Returns true if successful, false otherwise
   */
  joinTableByMesaId: async (mesaId: number, accessCode: string): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase não configurado - não é possível buscar mesa');
      return false;
    }

    try {
      // Find the user who owns this table/code
      const ownerId = await syncService.findUserByAccessCode(accessCode);
      
      if (ownerId) {
        syncService.setGuestUserId(ownerId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao entrar na mesa:', error);
      return false;
    }
  },

  /**
   * Get the current user ID
   */
  getUserId: (): string | null => {
    return currentUserId;
  },

  /**
   * Check if current session is in admin mode (authenticated)
   */
  isAdmin: (): boolean => {
    return isAdminMode;
  },

  sendMessage: async (msg: ActionMessage, options?: { mesaId?: number }) => {
    // Multi-device sync requires a userId to be set
    // This can be either:
    // - Admin's userId (when authenticated)
    // - Tournament owner's userId (when accessing via code)
    if (!currentUserId) {
      const errorMsg = isAdminMode
        ? 'Sincronização requer login de administrador - faça login para continuar'
        : 'Sincronização requer acesso via código - entre com um código de acesso válido';
      console.warn(`⚠️ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    if (!isSupabaseConfigured() || !supabase) {
      const errorMsg = 'Supabase não configurado - sincronização multi-dispositivo indisponível - ação será processada localmente';
      console.warn(`⚠️ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    try {
      // Include mesaId in payload if provided (for table-specific actions)
      const payload = options?.mesaId 
        ? { ...msg.payload, mesaId: options.mesaId }
        : msg.payload;

      const { error } = await supabase
        .from('poker_actions')
        .insert({
          session_id: getGameSessionId(currentUserId),
          action_type: msg.type,
          payload: payload,
          sender_id: msg.senderId,
          user_id: currentUserId,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('❌ Falha ao enviar mensagem via Supabase:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar via Supabase:', error);
      throw error;
    }
  },
  
  subscribe: (callback: (msg: ActionMessage) => void) => {
    // Multi-device mode requires a userId (admin or guest)
    if (!currentUserId) {
      const warningMsg = isAdminMode
        ? '⚠️ Inscrição requer login de administrador - faça login para habilitar sincronização multi-dispositivo'
        : '⚠️ Inscrição requer acesso via código - entre com um código de acesso para habilitar sincronização';
      console.warn(warningMsg);
      return () => { /* No-op cleanup */ };
    }

    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase não configurado - sincronização multi-dispositivo indisponível');
      return () => { /* No-op cleanup */ };
    }

    const modeLabel = isAdminMode ? 'modo administrador' : 'modo convidado (via código)';
    console.log(`🔄 Inscrevendo-se no Supabase Realtime para sincronização multi-dispositivo (${modeLabel})...`);
    
    const userSessionId = getGameSessionId(currentUserId);
    
    realtimeChannel = supabase
      .channel(`${POKER_CHANNEL}_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'poker_actions',
          filter: `session_id=eq.${userSessionId}`
        },
        (payload) => {
          try {
            const action = payload.new as any;
            const msg: ActionMessage = {
              type: action.action_type,
              payload: action.payload,
              senderId: action.sender_id
            };
            callback(msg);
          } catch (error) {
            console.error('❌ Falha ao processar mensagem do Supabase:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Conectado ao Supabase Realtime - sincronização multi-dispositivo ativa (${modeLabel})`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro no canal Realtime');
          console.error('   Tentando reconectar automaticamente...');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Timeout na conexão Realtime');
          console.error('   Tentando reconectar automaticamente...');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Canal Realtime fechado - tentando reconectar...');
        }
      });
    
    // Return cleanup function
    return () => {
      if (realtimeChannel) {
        console.log('🔌 Desconectando do Supabase Realtime...');
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    };
  },

  // Save state to Supabase only (multi-device mode)
  persistState: async (state: GameState) => {
    // Multi-device mode requires a userId (admin or guest)
    if (!currentUserId) {
      const warningMsg = isAdminMode
        ? '⚠️ Persistência requer login de administrador - estado não será sincronizado'
        : '⚠️ Persistência requer acesso via código - estado não será sincronizado';
      console.warn(warningMsg);
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase não configurado - persistência multi-dispositivo indisponível');
      return;
    }

    try {
      const { error } = await supabase
        .from('poker_game_state')
        .upsert({
          session_id: getGameSessionId(currentUserId),
          user_id: currentUserId,
          state: state,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_id,user_id'
        });
      
      if (error) {
        console.error('❌ Falha ao persistir estado no Supabase:', error);
      }
    } catch (error) {
      console.error('❌ Erro ao persistir estado:', error);
    }
  },

  loadState: async (): Promise<GameState | null> => {
    // Multi-device mode requires a userId (admin or guest)
    if (!currentUserId) {
      const warningMsg = isAdminMode
        ? '⚠️ Carregamento de estado requer login de administrador'
        : '⚠️ Carregamento de estado requer acesso via código';
      console.warn(warningMsg);
      return null;
    }

    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase não configurado - carregamento de estado multi-dispositivo indisponível');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('poker_game_state')
        .select('state')
        .eq('session_id', getGameSessionId(currentUserId))
        .eq('user_id', currentUserId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle empty results gracefully
      
      // Handle case where no state exists yet (PGRST116 - no rows returned)
      if (error) {
        // PGRST116 means no rows found, which is not an error - it's a normal case
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Nenhum estado de jogo encontrado - inicializando novo estado');
          return null; // Return null to allow initialization of default state
        }
        console.error('❌ Erro ao carregar estado do Supabase:', error);
        return null;
      }
      
      if (data?.state) {
        const state = data.state as GameState;
        
        // Load clubs from database if not present in state
        if (!state.clubs) {
          const { data: clubsData } = await supabase
            .from('poker_clubs')
            .select('*')
            .eq('owner_user_id', currentUserId)
            .order('created_at', { ascending: false });
          
          if (clubsData) {
            state.clubs = clubsData.map(club => ({
              id: club.id,
              name: club.name,
              ownerUserId: club.owner_user_id,
              profilePhotoUrl: club.profile_photo_url,
              bannerUrl: club.banner_url,
              description: club.description,
              createdAt: new Date(club.created_at),
              updatedAt: new Date(club.updated_at)
            }));
          }
        }
        
        return state;
      }
      
      // No data but no error - initialize new state
      console.log('ℹ️ Estado vazio retornado - inicializando novo estado');
      return null;
    } catch (error) {
      console.error('❌ Falha ao carregar estado:', error);
      return null;
    }
  },

  /**
   * Find the user ID that owns a specific access code (player or dealer)
   * This allows code-based access to find the correct user's game state
   */
  findUserByAccessCode: async (accessCode: string): Promise<string | null> => {
    if (!isSupabaseConfigured() || !supabase) {
      console.error('❌ Supabase não configurado - busca de código indisponível');
      return null;
    }

    try {
      // Use database function to search across all users (with SECURITY DEFINER to bypass RLS)
      const { data, error } = await supabase
        .rpc('find_user_by_access_code', { access_code: accessCode });
      
      if (error) {
        console.error('❌ Erro ao buscar código de acesso via RPC:', error);
        console.error('   Detalhes:', error.message);
        
        // Fallback: Try direct query if RPC fails (will work if RLS allows it)
        console.log('⚠️ Tentando busca direta como fallback...');
        return await syncService.findUserByAccessCodeFallback(accessCode);
      }

      if (data) {
        console.log('✅ Código encontrado para usuário:', data);
        return data;
      }

      console.log('⚠️ Código não encontrado em nenhum estado de jogo');
      return null;
    } catch (error) {
      console.error('❌ Falha ao buscar código de acesso:', error);
      // Try fallback method
      return await syncService.findUserByAccessCodeFallback(accessCode);
    }
  },

  /**
   * Fallback method to find user by access code using direct query
   * This may fail due to RLS policies but serves as a backup
   */
  findUserByAccessCodeFallback: async (accessCode: string): Promise<string | null> => {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    try {
      // Try to search all game states (may be limited by RLS)
      const { data, error } = await supabase
        .from('poker_game_state')
        .select('user_id, state');
      
      if (error) {
        console.error('❌ Erro na busca direta (pode ser RLS):', error.message);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('ℹ️ Nenhum estado de jogo acessível (pode ser RLS)');
        return null;
      }

      // Search through available states to find matching code
      for (const record of data) {
        const state = record.state as GameState;
        
        // Check player codes
        const foundPlayer = state.players?.find((p: Player) => p.accessCode === accessCode);
        if (foundPlayer) {
          console.log('✅ Código de jogador encontrado (fallback):', record.user_id);
          return record.user_id;
        }

        // Check dealer codes
        const foundTable = state.tableStates?.find((ts: TableState) => ts.dealerAccessCode === accessCode);
        if (foundTable) {
          console.log('✅ Código de dealer encontrado (fallback):', record.user_id);
          return record.user_id;
        }
      }

      console.log('⚠️ Código não encontrado nos estados acessíveis');
      return null;
    } catch (error) {
      console.error('❌ Falha na busca direta:', error);
      return null;
    }
  },

  /**
   * Load game state for a specific user (for guest access via code)
   * This allows players/dealers to access the tournament creator's game state
   */
  loadStateForUser: async (userId: string): Promise<GameState | null> => {
    if (!isSupabaseConfigured() || !supabase) {
      console.error('❌ Supabase não configurado - carregamento de estado indisponível');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('poker_game_state')
        .select('state')
        .eq('session_id', getGameSessionId(userId))
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle() to handle empty results gracefully
      
      // Handle case where no state exists (PGRST116)
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Nenhum estado encontrado para usuário:', userId);
          return null;
        }
        console.error('❌ Erro ao carregar estado do usuário:', error);
        return null;
      }
      
      if (data?.state) {
        console.log('✅ Estado carregado para usuário:', userId);
        return data.state as GameState;
      }
      
      console.log('ℹ️ Estado vazio para usuário:', userId);
      return null;
    } catch (error) {
      console.error('❌ Falha ao carregar estado do usuário:', error);
      return null;
    }
  }
};
