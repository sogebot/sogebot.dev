import {
  Backdrop, Grid, Paper, Typography,
} from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import { Box } from '@mui/system';
import { capitalize } from 'lodash';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useIntervalWhen } from 'rooks';

import { classes } from '~/src/components/styles';
import { getTime } from '~/src/helpers/getTime';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';
import { setStreamOnline } from '~/src/store/pageSlice';
import theme from '~/src/theme';

export const DashboardStatsUptime: React.FC = () => {
  const { translate } = useTranslation();
  const [uptime, setUptime] = useState<null | number>(null);
  const [hover, setHover] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const saveHighlight = () => {
    getSocket('/systems/highlights').emit('highlight');
  };

  useIntervalWhen(() => {
    setTimestamp(Date.now());
  }, 500, true, true);

  useEffect(() => {
    getSocket('/').on('panel::stats', (data: Record<string, any>) => {
      setUptime(data.uptime);
      dispatch(setStreamOnline(data.uptime !== null));
      setLoading(false);
    });
  }, [dispatch]);

  return (
    <Grid item xs={6} sm={4} md={4} lg={2} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Paper sx={{
        p: 0.5, overflow: 'hidden', ...classes.parent,
      }}>
        {loading && <Box sx={{
          width: '100%', position: 'absolute', top: '0', left: '0',
        }}>
          <LinearProgress />
        </Box>}
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