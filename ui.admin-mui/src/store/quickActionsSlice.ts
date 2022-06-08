import { createSlice } from '@reduxjs/toolkit'

export const quickActionSlice = createSlice({
  name: 'quickaction',
  initialState: {
    randomizers: [],
    countdowns: [],
    marathons: [],
    stopwatchs: [],
  },
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
  }
})

// Action creators are generated for each case reducer function
export const {
  setRandomizers, setCountdowns, setStopwatchs, setMarathons
} = quickActionSlice.actions
export default quickActionSlice.reducer