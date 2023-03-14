import { createSlice } from '@reduxjs/toolkit';
import { Permissions } from '@sogebot/backend/src/database/entity/permissions';

export const pageSlice = createSlice({
  name:         'page',
  initialState: {
    averageStats:   {},
    isStreamOnline: false,
    permissions:    [],

    scrollY: 0,

    widgets: {
      events: {
        showFollows:             true,
        showBits:                true,
        showRaids:               true,
        showRedeems:             true,
        showSubGifts:            true,
        showSubCommunityGifts:   true,
        showSubs:                true,
        showSubsPrime:           true,
        showSubsTier1:           true,
        showSubsTier2:           true,
        showSubsTier3:           true,
        showResubs:              true,
        showResubsPrime:         true,
        showResubsTier1:         true,
        showResubsTier2:         true,
        showResubsTier3:         true,
        showResubsMinimal:       false,
        showResubsMinimalAmount: 50,
        showTips:                true,
        showTipsMinimal:         false,
        showTipsMinimalAmount:   50,
      },
    },
  },
  reducers: {
    setWidgetsEvents: (state: any, action: { payload: any }) => {
      state.widgets.events = action.payload;
    },
    setStreamOnline: (state: any, action: { payload: any }) => {
      state.isStreamOnline = action.payload;
    },
    setAverageStats: (state: any, action: { payload: Record<string, any> }) => {
      state.averageStats = action.payload;
    },
    setPermissions: (state: any, action: { payload: Permissions[] }) => {
      state.permissions = action.payload;
    },
    setScrollY: (state: any, action: { payload: number }) => {
      state.scrollY = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setPermissions, setAverageStats, setStreamOnline, setWidgetsEvents, setScrollY } = pageSlice.actions;
export default pageSlice.reducer;