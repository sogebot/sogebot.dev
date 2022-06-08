import {
  Grid, Paper, Typography,
} from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import { Box } from '@mui/system';
import { capitalize } from 'lodash';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getSocket } from '~/src/helpers/socket';
import translate from '~/src/helpers/translate';
import theme from '~/src/theme';

export const DashboardStatsTwitchViewers: React.FC = () => {
  const [viewers, setViewers] = useState<null | number>(null);
  const [loading, setLoading] = useState(true);
  const { isStreamOnline } = useSelector((state: any) => state.page);

  useEffect(() => {
    getSocket('/').on('panel::stats', async (data: Record<string, any>) => {
      setViewers(data.currentViewers);
      setLoading(false);
    });
  }, []);
  return (
    <Grid item xs={6} sm={4} md={4} lg={2}>
      <Paper sx={{
        p: 0.5, position: 'relative', overflow: 'hidden',
      }}>
        {loading && <Box sx={{
          width: '100%', position: 'absolute', top: '0', left: '0',
        }}>
          <LinearProgress />
        </Box>}
        <Typography sx={{ transform: 'translateY(5px)' }}>{ isStreamOnline ? viewers : 0 }</Typography>
        <Typography color={theme.palette.grey[400]} variant='caption' sx={{ pt: 2, pa: 1 }}>{ capitalize(translate('viewers')) }</Typography>
      </Paper>
    </Grid>
  );
};