import { createSlice } from '@reduxjs/toolkit';

export const loaderSlice = createSlice({
  name:         'loader',
  initialState: {
    server:            null,
    compatibleVersion: '15.5.0',
    connectedToServer: false,
    showLoginWarning:  false,

    drawerWidth:   65,
    message:       null,
    state:         false,
    configuration: {},
    translation:   {},

    nextVersion:    null,
    currentVersion: null,

    core:         null,
    services:     null,
    systems:      null,
    integrations: null,
  },
  reducers: {
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
    setConfiguration: (state: { configuration: any }, action: { payload: any }) => {
      console.debug(`setConfiguration`, action.payload);
      state.configuration = action.payload;
    },
    setTranslation: (state: { translation: any }, action: { payload: any }) => {
      state.translation = action.payload;
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
      sessionStorage.serverUrl = state.server;
      sessionStorage.serverHistory = JSON.stringify([state.server, ...JSON.parse(localStorage.serverHistory ?? '["http://localhost:20000"]')]);
    },
    setConnectedToServer: (state: { connectedToServer: any, server: any }) => {
      sessionStorage.connectedToServer = true;
      state.connectedToServer = true;
      const wsUrl = state.server.replace('https', '').replace('http', '');
      console.debug('setConnectedToServer', );
      sessionStorage.wsUrl = `${(state.server.startsWith('https') ? 'wss' : 'ws')}${wsUrl}`;
    },
    showLoginWarning: (state: any) => {
      state.showLoginWarning = true;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setTranslation, setConnectedToServer, setServer, setMessage, setState, setConfiguration, setSystem, setCurrentVersion, setNextVersion } = loaderSlice.actions;
export default loaderSlice.reducer;