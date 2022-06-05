import { createSlice } from '@reduxjs/toolkit'

export const loaderSlice = createSlice({
  name: 'loader',
  initialState: {
    message: 'Connecting to bot.',
    state: false,
    configuration: {},
  },
  reducers: {
    setMessage: (state: { message: any }, action: { payload: any }) => {
      state.message = action.payload
    },
    setState: (state: { state: any }, action: { payload: any }) => {
      state.state = action.payload
    },
    setConfiguration: (state: { configuration: any }, action: { payload: any }) => {
      state.configuration = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { setMessage, setState, setConfiguration } = loaderSlice.actions
export default loaderSlice.reducer