import { RandomizerItem } from '@backend/database/entity/dashboard';
import { Randomizer } from '@entity/randomizer';
import { PlayArrow, Visibility, VisibilityOff } from '@mui/icons-material';
import { CircularProgress, Stack } from '@mui/material';
import { Box } from '@mui/system';
import axios from 'axios';
import { useAtomValue } from 'jotai';
import React, { MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { useIntervalWhen } from 'rooks';

import { ColorButton } from './_ColorButton';
import { loggedUserAtom } from '../../../../atoms';
import { getContrastColor } from '../../../../colors';
import { SECOND } from '../../../../constants';
import getAccessToken from '../../../../getAccessToken';
import { isHexColor } from '../../../../validators';

const lastUpdateAt = new Map<string, number>();
export const DashboardWidgetActionRandomizerButton: React.FC<{ item: RandomizerItem }> = ({
  item,
}) => {
  const user = useAtomValue(loggedUserAtom);
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
      axios.post(`/api/registries/randomizer/${currentRandomizer.id}/spin`, null, { headers: { authorization: `Bearer ${getAccessToken()}` } });
      setRunning(true);
      setTimeout(() => {
        setRunning(false);
      }, 5000);
    } else {
      axios.post(`/api/widgets/quickaction/${item.id}?_action=trigger`, { value: !currentRandomizer.isShown }, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      });
      axios.get(`/api/registries/randomizer/`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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

    axios.get(`/api/registries/randomizer/`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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