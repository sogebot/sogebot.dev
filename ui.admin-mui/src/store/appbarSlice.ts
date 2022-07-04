import { createSlice } from '@reduxjs/toolkit';

export const appBarSlice = createSlice({
  name:         'appbar',
  initialState: {
    haveBulk:       false,
    showBulkDialog: false,
    bulkCount:      0,

    search: '',
  },
  reducers: {
    toggleBulkDialog: (state: { showBulkDialog: boolean; }) => {
      state.showBulkDialog = !state.showBulkDialog;
    },
    enableBulk: (state: { haveBulk: boolean; }) => {
      state.haveBulk = true;
    },
    disableBulk: (state: { bulkCount: number; haveBulk: boolean; }) => {
      state.bulkCount = 0;
      state.haveBulk = false;
    },
    setBulkCount: (state: { bulkCount: any; }, action: { payload: any; }) => {
      state.bulkCount = action.payload;
    },
    setSearch: (state: { search: string }, action: { payload: any; }) => {
      state.search = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  enableBulk, disableBulk, setBulkCount, toggleBulkDialog, setSearch,
} = appBarSlice.actions;
export default appBarSlice.reducer;