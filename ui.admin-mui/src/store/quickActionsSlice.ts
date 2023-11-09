import { createSlice } from '@reduxjs/toolkit';

type List = { id: string, label: string, };
export interface State {
  randomizers: List[],
  countdowns:  List[],
  stopwatchs:  List[],
  marathons:   List[]
}

const initialState: State = {
  randomizers: [],
  countdowns:  [],
  marathons:   [],
  stopwatchs:  [],
};

export const quickActionSlice = createSlice({
  name:     'quickaction',
  initialState,
  reducers: {
    setRandomizers: (state, action) => {
      state.randomizers = action.payload;
    },
    setCountdowns: (state, action) => {
      state.countdowns = action.payload;
    },
    setMarathons: (state, action) => {
      state.marathons = action.payload;
    },
    setStopwatchs: (state, action) => {
      state.stopwatchs = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setRandomizers, setCountdowns, setStopwatchs, setMarathons,
} = quickActionSlice.actions;
export default quickActionSlice.reducer;