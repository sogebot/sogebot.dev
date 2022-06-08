import { configureStore } from '@reduxjs/toolkit'
import loaderReducer from '../store/loaderSlice'
import appbarReducer from '../store/appbarSlice'
import pageReducer from '../store/pageSlice'
import userReducer from '../store/userSlice'
import quickActionReducer from '../store/quickActionsSlice'

export default configureStore({
  reducer: {
    loader: loaderReducer,
    appbar: appbarReducer,
    page: pageReducer,
    user: userReducer,
    quickaction: quickActionReducer,
  }
})