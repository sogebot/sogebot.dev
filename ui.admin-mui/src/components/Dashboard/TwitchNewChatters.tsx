import {
  Grid, Paper, Typography,
} from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import { Box } from '@mui/system';
import { capitalize } from 'lodash';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDidMount } from 'rooks';

import { Trending } from './Stats/Trending';
import { Value } from './Stats/Value';
import { getSocket } from '../../helpers/socket';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

export const DashboardStatsTwitchNewChatters: React.FC = () => {
  const { translate } = useTranslation();
  const [value, setValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { averageStats, isStreamOnline } = useSelector((state: any) => state.page);

  const average = useMemo(() => {
    return averageStats.newChatters;
  }, [averageStats]);

  useDidMount(() => {
    getSocket('/').on('panel::stats', async (data: Record<string, any>) => {
      setValue(data.newChatters);
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
        }}>
          <Value current={value} isStreamOnline={isStreamOnline}/>
          <Trending current={value} average={average} isStreamOnline={isStreamOnline}/>
        </Typography>
        <Typography color={theme.palette.grey[400]} variant='caption' sx={{
          pt: 2, pa: 1,
        }}>{ capitalize(translate('new-chatters')) }</Typography>
      </Paper>
    </Grid>
  );
};