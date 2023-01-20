import { createSlice } from '@reduxjs/toolkit';

export const appBarSlice = createSlice({
  name:         'appbar',
  initialState: {
    showBulkDialog: false,
    bulkCount:      0,

    search: '',
  },
  reducers: {
    toggleBulkDialog: (state: { showBulkDialog: boolean; }) => {
      state.showBulkDialog = !state.showBulkDialog;
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
  setBulkCount, toggleBulkDialog, setSearch,
} = appBarSlice.actions;
export default appBarSlice.reducer;