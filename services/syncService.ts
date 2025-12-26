
import { ActionMessage, GameState } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Game session ID - shared across all clients in the same game
const GAME_SESSION_ID = 'poker_game_session';
const POKER_CHANNEL = 'poker_actions';

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
  sendMessage: async (msg: ActionMessage) => {
    // Try Supabase first for multi-device sync
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('poker_actions')
          .insert({
            session_id: GAME_SESSION_ID,
            action_type: msg.type,
            payload: msg.payload,
            sender_id: msg.senderId,
            created_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Failed to send message via Supabase:', error);
          // Fallback to local channel
          if (localChannel) {
            localChannel.postMessage(msg);
          }
        } else {
          console.log('Message sent via Supabase');
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
    const cleanupFunctions: (() => void)[] = [];
    
    // Subscribe to Supabase Realtime if configured
    if (isSupabaseConfigured() && supabase) {
      console.log('Subscribing to Supabase Realtime...');
      
      realtimeChannel = supabase
        .channel(POKER_CHANNEL)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'poker_actions',
            filter: `session_id=eq.${GAME_SESSION_ID}`
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
              console.error('Failed to process Supabase message:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log('Supabase subscription status:', status);
        });
      
      cleanupFunctions.push(() => {
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }
      });
    }
    
    // Also subscribe to local BroadcastChannel for same-device sync
    if (localChannel) {
      const handler = (event: MessageEvent) => {
        try {
          callback(event.data);
        } catch (error) {
          console.error('Failed to process BroadcastChannel message:', error);
        }
      };
      localChannel.addEventListener('message', handler);
      cleanupFunctions.push(() => localChannel?.removeEventListener('message', handler));
    }
    
    if (cleanupFunctions.length === 0) {
      console.warn('No sync method available');
      return () => { /* No sync available - return no-op cleanup function */ };
    }
    
    // Return cleanup function that calls all registered cleanups
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  },

  // Save state to Supabase and localStorage
  persistState: async (state: GameState) => {
    // Always save to localStorage for immediate access
    try {
      localStorage.setItem('poker_game_state', JSON.stringify(state));
      console.log('Estado salvo no localStorage');
    } catch (error) {
      console.error('Erro ao salvar estado no localStorage:', error);
    }
    
    // Also save to Supabase for multi-device sync
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('poker_game_state')
          .upsert({
            session_id: GAME_SESSION_ID,
            state: state,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'session_id'
          });
        
        if (error) {
          console.error('Failed to persist state to Supabase:', error);
        } else {
          console.log('Estado salvo no Supabase');
        }
      } catch (error) {
        console.error('Supabase persist error:', error);
      }
    }
  },

  loadState: async (): Promise<GameState | null> => {
    // Try loading from Supabase first for most up-to-date state
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('poker_game_state')
          .select('state')
          .eq('session_id', GAME_SESSION_ID)
          .single();
        
        if (!error && data?.state) {
          console.log('Estado recuperado do Supabase');
          // Also update localStorage with the latest state
          try {
            localStorage.setItem('poker_game_state', JSON.stringify(data.state));
          } catch (e) {
            console.error('Failed to update localStorage:', e);
          }
          return data.state as GameState;
        }
      } catch (error) {
        console.error('Supabase load error:', error);
      }
    }
    
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('poker_game_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Estado recuperado do localStorage');
        return parsed;
      }
      console.log('Nenhum estado encontrado');
      return null;
    } catch (error) {
      console.error('Erro ao carregar estado do localStorage:', error);
      return null;
    }
  }
};
