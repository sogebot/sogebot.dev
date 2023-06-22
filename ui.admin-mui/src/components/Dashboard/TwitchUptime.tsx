import {
  Backdrop, Grid, Paper, Typography,
} from '@mui/material';
import { capitalize } from 'lodash';
import React, { useState } from 'react';
import { useIntervalWhen } from 'rooks';

import { getTime } from '../../helpers/getTime';
import { getSocket } from '../../helpers/socket';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import { setStreamOnline } from '../../store/pageSlice';
import theme from '../../theme';
import { classes } from '../styles';

export const DashboardStatsUptime: React.FC = () => {
  const { translate } = useTranslation();
  const [hover, setHover] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const dispatch = useAppDispatch();
  const { currentStats } = useAppSelector(state => state.page);

  const saveHighlight = () => {
    getSocket('/systems/highlights').emit('highlight');
  };

  useIntervalWhen(() => {
    setTimestamp(Date.now());
  }, 500, true, true);

  const uptime = React.useMemo(() => currentStats.uptime, [currentStats.uptime]);

  React.useEffect(() => {
    dispatch(setStreamOnline(uptime !== null));
  }, [uptime, dispatch]);

  return (
    <Grid item xs={6} sm={4} md={4} lg={2} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Paper sx={{
        p: 0.5, overflow: 'hidden', ...classes.parent,
      }}>
        <Typography sx={{ transform: 'translateY(5px)' }}>{ getTime(uptime, false) }</Typography>
        <Typography color={theme.palette.grey[400]} variant='caption' sx={{
          pt: 2, pa: 1,
        }} key={timestamp}>{ capitalize(translate('uptime')) }</Typography>
        <Backdrop open={hover} sx={classes.backdrop} onClick={() => saveHighlight()}>
          <Typography variant="button">{translate('click-to-highlight')}</Typography>
        </Backdrop>
      </Paper>
    </Grid>
  );
};