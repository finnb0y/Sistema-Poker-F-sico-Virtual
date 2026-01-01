
import { ActionMessage, GameState, Player, TableState } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Game session ID is now user-specific
const getGameSessionId = (userId: string) => `poker_game_session_${userId}`;
const POKER_CHANNEL = 'poker_actions';

// Current user ID - must be set before using sync service
let currentUserId: string | null = null;

// Realtime channel for Supabase synchronization
let realtimeChannel: RealtimeChannel | null = null;

export const syncService = {
  /**
   * Set the current user ID for scoped operations
   */
  setUserId: (userId: string | null) => {
    currentUserId = userId;
  },

  /**
   * Get the current user ID
   */
  getUserId: (): string | null => {
    return currentUserId;
  },

  sendMessage: async (msg: ActionMessage) => {
    // Multi-device sync requires Supabase and authentication
    if (!currentUserId) {
      const errorMsg = 'Sincronização requer autenticação de usuário';
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    if (!isSupabaseConfigured() || !supabase) {
      const errorMsg = 'Supabase não configurado - sincronização multi-dispositivo indisponível';
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    try {
      const { error } = await supabase
        .from('poker_actions')
        .insert({
          session_id: getGameSessionId(currentUserId),
          action_type: msg.type,
          payload: msg.payload,
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
    // Multi-device mode requires authentication
    if (!currentUserId) {
      console.error('❌ Inscrição requer autenticação de usuário - modo multi-dispositivo exclusivo');
      return () => { /* No-op cleanup */ };
    }

    if (!isSupabaseConfigured() || !supabase) {
      console.error('❌ Supabase não configurado - sincronização multi-dispositivo indisponível');
      return () => { /* No-op cleanup */ };
    }

    console.log('🔄 Inscrevendo-se no Supabase Realtime para sincronização multi-dispositivo...');
    
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
          console.log('✅ Conectado ao Supabase Realtime - sincronização multi-dispositivo ativa');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Erro na conexão com Supabase:', status);
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
    // Multi-device mode requires authentication
    if (!currentUserId) {
      console.error('❌ Persistência requer autenticação de usuário');
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      console.error('❌ Supabase não configurado - persistência multi-dispositivo indisponível');
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
    // Multi-device mode requires authentication
    if (!currentUserId) {
      console.error('❌ Carregamento de estado requer autenticação de usuário');
      return null;
    }

    if (!isSupabaseConfigured() || !supabase) {
      console.error('❌ Supabase não configurado - carregamento de estado multi-dispositivo indisponível');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('poker_game_state')
        .select('state')
        .eq('session_id', getGameSessionId(currentUserId))
        .eq('user_id', currentUserId)
        .single();
      
      if (!error && data?.state) {
        const state = data.state as GameState;
        
        // Load clubs from database if not in state
        if (!state.clubs || state.clubs.length === 0) {
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
      
      if (error) {
        console.error('❌ Erro ao carregar estado do Supabase:', error);
      }
    } catch (error) {
      console.error('❌ Falha ao carregar estado:', error);
    }
    
    return null;
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
      // Search all game states for this access code
      const { data, error } = await supabase
        .from('poker_game_state')
        .select('user_id, state');
      
      if (error) {
        console.error('❌ Erro ao buscar código de acesso:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Search through all states to find matching code
      for (const record of data) {
        const state = record.state as GameState;
        
        // Check player codes
        const foundPlayer = state.players?.find((p: Player) => p.accessCode === accessCode);
        if (foundPlayer) {
          console.log('✅ Código de jogador encontrado para usuário:', record.user_id);
          return record.user_id;
        }

        // Check dealer codes
        const foundTable = state.tableStates?.find((ts: TableState) => ts.dealerAccessCode === accessCode);
        if (foundTable) {
          console.log('✅ Código de dealer encontrado para usuário:', record.user_id);
          return record.user_id;
        }
      }

      console.log('⚠️ Código não encontrado em nenhum estado de jogo');
      return null;
    } catch (error) {
      console.error('❌ Falha ao buscar código de acesso:', error);
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
        .single();
      
      if (!error && data?.state) {
        console.log('✅ Estado carregado para usuário:', userId);
        return data.state as GameState;
      }
      
      if (error) {
        console.error('❌ Erro ao carregar estado do usuário:', error);
      }
    } catch (error) {
      console.error('❌ Falha ao carregar estado do usuário:', error);
    }
    
    return null;
  }
};
