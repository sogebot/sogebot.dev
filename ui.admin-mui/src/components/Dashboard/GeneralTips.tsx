import {
  Grid, Paper, Typography,
} from '@mui/material';
import { capitalize } from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';

import { Trending } from './Stats/Trending';
import { Value } from './Stats/Value';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

export const DashboardStatsGeneralTips: React.FC = () => {
  const { translate } = useTranslation();
  const { averageStats, isStreamOnline, currentStats } = useSelector((state: any) => state.page);

  const average = React.useMemo(() => averageStats.currentTips, [averageStats.currentTips]);
  const value = React.useMemo(() => currentStats.currentTips, [currentStats.currentTips]);

  return (
    <Grid item xs={6} sm={4} md={4} lg={2}>
      <Paper sx={{
        p: 0.5, position: 'relative', overflow: 'hidden',
      }}>
        <Typography sx={{
          transform: 'translateY(5px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <Value current={value} isStreamOnline={isStreamOnline} type="currency" />
          <Trending current={value} average={average} isStreamOnline={isStreamOnline} />
        </Typography>
        <Typography color={theme.palette.grey[400]} variant='caption' sx={{
          pt: 2, pa: 1,
        }}>{ capitalize(translate('tips')) }</Typography>
      </Paper>
    </Grid>
  );
};