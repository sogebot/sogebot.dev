import { Permissions } from '@entity/permissions';
import { createSlice } from '@reduxjs/toolkit';
import { xor } from 'lodash';

export interface PageState {
  averageStats: Record<string, any>,
  currentStats: {
    broadcasterType:             string,
    uptime:                      null | number,
    currentViewers:              number,
    currentSubscribers:          number,
    currentBits:                 number,
    currentTips:                 number,
    chatMessages:                number,
    currentFollowers:            number,
    maxViewers:                  number,
    newChatters:                 number,
    game:                        null | string,
    status:                      null | string,
    rawStatus:                   null | string,
    currentSong:                 null | string,
    currentWatched:              0,
    tags:                        string[],
    contentClassificationLabels: string[],
  },
  isStreamOnline: boolean,
  permissions:    Required<Permissions>[],
  hideStats:      string[],
  scrollY:        number,
  widgets: {
    unfold: {
      chat:    boolean,
      actions: boolean,
    }
    events: {
      showFollows:             boolean,
      showBits:                boolean,
      showRaids:               boolean,
      showRedeems:             boolean,
      showSubGifts:            boolean,
      showSubCommunityGifts:   boolean,
      showQueued?:             boolean,
      showSubs:                boolean,
      showSubsPrime:           boolean,
      showSubsTier1:           boolean,
      showSubsTier2:           boolean,
      showSubsTier3:           boolean,
      showResubs:              boolean,
      showResubsPrime:         boolean,
      showResubsTier1:         boolean,
      showResubsTier2:         boolean,
      showResubsTier3:         boolean,
      showResubsMinimal:       boolean,
      showResubsMinimalAmount: number,
      showTips:                boolean,
      showTipsMinimal:         boolean,
      showTipsMinimalAmount:   number,
    },
  },
}

const initialState: PageState = {
  averageStats: {},
  currentStats: {
    broadcasterType:             '',
    uptime:                      null,
    currentViewers:              0,
    currentSubscribers:          0,
    currentBits:                 0,
    currentTips:                 0,
    chatMessages:                0,
    currentFollowers:            0,
    maxViewers:                  0,
    newChatters:                 0,
    game:                        null,
    status:                      null,
    rawStatus:                   null,
    currentSong:                 null,
    currentWatched:              0,
    tags:                        [],
    contentClassificationLabels: [],
  },
  isStreamOnline: false,
  permissions:    [],
  hideStats:      JSON.parse(localStorage.getItem('panel::hideStats') ?? '[]'),

  scrollY: 0,

  widgets: {
    unfold: {
      chat:    JSON.parse(localStorage.getItem(`${localStorage.server}::chat_unfold`) ?? 'true'),
      actions: JSON.parse(localStorage.getItem(`${localStorage.server}::action_unfold`) ?? 'true'),
    },
    events: {
      showFollows:             true,
      showBits:                true,
      showRaids:               true,
      showRedeems:             true,
      showSubGifts:            true,
      showSubCommunityGifts:   true,
      showQueued:              true,
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
};

export const pageSlice = createSlice({
  name:     'page',
  initialState,
  reducers: {
    toggleStatsDisplay: (state, action: { payload: string }) => {
      state.hideStats = xor(state.hideStats, [action.payload]);
      localStorage.setItem('panel::hideStats', JSON.stringify(state.hideStats));
    },
    toggleUnfold: (state: any, action: { payload: any }) => {
      state.widgets[action.payload] = !state.widgets[action.payload];
      if (action.payload === 'chat') {
        localStorage.setItem(`${localStorage.server}::chat_unfold`, JSON.stringify(state.widgets[action.payload]));
      }
      if (action.payload === 'actions') {
        localStorage.setItem('actions_unfold', JSON.stringify(state.widgets[action.payload]));
      }
    },
    setWidgetsEvents: (state: any, action: { payload: any }) => {
      state.widgets.events = action.payload;
    },
    setStreamOnline: (state: any, action: { payload: any }) => {
      state.isStreamOnline = action.payload;
    },
    setAverageStats: (state: any, action: { payload: Record<string, any> }) => {
      state.averageStats = action.payload;
    },
    setCurrentStats: (state: any, action: { payload: Record<string, any> }) => {
      state.currentStats = action.payload;
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
export const { toggleStatsDisplay, toggleUnfold, setPermissions,
  setAverageStats, setCurrentStats, setStreamOnline,
  setWidgetsEvents, setScrollY } = pageSlice.actions;
export default pageSlice.reducer;