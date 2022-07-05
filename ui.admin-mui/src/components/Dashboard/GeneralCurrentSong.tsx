import {
  Grid, Paper, Typography,
} from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import { Box } from '@mui/system';
import { capitalize } from 'lodash';
import { useState } from 'react';
import { useDidMount } from 'rooks';

import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';
import theme from '~/src/theme';

export const DashboardStatsGeneralCurrentSong: React.FC = () => {
  const { translate } = useTranslation();
  const [song, setSong] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);

  useDidMount(() => {
    getSocket('/').on('panel::stats', (data: Record<string, any>) => {
      setSong(data.currentSong);
      setLoading(false);
    });
  });

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
        <Typography sx={{
          transform: 'translateY(5px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{ song || capitalize(translate('not-available')) }</Typography>
        <Typography color={theme.palette.grey[400]} variant='caption' sx={{ pt: 2, pa: 1 }}>{ capitalize(translate('currentsong')) }</Typography>
      </Paper>
    </Grid>
  );
};