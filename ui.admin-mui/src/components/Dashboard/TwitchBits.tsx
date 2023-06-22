import {
  Grid, Paper, Typography,
} from '@mui/material';
import { capitalize } from 'lodash';
import React from 'react';

import { Trending } from './Stats/Trending';
import { Value } from './Stats/Value';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

export const DashboardStatsTwitchBits: React.FC = () => {
  const { translate } = useTranslation();
  const { averageStats, isStreamOnline, currentStats } = useAppSelector(state => state.page);

  const average = React.useMemo(() => averageStats.currentBits, [averageStats.currentBits]);
  const value = React.useMemo(() => currentStats.currentBits, [currentStats.currentBits]);
  const type = React.useMemo(() => currentStats.broadcasterType, [currentStats.broadcasterType]);

  return (
    <Grid item xs={6} sm={4} md={4} lg={2}>
      <Paper sx={{
        p: 0.5, position: 'relative', overflow: 'hidden',
      }}>
        <Typography sx={{
          transform: 'translateY(5px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {type !== '' && (<><Value current={value} isStreamOnline={isStreamOnline} type="bigNumber" /><Trending current={value} average={average} isStreamOnline={isStreamOnline} /></>)}
          {type === '' && <span>{translate('not-available')}</span>}
        </Typography>
        <Typography color={theme.palette.grey[400]} variant='caption' sx={{
          pt: 2, pa: 1,
        }}>{ capitalize(translate('bits')) }</Typography>
      </Paper>
    </Grid>
  );
};