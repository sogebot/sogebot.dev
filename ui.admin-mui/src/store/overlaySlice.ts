import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './store';

// Define a type for the slice state
interface OverlayState {
  isParentDeleteKeyDisabled: boolean;
  randomizerId: string;
  countdown: {
    [id: string]: 'time' | 'text' | undefined
  },
  stats: {
    bits:        number,
    subscribers: number,
    followers:   number,
    viewers:     number,
    uptime:      string,
  },
  chat: {
    messages: { id: string, timestamp: number, userName: string, displayName: string, message: string, show: boolean, color?: string, badges: {url: string}[] }[],
    posY: Record<string,number>,
    fontSize: Record<string,number>,
  }
}

// Define the initial state using that type
const initialState: OverlayState = {
  isParentDeleteKeyDisabled: false,
  randomizerId:              '',
  countdown:                 {},
  stats:                     {
    bits:        0,
    subscribers: 0,
    followers:   0,
    viewers:     0,
    uptime:      '00:00:00',
  },
  chat: {
    messages: [],
    posY:     {},
    fontSize: {},
  },
};

export const overlaySlice = createSlice({
  name:     'overlay',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setParentDelKeyDisableStatus(state, action: PayloadAction<boolean>) {
      state.isParentDeleteKeyDisabled = action.payload;
    },
    setRandomizerId(state, action: PayloadAction<string>) {
      state.randomizerId = action.payload;
    },
    setCountdownShow(state, action: PayloadAction<OverlayState['countdown']>) {
      state.countdown = {
        ...state.countdown, ...action.payload,
      };
    },
    statsUpdate: (state, action: PayloadAction<OverlayState['stats']>) => {
      state.stats = action.payload;
    },
    cleanMessages: (state, action: PayloadAction<number>) => {
      state.chat.messages.filter(msg => !msg.show).forEach(msg => {
        delete state.chat.posY[msg.id];
        delete state.chat.fontSize[msg.id];
      });
      // check if message should be hidden
      state.chat.messages = [...state.chat.messages.map(msg => ({
        ...msg, show: msg.timestamp + action.payload > Date.now(),
      }))];
      // clear messages 10 seconds after hide
      state.chat.messages = [...state.chat.messages.filter(msg => msg.timestamp + action.payload + 10000 > Date.now())];
    },
    chatAddMessage: (state, action: PayloadAction<OverlayState['chat']['messages'][number]>) => {
      state.chat.messages.push(action.payload);
      state.chat.posY[action.payload.id] =  Math.floor(Math.random() * 90);
      state.chat.fontSize[action.payload.id] =  Math.floor(Math.random() * 30) - 15;
    },
    chatRemoveMessageById: (state, action: PayloadAction<string>) => {
      state.chat.messages = state.chat.messages.filter(o => o.id !== action.payload);
      delete state.chat.posY[action.payload];
      delete state.chat.fontSize[action.payload];
    },
    chatTimeout: (state, action: PayloadAction<string>) => {
      for (const msg of state.chat.messages.filter(o => o.userName === action.payload)) {
        delete state.chat.posY[msg.id];
        delete state.chat.fontSize[msg.id];
        msg.show = false;
      }
      state.chat.messages = state.chat.messages.filter(o => o.id !== action.payload);
    },
  },
});

export const {
  setParentDelKeyDisableStatus,
  setRandomizerId,
  setCountdownShow,
  statsUpdate,
  chatAddMessage, chatRemoveMessageById, chatTimeout, cleanMessages,
} = overlaySlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const getRandomizerId = (state: RootState) => state.overlay.randomizerId;
export const getParentDelKeyStatus = (state: RootState) => state.overlay.isParentDeleteKeyDisabled;
export const selectOverlayCountdown = (state: RootState) => state.overlay.countdown;
export const selectChatMessages = (state: RootState) => state.overlay.chat.messages;
export const overlayGetStats = (state: RootState) => state.overlay.stats;

export default overlaySlice.reducer;