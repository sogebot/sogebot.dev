import {
  Action, configureStore, ThunkAction,
} from '@reduxjs/toolkit';

import { appBarSlice } from './appbarSlice';
import { hltbSlice } from './hltbSlice';
import { loaderSlice } from './loaderSlice';
import { pageSlice } from './pageSlice';
import { quickActionSlice } from './quickActionsSlice';
import { userSlice } from './userSlice';

const makeStore = () =>
  configureStore({
    reducer: {
      [appBarSlice.name]:      appBarSlice.reducer,
      [hltbSlice.name]:        hltbSlice.reducer,
      [loaderSlice.name]:      loaderSlice.reducer,
      [pageSlice.name]:        pageSlice.reducer,
      [quickActionSlice.name]: quickActionSlice.reducer,
      [userSlice.name]:        userSlice.reducer,
    },
    devTools: true,
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore['getState']>;
export type AppThunk<ReturnType = void> = ThunkAction<
ReturnType,
AppState,
unknown,
Action
>;

export default makeStore;
