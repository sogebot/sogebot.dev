import { RandomizerInterface } from '@entity/randomizer';
import {
  PlayArrow, Visibility, VisibilityOff,
} from '@mui/icons-material';
import { CircularProgress, Stack } from '@mui/material';
import { Box } from '@mui/system';
import { RandomizerItem } from '@sogebot/backend/src/database/entity/dashboard';
import { getContrastColor } from '@sogebot/ui-helpers/colors';
import {
  MouseEventHandler, useCallback, useMemo, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useIntervalWhen } from 'rooks';

import { getSocket } from '~/src/helpers/socket';
import { isHexColor } from '~/src/validators';

import { ColorButton } from './_ColorButton';

export const DashboardWidgetActionRandomizerButton: React.FC<{ item: RandomizerItem }> = ({
  item,
}) => {
  const { user } = useSelector((state: any) => state.user);
  const [ running, setRunning ] = useState(false);

  const [ randomizers, setRandomizers ] = useState<RandomizerInterface[]>([]);

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
      getSocket('/registries/randomizer').emit('randomizer::startSpin');
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
      getSocket('/registries/randomizer').emit('generic::getAll', (err, items) => {
        if (err) {
          return console.error(err);
        }
        setRandomizers(items);
      });

    }
    // trigger
  }, [currentRandomizer, user, item.id]);

  useIntervalWhen(() => {
    getSocket('/registries/randomizer').emit('generic::getAll', (err, items) => {
      if (err) {
        return console.error(err);
      }
      setRandomizers(items);
    });
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