import { createSlice } from '@reduxjs/toolkit'

export const quotesSlice = createSlice({
  name: 'quotes',
  initialState: {
    tag: null,
    tags: [],
  },
  reducers: {
    setTag: (state: { tag: null | string }, action: { payload: any }) => {
      state.tag = action.payload
    },
    setTags: (state: { tags: string[] }, action: { payload: any }) => {
      state.tags = action.payload
    },
  }
})

// Action creators are generated for each case reducer function
export const { setTag, setTags } = quotesSlice.actions
export default quotesSlice.reducer