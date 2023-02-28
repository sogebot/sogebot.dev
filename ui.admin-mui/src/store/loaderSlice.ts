import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { AppState } from './store';

// NOT USED, KEEPING AS EXAMPLE TO USE REDUX

// Type for our state
export interface LoaderState {
  server:            null,
  connectedToServer: boolean,
  showLoginWarning:  boolean,
  showCookieManager: boolean,

  drawerWidth:           number,
  message:               null,
  state:                 boolean,
  tokensOnboardingState: boolean,
  configuration:         Record<string,any>,
  translation:           Record<string,any>,

  nextVersion:    null,
  currentVersion: null,

  core:         null,
  services:     null,
  systems:      null,
  integrations: null,

  settingsLoadingInProgress: string[],
}

// Initial state
const initialState: LoaderState = {
  server:            null,
  connectedToServer: false,
  showLoginWarning:  false,
  showCookieManager: false,

  drawerWidth:           65,
  message:               null,
  state:                 false,
  tokensOnboardingState: false,
  configuration:         {},
  translation:           {},

  nextVersion:    null,
  currentVersion: null,

  core:         null,
  services:     null,
  systems:      null,
  integrations: null,

  settingsLoadingInProgress: [],
};

// Actual Slice
export const loaderSlice = createSlice({
  name:     'loader',
  initialState,
  reducers: {
    setTranslation(state, action: PayloadAction<Record<string, any>>) {
      state.translation = action.payload;
    },
    addSettingsLoading(state, action: PayloadAction<string>) {
      state.settingsLoadingInProgress = [...state.settingsLoadingInProgress, action.payload];
    },
    rmSettingsLoading(state, action: PayloadAction<string>) {
      state.settingsLoadingInProgress = state.settingsLoadingInProgress.filter((o: string) => o !== action.payload);
    },
    setSystem: (state: any, action: { payload: any }) => {
      console.debug(`setSystem::${action.payload.type}`, action.payload.value);
      state[action.payload.type] = action.payload.value;
    },
    setMessage: (state: { message: any }, action: { payload: any }) => {
      console.debug(`setMessage`, action.payload);
      state.message = action.payload;
    },
    setState: (state: { state: any }, action: { payload: any }) => {
      console.debug(`setState`, action.payload);
      state.state = action.payload;
    },
    setTokensOnboardingState: (state: { tokensOnboardingState: any }, action: { payload: any }) => {
      console.debug(`setTokensOnboardingState`, action.payload);
      state.tokensOnboardingState = action.payload;
    },
    setConfiguration: (state: { configuration: any }, action: { payload: any }) => {
      console.debug(`setConfiguration`, action.payload);
      state.configuration = action.payload;
    },
    setCurrentVersion: (state: { currentVersion: any }, action: { payload: any }) => {
      console.debug(`setCurrentVersion`, action.payload);
      state.currentVersion = action.payload;
    },
    setNextVersion: (state: { nextVersion: any }, action: { payload: any }) => {
      console.debug(`setNextVersion`, action.payload);
      state.nextVersion = action.payload;
    },
    setServer: (state: { server: any }, action: { payload: any }) => {
      console.debug(`setServer`, action.payload);
      state.server = action.payload;
      localStorage.serverUrl = state.server;
      localStorage.serverHistory = JSON.stringify([state.server, ...JSON.parse(localStorage.serverHistory ?? '["http://localhost:20000"]')]);
    },
    setConnectedToServer: (state: { connectedToServer: any, server: any }) => {
      sessionStorage.connectedToServer = true;
      state.connectedToServer = true;
      console.debug('setConnectedToServer');
    },
    showLoginWarning: (state: any) => {
      console.debug(`showLoginWarning`, true);
      state.showLoginWarning = true;
    },
    toggleCookieManager: (state: { showCookieManager: any }, action: { payload: boolean })=> {
      console.debug(`toggleCookieManager`, action.payload);
      state.showCookieManager = action.payload;
    },
  },
});

export const { toggleCookieManager, addSettingsLoading, setTokensOnboardingState, rmSettingsLoading, setTranslation, setConnectedToServer, setServer, setMessage, setState, setConfiguration, setSystem, setCurrentVersion, setNextVersion, showLoginWarning } = loaderSlice.actions;

export const selectTranslationState = (state: AppState) => state.loader.translation;
export const selectStateState = (state: AppState) => state.loader.state;

export default loaderSlice.reducer;
