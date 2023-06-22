import {
  Grid, Paper, Typography,
} from '@mui/material';
import { capitalize } from 'lodash';
import React from 'react';

import { useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

export const DashboardStatsGeneralCurrentSong: React.FC = () => {
  const { translate } = useTranslation();
  const { currentStats } = useAppSelector((state: any) => state.page);
  const song = React.useMemo(() => currentStats.currentSong, [currentStats.currentSong]);

  return (
    <Grid item xs={6} sm={4} md={4} lg={2}>
      <Paper sx={{
        p: 0.5, position: 'relative', overflow: 'hidden',
      }}>
        <Typography sx={{
          transform: 'translateY(5px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{ song || capitalize(translate('not-available')) }</Typography>
        <Typography color={theme.palette.grey[400]} variant='caption' sx={{
          pt: 2, pa: 1,
        }}>{ capitalize(translate('currentsong')) }</Typography>
      </Paper>
    </Grid>
  );
};