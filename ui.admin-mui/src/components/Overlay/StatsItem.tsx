import { DiamondTwoTone, PeopleTwoTone, ScheduleTwoTone, StarTwoTone, VisibilityTwoTone } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { Stats } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import { useIntervalWhen } from 'rooks';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { overlayGetStats, statsUpdate } from '../../store/overlaySlice';

export const StatsItem: React.FC<Props<Stats>> = ({ active }) => {
  const lang = useAppSelector((state: any) => state.loader.configuration.lang );
  const stats = useAppSelector(overlayGetStats);
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    console.log('====== STATS ======');
  }, []);

  useIntervalWhen(() => {
    if (active) {
      getSocket('/overlays/stats', true).emit('get', (cb: any) => {
        console.log({ cb });
        dispatch(statsUpdate(cb));
      });
    }
  }, 1000, true, true);

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    textTransform: 'none !important',
    position:      'relative',
    lineHeight:    'normal !important',
  }}>
    <Stack direction='row' spacing={2} sx={{
      overflow:        'hidden',
      backgroundColor: 'transparent',
      padding:         '3px',
      width:           'auto',
      textShadow:      '0 0 2px #000, 0 0 4px #888, 0 0 8px #888',
      color:           'white',
      fontSize:        '20px',
      justifyContent:  'center',
    }}>
      <Stack direction='row' spacing={0.5}>
        <VisibilityTwoTone/>
        <Typography>{stats.viewers > 10000 ? Intl.NumberFormat(lang, { notation: 'compact' }).format(stats.viewers) : stats.viewers}</Typography>
      </Stack>

      <Stack direction='row' spacing={0.5}>
        <ScheduleTwoTone/>
        <Typography>{stats.uptime}</Typography>
      </Stack>

      <Stack direction='row' spacing={0.5}>
        <PeopleTwoTone/>
        <Typography>{stats.followers > 10000 ? Intl.NumberFormat(lang, { notation: 'compact' }).format(stats.followers) : stats.followers}</Typography>
      </Stack>

      <Stack direction='row' spacing={0.5}>
        <StarTwoTone/>
        <Typography>{stats.subscribers}</Typography>
      </Stack>

      <Stack direction='row' spacing={0.5}>
        <DiamondTwoTone/>
        <Typography>{stats.bits > 100000 ? Intl.NumberFormat(lang, { notation: 'compact' }).format(stats.bits) : stats.bits}</Typography>
      </Stack>
    </Stack>
  </Box>;
};