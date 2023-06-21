import {
  PlayArrow, Visibility, VisibilityOff,
} from '@mui/icons-material';
import { CircularProgress, Stack } from '@mui/material';
import { Box } from '@mui/system';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import { RandomizerItem } from '@sogebot/backend/src/database/entity/dashboard';
import axios from 'axios';
import React, {
  MouseEventHandler, useCallback, useMemo, useState,
} from 'react';
import { useIntervalWhen } from 'rooks';

import { ColorButton } from './_ColorButton';
import { getContrastColor } from '../../../../colors';
import { SECOND } from '../../../../constants';
import getAccessToken from '../../../../getAccessToken';
import { getSocket } from '../../../../helpers/socket';
import { useAppSelector } from '../../../../hooks/useAppDispatch';
import { isHexColor } from '../../../../validators';

const lastUpdateAt = new Map<string, number>();
export const DashboardWidgetActionRandomizerButton: React.FC<{ item: RandomizerItem }> = ({
  item,
}) => {
  const { user } = useAppSelector((state: any) => state.user);
  const [ running, setRunning ] = useState(false);

  const [ randomizers, setRandomizers ] = useState<Randomizer[]>([]);

  const currentRandomizer = useMemo(() => {
    return randomizers.find(o => o.id === item.options.randomizerId);
  }, [ randomizers, item.options.randomizerId ]);

  const trigger: MouseEventHandler<HTMLElement> = useCallback((ev) => {
    if (!currentRandomizer) {
      return;
    }
    const mouseOffsetX = ev.nativeEvent.offsetX;
    const target = ev.nativeEvent.target as HTMLElement;
    const boxWidth = target.offsetWidth;
    const increment = mouseOffsetX > boxWidth / 2;

    if (increment) {
      axios.post(`${JSON.parse(localStorage.server)}/api/registries/randomizer/${currentRandomizer.id}/spin`, null, { headers: { authorization: `Bearer ${getAccessToken()}` } });
      setRunning(true);
      setTimeout(() => {
        setRunning(false);
      }, 5000);
    } else {
      getSocket('/widgets/quickaction').emit('trigger', {
        user: {
          userId: user.id, userName: user.login,
        },
        id:    item.id,
        value: !currentRandomizer.isShown,
      });
      axios.get(`${JSON.parse(localStorage.server)}/api/registries/randomizer/`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
        .then((res: any) => setRandomizers(res.data.data));

    }
    // trigger
  }, [currentRandomizer, user, item.id]);

  useIntervalWhen(() => {
    const updatedAt = lastUpdateAt.get(item.id) ?? 0;

    if (Date.now() - updatedAt < SECOND * 10) {
      // not time to update yet
      return;
    }

    lastUpdateAt.set(item.id, Date.now());

    axios.get(`${JSON.parse(localStorage.server)}/api/registries/randomizer/`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((res: any) => setRandomizers(res.data.data));
  }, 1000, true, true);

  return (
    <ColorButton
      onMouseDown={trigger}
      key={item.id}
      variant="contained"
      htmlcolor={item.options.color}
      startIcon={currentRandomizer?.isShown ? <Visibility/> : <VisibilityOff/>}
      endIcon={running ? <CircularProgress sx={{ color: getContrastColor(isHexColor(item.options.color) === true ? item.options.color : '#444444') }} size={14}/> : <PlayArrow />}
      fullWidth
      sx={{ borderRadius: 0 }}>
      <Box sx={{
        position: 'absolute', width: '100%', height: '100%',
      }}></Box>
      <Stack sx={{ width: '100%' }} spacing={0}>
        {currentRandomizer?.name || 'n/a'}
      </Stack>
    </ColorButton>

  );
};