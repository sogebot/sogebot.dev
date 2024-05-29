import { configureStore } from '@reduxjs/toolkit';

import { appBarSlice } from './appbarSlice';
import { hltbSlice } from './hltbSlice';
import { loaderSlice } from './loaderSlice';
import { overlaySlice } from './overlaySlice';
import { pageSlice } from './pageSlice';
import { quickActionSlice } from './quickActionsSlice';

export const store = configureStore({
  reducer: {
    [appBarSlice.name]:      appBarSlice.reducer,
    [hltbSlice.name]:        hltbSlice.reducer,
    [loaderSlice.name]:      loaderSlice.reducer,
    [pageSlice.name]:        pageSlice.reducer,
    [quickActionSlice.name]: quickActionSlice.reducer,
    [overlaySlice.name]:     overlaySlice.reducer,
  },
  devTools: true,
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
