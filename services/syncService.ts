
import { ActionMessage, GameState } from '../types';

// BroadcastChannel allows communication between tabs/windows on the same origin
// This simulates a real-time socket connection for local demos
const CHANNEL_NAME = 'poker_sync_channel';
let channel: BroadcastChannel | null = null;

try {
  channel = new BroadcastChannel(CHANNEL_NAME);
} catch (error) {
  console.warn('BroadcastChannel not supported, using fallback');
}

export const syncService = {
  sendMessage: (msg: ActionMessage) => {
    if (channel) {
      try {
        channel.postMessage(msg);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  },
  
  subscribe: (callback: (msg: ActionMessage) => void) => {
    // If BroadcastChannel is not available, return a no-op cleanup function
    if (!channel) {
      console.warn('BroadcastChannel not available, sync disabled');
      return () => { /* No cleanup needed when channel is unavailable */ };
    }
    
    const handler = (event: MessageEvent) => {
      try {
        callback(event.data);
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    };
    channel.addEventListener('message', handler);
    return () => channel?.removeEventListener('message', handler);
  },

  // Save state locally to survive refreshes
  persistState: (state: GameState) => {
    try {
      localStorage.setItem('poker_game_state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  },

  loadState: (): GameState | null => {
    try {
      const saved = localStorage.getItem('poker_game_state');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load state:', error);
      return null;
    }
  }
};
