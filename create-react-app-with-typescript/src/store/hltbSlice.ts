import { createSlice } from '@reduxjs/toolkit';

export const hltbSlice = createSlice({
  name:         'hltb',
  initialState: {
    toggle: null, offset: null, 
  },
  reducers: {
    setToggle: (state, action) => {
      state.toggle = action.payload;
    },
    setOffset: (state, action) => {
      state.offset = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setToggle, setOffset,
} = hltbSlice.actions;
export default hltbSlice.reducer;