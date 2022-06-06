import { createSlice } from '@reduxjs/toolkit'

export const searchSlice = createSlice({
  name: 'search',
  initialState: {
    haveSearch: false,
    search: '',
  },
  reducers: {
    enableSearch: (state) => {
      state.search = '';
      state.haveSearch = true;
    },
    disableSearch: (state) => {
      state.search = '';
      state.haveSearch = false;
    },
    setSearch: (state, action) => {
      state.search = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { enableSearch, disableSearch, setSearch } = searchSlice.actions
export default searchSlice.reducer