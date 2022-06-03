import { configureStore } from '@reduxjs/toolkit'
import loaderReducer from '../store/loaderSlice'
import quotesReducer from '../store/quotesSlice'
import playlistReducer from '../store/playlistSlice'

export default configureStore({
  reducer: {
    loader: loaderReducer,
    quotes: quotesReducer,
    playlist: playlistReducer,
  }
})