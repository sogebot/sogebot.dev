import { Edit, Pause, PlayArrow } from '@mui/icons-material';
import { Popover } from '@mui/material';
import { Box } from '@mui/system';
import { Stopwatch } from '@sogebot/backend/dest/database/entity/overlay';
import { OverlayStopwatchItem } from '@sogebot/backend/src/database/entity/dashboard';
import axios from 'axios';
import parse from 'html-react-parser';
import React, { MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntervalWhen } from 'rooks';

import { ColorButton } from './_ColorButton';
import { GenerateTime } from './GenerateTime';
import { FormInputTime } from '../../../Form/Input/Time';

export const DashboardWidgetActionStopwatchButton: React.FC<{ item: OverlayStopwatchItem }> = ({
  item,
}) => {
  const [ stopwatch, setStopwatch ] = useState<null | Stopwatch>(null);
  const [ isStarted, setIsStarted ] = useState(false);
  const [ timestamp, setTimestamp ] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const btnRef = useRef<any>();
  const [ menuWidth, setMenuWidth ] = useState<string>('inherit');
  const open = Boolean(anchorEl);

  const time = useMemo(() => {
    return GenerateTime(timestamp, stopwatch?.showMilliseconds ?? false);
  }, [ timestamp, stopwatch ]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (btnRef.current) {
      setMenuWidth(`${btnRef.current.offsetWidth}px`);
    }
    setAnchorEl(event.currentTarget);
  }, [ btnRef ]);
  const handleClose = () => {
    setAnchorEl(null);
  };

  const trigger: MouseEventHandler<HTMLElement> = useCallback((ev) => {
    if (!stopwatch) {
      return;
    }
    const mouseOffsetX = ev.nativeEvent.offsetX;
    const target = ev.nativeEvent.target as HTMLElement;
    const boxWidth = target.offsetWidth;
    const increment = mouseOffsetX > boxWidth / 2;

    if (increment) {
      handleClick(ev);
    } else {
      console.log('Setting state', !isStarted);
      axios.post(`/api/overlays/stopwatch/${item.options.stopwatchId}`, {
        isEnabled: !isStarted,
        time:      null,
        id:        item.options.stopwatchId,
      });
      setIsStarted(!isStarted);
    }
    // trigger
  }, [stopwatch, isStarted, handleClick]);

  useEffect(() => {
    axios.get(`/api/registries/overlays/${item.options.stopwatchId}`).then(({ data }) => {
      setStopwatch(data.data?.items.find((o: any) => o.id === item.options.stopwatchId && o.opts.typeId === 'stopwatch')?.opts as Stopwatch ?? null);
    });
  }, [ item.options.stopwatchId ]);

  useIntervalWhen(() => {
    // get actual status of opened overlay
    if (stopwatch && !anchorEl) {
      axios.get(`/api/registries/overlays/${item.options.stopwatchId}`).then(({ data }) => {
        if (data.data && stopwatch) {
          setIsStarted(data.isEnabled);
          setTimestamp(data.time);
        }
      });
    }
  }, 1000, true, true);

  const updateValue = (value: number) => {
    if (stopwatch) {
      axios.post(`/api/overlays/stopwatch/${item.options.stopwatchId}`, {
        isEnabled: null,
        time:      value,
      });
    }
  };

  return (<>
    <ColorButton
      onMouseDown={trigger}
      ref={btnRef}
      key={item.id}
      variant="contained"
      htmlcolor={item.options.color}
      startIcon={isStarted ? <Pause/> : <PlayArrow/>}
      endIcon={<Edit/>}
      fullWidth
      sx={{ borderRadius: 0 }}>
      <Box sx={{
        position: 'absolute', width: '100%', height: '100%',
      }}></Box>
      <Box sx={{ width: '100%' }}>
        {parse(time)}
      </Box>
    </ColorButton>
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      marginThreshold={0}
      anchorOrigin={{
        vertical:   'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical:   'top',
        horizontal: 'center',
      }}
    >
      <FormInputTime
        sx={{ width: menuWidth }}
        variant="filled"
        value={timestamp}
        onChange={(value) => updateValue(value)}
      />
    </Popover>
  </>
  );
};