
import { ActionMessage, GameState } from '../types';

// BroadcastChannel allows communication between tabs/windows on the same origin
// This simulates a real-time socket connection for local demos
const CHANNEL_NAME = 'poker_sync_channel';
const channel = new BroadcastChannel(CHANNEL_NAME);

export const syncService = {
  sendMessage: (msg: ActionMessage) => {
    channel.postMessage(msg);
  },
  
  subscribe: (callback: (msg: ActionMessage) => void) => {
    const handler = (event: MessageEvent) => {
      callback(event.data);
    };
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
  },

  // Save state locally to survive refreshes
  persistState: (state: GameState) => {
    localStorage.setItem('poker_game_state', JSON.stringify(state));
  },

  loadState: (): GameState | null => {
    const saved = localStorage.getItem('poker_game_state');
    return saved ? JSON.parse(saved) : null;
  }
};
