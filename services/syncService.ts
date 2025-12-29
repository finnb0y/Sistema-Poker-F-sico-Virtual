
import { ActionMessage, GameState } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Game session ID is now user-specific
const getGameSessionId = (userId: string) => `poker_game_session_${userId}`;
const POKER_CHANNEL = 'poker_actions';

// Current user ID - must be set before using sync service
let currentUserId: string | null = null;

// BroadcastChannel allows communication between tabs/windows on the same origin
// This is used as fallback when Supabase is not configured
const CHANNEL_NAME = 'poker_sync_channel';
let localChannel: BroadcastChannel | null = null;
let realtimeChannel: RealtimeChannel | null = null;

// Initialize local BroadcastChannel as fallback
try {
  localChannel = new BroadcastChannel(CHANNEL_NAME);
} catch (error) {
  console.warn('BroadcastChannel not supported, using fallback');
}

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
    if (!currentUserId) {
      console.error('Cannot send message: user not authenticated');
      return;
    }

    // Try Supabase first for multi-device sync
    if (isSupabaseConfigured() && supabase) {
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
          console.error('Failed to send message via Supabase:', error);
          // Fallback to local channel
          if (localChannel) {
            localChannel.postMessage(msg);
          }
        }
      } catch (error) {
        console.error('Supabase error:', error);
        // Fallback to local channel
        if (localChannel) {
          localChannel.postMessage(msg);
        }
      }
    } else if (localChannel) {
      // Use local BroadcastChannel when Supabase is not configured
      try {
        localChannel.postMessage(msg);
      } catch (error) {
        console.error('Failed to send message via BroadcastChannel:', error);
      }
    }
  },
  
  subscribe: (callback: (msg: ActionMessage) => void) => {
    if (!currentUserId) {
      console.warn('⚠️ Subscrevendo sem usuário autenticado - modo local apenas');
      // In local mode (without authentication), we can still use BroadcastChannel
      // This allows players/dealers with access codes to work
      // Only admin features require authentication
    }

    const cleanupFunctions: (() => void)[] = [];
    
    // Subscribe to Supabase Realtime if configured AND user is authenticated
    if (isSupabaseConfigured() && supabase && currentUserId) {
      const userSessionId = getGameSessionId(currentUserId);
      console.log('🔄 Inscrevendo-se no Supabase Realtime para sincronização multi-dispositivo...');
      
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
            console.log('✅ Conectado ao Supabase Realtime - sincronização ativa');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('❌ Erro na conexão com Supabase:', status);
          }
        });
      
      cleanupFunctions.push(() => {
        if (realtimeChannel) {
          console.log('🔌 Desconectando do Supabase Realtime...');
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }
      });
    } else {
      console.log('📱 Modo local ativo - sincronização apenas entre abas do mesmo navegador');
    }
    
    // Also subscribe to local BroadcastChannel for same-device sync
    if (localChannel) {
      const handler = (event: MessageEvent) => {
        try {
          callback(event.data);
        } catch (error) {
          console.error('❌ Falha ao processar mensagem do BroadcastChannel:', error);
        }
      };
      localChannel.addEventListener('message', handler);
      cleanupFunctions.push(() => localChannel?.removeEventListener('message', handler));
    }
    
    if (cleanupFunctions.length === 0) {
      console.warn('⚠️ Nenhum método de sincronização disponível');
      return () => { /* No sync available - return no-op cleanup function */ };
    }
    
    // Return cleanup function that calls all registered cleanups
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  },

  // Save state to Supabase only (no localStorage for game state)
  persistState: async (state: GameState) => {
    if (!currentUserId) {
      console.error('Cannot persist state: user not authenticated');
      return;
    }

    // Only save to Supabase for multi-device sync
    if (isSupabaseConfigured() && supabase) {
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
          console.error('Failed to persist state to Supabase:', error);
        }
      } catch (error) {
        console.error('Supabase persist error:', error);
      }
    } else {
      console.warn('Supabase not configured - state will not be persisted');
    }
  },

  loadState: async (): Promise<GameState | null> => {
    if (!currentUserId) {
      console.error('Cannot load state: user not authenticated');
      return null;
    }

    // Load from Supabase only
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('poker_game_state')
          .select('state')
          .eq('session_id', getGameSessionId(currentUserId))
          .eq('user_id', currentUserId)
          .single();
        
        if (!error && data?.state) {
          return data.state as GameState;
        }
      } catch (error) {
        console.error('Supabase load error:', error);
      }
    }
    
    return null;
  }
};
