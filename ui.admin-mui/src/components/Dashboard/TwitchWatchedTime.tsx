import { Grid, Paper, Typography } from '@mui/material';
import { capitalize } from 'lodash';
import React, { useMemo } from 'react';

import { Trending } from './Stats/Trending';
import { Value } from './Stats/Value';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

export const DashboardStatsTwitchWatchedTime: React.FC = () => {
  const { translate } = useTranslation();
  const { averageStats, isStreamOnline, currentStats } = useAppSelector((state: any) => state.page);

  const average = useMemo(() => averageStats.currentWatched, [averageStats.currentWatched]);
  const value = useMemo(() => currentStats.currentWatched, [currentStats.currentWatched]);

  return (
    <Grid item xs={6} sm={4} md={4} lg={2}>
      <Paper sx={{
        p: 0.5, position: 'relative', overflow: 'hidden',
      }}>
        <Typography sx={{
          transform: 'translateY(5px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <Value current={value} isStreamOnline={isStreamOnline} type="hours"/>
          <Trending current={value} average={average} isStreamOnline={isStreamOnline}/>
        </Typography>
        <Typography color={theme.palette.grey[400]} variant='caption' sx={{
          pt: 2, pa: 1,
        }}>{ capitalize(translate('watched-time')) }</Typography>
      </Paper>
    </Grid>
  );
};