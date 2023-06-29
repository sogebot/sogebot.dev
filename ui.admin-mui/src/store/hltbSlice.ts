import { createSlice } from '@reduxjs/toolkit';

export interface HLTBState {
  toggle: null | { createdAt: string, type: 'main' | 'extra' | 'completionist', id: string }
  offset: null | { createdAt: string, value: number, id: string }
}

const initialState: HLTBState = {
  toggle: null, offset: null,
};

export const hltbSlice = createSlice({
  name:     'hltb',
  initialState,
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