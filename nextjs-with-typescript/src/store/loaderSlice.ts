import { createSlice } from '@reduxjs/toolkit'

export const loaderSlice = createSlice({
  name: 'loader',
  initialState: {
    message: 'Connecting to bot.',
    state: false,
  },
  reducers: {
    setMessage: (state: { message: any }, action: { payload: any }) => {
      state.message = action.payload
    },
    setState: (state: { state: any }, action: { payload: any }) => {
      state.state = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { setMessage, setState } = loaderSlice.actions
export default loaderSlice.reducer