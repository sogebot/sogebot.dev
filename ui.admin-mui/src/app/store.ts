import { configureStore } from '@reduxjs/toolkit';

import appbarReducer from '../store/appbarSlice';
import loaderReducer from '../store/loaderSlice';
import pageReducer from '../store/pageSlice';
import quickActionReducer from '../store/quickActionsSlice';
import userReducer from '../store/userSlice';

export default configureStore({
  reducer: {
    loader:      loaderReducer,
    appbar:      appbarReducer,
    page:        pageReducer,
    user:        userReducer,
    quickaction: quickActionReducer,
  },
});