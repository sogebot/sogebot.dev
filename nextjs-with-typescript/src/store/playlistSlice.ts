import { createSlice } from '@reduxjs/toolkit'

export const playlistSlice = createSlice({
  name: 'playlist',
  initialState: {
    tag: null,
    search: '',
  },
  reducers: {
    setTag: (state: { tag: null | string }, action: { payload: any }) => {
      state.tag = action.payload
    },
    setSearch: (state: { search: string }, action: { payload: any }) => {
      state.search = action.payload
    },
  }
})

// Action creators are generated for each case reducer function
export const { setTag, setSearch } = playlistSlice.actions
export default playlistSlice.reducer