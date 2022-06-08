import { AlertColor } from '@mui/material';
import { createSlice } from '@reduxjs/toolkit';
import { PermissionsInterface } from '@sogebot/backend/src/database/entity/permissions';

export const pageSlice = createSlice({
  name: 'page',
  initialState: {
    editDialog: false,

    averageStats: {},
    isStreamOnline: false,
    permissions: null,

    widgets: {
      events: {
        showFollows: true,
        showHosts: true,
        showBits: true,
        showRaids: true,
        showRedeems: true,
        showSubgifts: true,
        showSubCommunityGifts: true,
        showSubs: true,
        showSubsPrime: true,
        showSubsTier1: true,
        showSubsTier2: true,
        showSubsTier3: true,
        showResubs: true,
        showResubsPrime: true,
        showResubsTier1: true,
        showResubsTier2: true,
        showResubsTier3: true,
        showResubsMinimal: false,
        showResubsMinimalAmount: 50,
        showTips: true,
        showTipsMinimal: false,
        showTipsMinimalAmount: 50,
      }
    },
  },
  reducers: {
    setWidgetsEvents: (state: any, action: { payload: any }) => {
      state.widgets.events = action.payload;
    },
    showEditDialog: (state: any, action: { payload: boolean }) => {
      state.editDialog = action.payload;
    },
    setStreamOnline: (state: any, action: { payload: boolean }) => {
      state.isStreamOnline = action.payload;
    },
    setAverageStats: (state: any, action: { payload: Record<string, any> }) => {
      state.averageStats = action.payload;
    },
    setPermissions: (state: any, action: { payload: PermissionsInterface[] }) => {
      state.permissions = action.payload;
    },
  }
})

// Action creators are generated for each case reducer function
export const { showEditDialog, setPermissions, setAverageStats, setStreamOnline, setWidgetsEvents } = pageSlice.actions
export default pageSlice.reducer