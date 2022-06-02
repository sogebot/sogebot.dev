import { configureStore } from '@reduxjs/toolkit'
import loaderReducer from '../store/loaderSlice'

export default configureStore({
  reducer: {
    loader: loaderReducer
  }
})