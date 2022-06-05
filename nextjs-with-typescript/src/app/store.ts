import { configureStore } from '@reduxjs/toolkit'
import loaderReducer from '../store/loaderSlice'
import quotesReducer from '../store/quotesSlice'
import playlistReducer from '../store/playlistSlice'
import searchReducer from '../store/searchSlice'
import userReducer from '../store/userSlice'

export default configureStore({
  reducer: {
    loader: loaderReducer,
    quotes: quotesReducer,
    playlist: playlistReducer,
    search: searchReducer,
    user: userReducer,
  }
})