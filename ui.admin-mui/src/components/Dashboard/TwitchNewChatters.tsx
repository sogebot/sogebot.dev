import { Backdrop, Grid, Paper, Typography } from '@mui/material';
import { capitalize } from 'lodash';
import React from 'react';

import { Trending } from './Stats/Trending';
import { Value } from './Stats/Value';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import { toggleStatsDisplay } from '../../store/pageSlice';
import theme from '../../theme';
import { classes } from '../styles';

export const DashboardStatsTwitchNewChatters: React.FC = () => {
  const key = 'newChatters';
  const [hover, setHover] = React.useState(false);
  const dispatch = useAppDispatch();
  const { translate } = useTranslation();
  const isVisible = useAppSelector(state => !state.page.hideStats.includes(key));

  const { averageStats, isStreamOnline, currentStats } = useAppSelector(state => state.page);

  const average = React.useMemo(() => averageStats.newChatters, [averageStats.newChatters]);
  const value = React.useMemo(() => currentStats.newChatters, [currentStats.newChatters]);

  return (
    <Grid item xs={6} sm={4} md={4} lg={2} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Paper sx={{
        p:        0.5,
        overflow: 'hidden',
        ...classes.parent,
      }}>
        <Typography sx={{
          transform: 'translateY(5px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {isVisible
            ? <>
              <Value current={value} isStreamOnline={isStreamOnline}/>
              <Trending current={value} average={average} isStreamOnline={isStreamOnline}/>
            </>
            : capitalize(translate('hidden'))
          }
        </Typography>
        <Typography color={theme.palette.grey[400]} variant='caption' sx={{
          pt: 2, pa: 1,
        }}>{ capitalize(translate('new-chatters')) }</Typography>
        <Backdrop open={hover} sx={classes.backdrop} onClick={() => dispatch(toggleStatsDisplay(key))}>
          <Typography variant="button">{translate('click-to-toggle-display')}</Typography>
        </Backdrop>
      </Paper>
    </Grid>
  );
};