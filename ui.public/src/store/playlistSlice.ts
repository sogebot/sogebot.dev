import { createSlice } from '@reduxjs/toolkit'

export const playlistSlice = createSlice({
  name: 'playlist',
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
export const { setTag } = playlistSlice.actions
export default playlistSlice.reducer