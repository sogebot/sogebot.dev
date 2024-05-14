import { Backdrop, Grid, Paper, Typography } from '@mui/material';
import axios from 'axios';
import { capitalize } from 'lodash';
import React, { useState } from 'react';
import { useIntervalWhen } from 'rooks';

import getAccessToken from '../../getAccessToken';
import { getTime } from '../../helpers/getTime';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import { setStreamOnline } from '../../store/pageSlice';
import theme from '../../theme';
import { classes } from '../styles';

export const DashboardStatsUptime: React.FC = () => {
  const { translate } = useTranslation();
  const [hover, setHover] = useState(false);
  const dispatch = useAppDispatch();
  const { currentStats } = useAppSelector(state => state.page);

  const saveHighlight = () => {
    axios.post(`/api/systems/highlights`, null, { headers: { authorization: `Bearer ${getAccessToken()}` } });
  };

  const uptime = React.useMemo(() => currentStats.uptime, [currentStats.uptime]);

  React.useEffect(() => {
    dispatch(setStreamOnline(uptime !== null));
  }, [uptime, dispatch]);

  const [ timestamp, setTimestamp ] = React.useState(Date.now());
  useIntervalWhen(() => {
    setTimestamp(Date.now());
  }, 1000, uptime !== null, true);

  return (
    <Grid item xs={6} sm={4} md={4} lg={2} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Paper sx={{
        p: 0.5, overflow: 'hidden', ...classes.parent,
      }}>
        <Typography sx={{ transform: 'translateY(5px)' }} key={timestamp}>{ getTime(uptime, false) }</Typography>
        <Typography color={theme.palette.grey[400]} variant='caption' sx={{
          pt: 2, pa: 1,
        }}>{ capitalize(translate('uptime')) }</Typography>
        <Backdrop open={hover} sx={classes.backdrop} onClick={() => saveHighlight()}>
          <Typography variant="button">{translate('click-to-highlight')}</Typography>
        </Backdrop>
      </Paper>
    </Grid>
  );
};