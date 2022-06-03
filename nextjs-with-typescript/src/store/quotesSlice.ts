import { createSlice } from '@reduxjs/toolkit'

export const quotesSlice = createSlice({
  name: 'quotes',
  initialState: {
    tag: null,
  },
  reducers: {
    setTag: (state: { tag: null | string }, action: { payload: any }) => {
      state.tag = action.payload
    },
  }
})

// Action creators are generated for each case reducer function
export const { setTag } = quotesSlice.actions
export default quotesSlice.reducer