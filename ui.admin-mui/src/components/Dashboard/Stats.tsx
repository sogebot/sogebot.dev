import { Grid } from '@mui/material';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntervalWhen } from 'rooks';

import { getSocket } from '~/src/helpers/socket';
import { setAverageStats } from '~/src/store/pageSlice';

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

export const DashboardStats: React.FC = () => {
  const { configuration } = useSelector((state: any) => state.loader);
  const isStreamOnline = useSelector<any, boolean>((state: any) => state.page.isStreamOnline);
  const dispatch = useDispatch();

  useIntervalWhen(() => {
    getSocket('/').emit('getLatestStats', (err, data: any) => {
      console.groupCollapsed('navbar::getLatestStats');
      console.log(data);
      if (err) {
        return console.error(err);
      }
      console.groupEnd();
      dispatch(setAverageStats(data));
    });
  }, 10000, !isStreamOnline, true);

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