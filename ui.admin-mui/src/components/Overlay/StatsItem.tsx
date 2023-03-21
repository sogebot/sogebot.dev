import {
  DiamondTwoTone,
  PeopleTwoTone, ScheduleTwoTone, StarTwoTone, VisibilityTwoTone,
} from '@mui/icons-material';
import {
  Box, Button, Grow, Stack, Typography,
} from '@mui/material';
import { Stats } from '@sogebot/backend/dest/database/entity/overlay';
import { random } from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { useIntervalWhen } from 'rooks';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';

export const StatsItem: React.FC<Props<Stats>> = ({ selected, active }) => {
  const lang = useSelector((state: any) => state.loader.configuration.lang );

  const [stats, setStats] = React.useState({
    bits:        0,
    followers:   0,
    subscribers: 0,
    uptime:      '00:00:00',
    viewers:     0,
  });

  React.useEffect(() => {
    console.log('====== STATS ======');
  }, []);

  useIntervalWhen(() => {
    if (active) {
      getSocket('/overlays/stats', true).emit('get', (cb: any) => {
        console.log({ cb });
        setStats(cb);
      });
    }
  }, 1000, true, true);

  const randomize = () => {
    setStats({
      bits:        random(0, 999999),
      subscribers: random(0, 10000),
      followers:   random(0, 999999),
      viewers:     random(0, 50000),
      uptime:      `${random(0, 1)}${random(0, 9)}:${random(0, 5)}${random(0, 9)}:${random(0, 5)}${random(0, 9)}`,
    });
    return;
  };

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    textTransform: 'none !important',
    position:      'relative',
    lineHeight:    'normal !important',
  }}>
    <Stack direction='row' spacing={2} sx={{
      overflow:        'hidden',
      backgroundColor: 'rgb(50 50 50 / 40%)',
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

    <Grow in={selected} unmountOnExit mountOnEnter>
      <Box sx={{
        position: 'absolute', top: `-35px`, fontSize: '10px', textAlign: 'left', left: 0,
      }}>
        <Button size='small' onClick={randomize} variant='contained'>Randomize</Button>
      </Box>
    </Grow>
  </Box>;
};