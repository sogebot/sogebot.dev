import { Grid } from '@mui/material';
import axios from 'axios';
import { isEqual } from 'lodash';
import React from 'react';
import { useIntervalWhen } from 'rooks';

import { DashboardStatsGeneralCurrentSong } from './GeneralCurrentSong';
import { DashboardStatsGeneralTips } from './GeneralTips';
import { DashboardStatsTwitchBits } from './TwitchBits';
import { DashboardStatsTwitchChatMessages } from './TwitchChatMessages';
import { DashboardStatsTwitchFollowers } from './TwitchFollowers';
import { DashboardStatsTwitchMaxViewers } from './TwitchMaxViewers';
import { DashboardStatsTwitchNewChatters } from './TwitchNewChatters';
import { DashboardStatsTwitchStatus } from './TwitchStatus';
import { DashboardStatsTwitchSubscribers } from './TwitchSubscribers';
import { DashboardStatsUptime } from './TwitchUptime';
import { DashboardStatsTwitchViewers } from './TwitchViewers';
import { DashboardStatsTwitchWatchedTime } from './TwitchWatchedTime';
import getAccessToken from '../../getAccessToken';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { setAverageStats, setCurrentStats } from '../../store/pageSlice';

export const DashboardStats: React.FC = () => {
  const { configuration } = useAppSelector((state: any) => state.loader);
  const dispatch = useAppDispatch();
  const averageStats = useAppSelector((state: any) => state.page.averageStats);
  const currentStats = useAppSelector((state: any) => state.page.currentStats);

  useIntervalWhen(() => {
    axios.get(`/api/stats/latest`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(res => {
        if (res.status === 200) {
          const data = res.data;
          console.groupCollapsed('stats::latest');
          console.log({
            averageStats, data,
          });

          // this is causing rerenders (not sure why, so we force it only to change on actual change)
          if (!isEqual(data, averageStats)) {
            dispatch(setAverageStats(data));
          }
          console.groupEnd();
        }
      })
      .catch(console.error);

    axios.get(`/api/stats/current`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(res => {
        if (res.status === 200) {
          const data = res.data;
          console.groupCollapsed('stats::current');
          console.log({
            currentStats, data,
          });

          // this is causing rerenders (not sure why, so we force it only to change on actual change)
          if (!isEqual(data, currentStats)) {
            dispatch(setCurrentStats(data));
          }
          console.groupEnd();
        }
      })
      .catch(console.error);
  }, 10000, true, true);

  return (
    <Grid container spacing={0.5}>
      {Object.keys(configuration).length > 0 && configuration.core.dashboard.µWidgets.map((item: string) => {
        const type = `${item.split('|')[0]}-${item.split('|')[1].replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        switch(type) {
          case 'general-tips':
            return (
              <DashboardStatsGeneralTips key={item}/>
            );
          case 'general-current-song':
            return (
              <DashboardStatsGeneralCurrentSong key={item}/>
            );
          case 'twitch-status':
            return (
              <DashboardStatsTwitchStatus key={item}/>
            );
          case 'twitch-bits':
            return (
              <DashboardStatsTwitchBits key={item}/>
            );
          case 'twitch-viewers':
            return (
              <DashboardStatsTwitchViewers key={item}/>
            );
          case 'twitch-watched-time':
            return (
              <DashboardStatsTwitchWatchedTime key={item}/>
            );
          case 'twitch-chat-messages':
            return (
              <DashboardStatsTwitchChatMessages key={item}/>
            );
          case 'twitch-subscribers':
            return (
              <DashboardStatsTwitchSubscribers key={item}/>
            );
          case 'twitch-followers':
            return (
              <DashboardStatsTwitchFollowers key={item}/>
            );
          case 'twitch-new-chatters':
            return (
              <DashboardStatsTwitchNewChatters key={item}/>
            );
          case 'twitch-max-viewers':
            return (
              <DashboardStatsTwitchMaxViewers key={item}/>
            );
          case 'twitch-uptime':
            return (
              <DashboardStatsUptime key={item}/>
            );
          default:
            return (
              <div key={item}>{type}</div>
            );
        }
      })}
    </Grid>
  );
};