import {
  Grid, Paper, Typography,
} from '@mui/material';
import { capitalize } from 'lodash';
import React from 'react';

import { useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

export const DashboardStatsTwitchViewers: React.FC = () => {
  const { translate } = useTranslation();
  const { isStreamOnline, currentStats } = useAppSelector(state => state.page);
  const value = React.useMemo(() => currentStats.currentViewers, [currentStats.currentViewers]);
  return (
    <Grid item xs={6} sm={4} md={4} lg={2}>
      <Paper sx={{
        p: 0.5, position: 'relative', overflow: 'hidden',
      }}>
        <Typography sx={{ transform: 'translateY(5px)' }}>{ isStreamOnline ? value : 0 }</Typography>
        <Typography color={theme.palette.grey[400]} variant='caption' sx={{
          pt: 2, pa: 1,
        }}>{ capitalize(translate('viewers')) }</Typography>
      </Paper>
    </Grid>
  );
};