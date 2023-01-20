import {
  Edit,
  Pause,
  PlayArrow,
} from '@mui/icons-material';
import { Popover } from '@mui/material';
import { Box } from '@mui/system';
import { OverlayMapperStopwatch } from '@sogebot/backend/dest/database/entity/overlay';
import { OverlayStopwatchItem } from '@sogebot/backend/src/database/entity/dashboard';
import parse from 'html-react-parser';
import React, {
  MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useIntervalWhen } from 'rooks';

import { ColorButton } from './_ColorButton';
import {
  DAY, HOUR, MINUTE, SECOND,
} from '../../../../constants';
import { getSocket } from '../../../../helpers/socket';
import { FormInputTime } from '../../../Form/Input/Time';

export const DashboardWidgetActionStopwatchButton: React.FC<{ item: OverlayStopwatchItem }> = ({
  item,
}) => {
  const [ stopwatch, setStopwatch ] = useState<null | OverlayMapperStopwatch>(null);
  const [ isStarted, setIsStarted ] = useState(false);
  const [ timestamp, setTimestamp ] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const btnRef = useRef<any>();
  const [ menuWidth, setMenuWidth ] = useState<string>('inherit');
  const open = Boolean(anchorEl);

  const time = useMemo(() => {
    if (timestamp === null || !stopwatch) {
      return '--:--:--';
    }
    const days = Math.floor(timestamp / DAY);
    const hours = Math.floor((timestamp - days * DAY) / HOUR);
    const minutes = Math.floor((timestamp - (days * DAY) - (hours * HOUR)) / MINUTE);
    const seconds = Math.floor((timestamp - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
    let millis: number | string = Math.floor((timestamp - (days * DAY) - (hours * HOUR) - (minutes * MINUTE) - (seconds * SECOND)) / 10);

    if (millis < 10) {
      millis = `0${millis}`;
    }

    let output = '';
    if (days > 0) {
      output += `${days}d`;
    }

    output += `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    const opts = typeof stopwatch.opts === 'string' ? JSON.parse(stopwatch.opts) : stopwatch.opts;
    if (opts) {
      output += `<small>.${millis}</small>`;
    }
    return output;
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
      getSocket('/overlays/stopwatch').emit('stopwatch::update::set', {
        isEnabled: !isStarted,
        time:      null,
        id:        stopwatch.id,
      });
      setIsStarted(!isStarted);
    }
    // trigger
  }, [stopwatch, isStarted, handleClick]);

  useEffect(() => {
    getSocket('/registries/overlays').emit('generic::getOne', item.options.stopwatchId, (err, result) => {
      if (err) {
        return console.error(err);
      }
      setStopwatch(result as any ?? null);
    });
  }, [ item.options.stopwatchId ]);

  useIntervalWhen(() => {
    // get actual status of opened overlay
    if (stopwatch && !anchorEl) {
      getSocket('/overlays/stopwatch').emit('stopwatch::check', stopwatch.id, (_err, data) => {
        if (data && stopwatch) {
          setIsStarted(data.isEnabled);
          setTimestamp(data.time);
        }
      });
    }
  }, 1000, true, true);

  const updateValue = (value: number) => {
    if (stopwatch) {
      getSocket('/overlays/stopwatch').emit('stopwatch::update::set', {
        isEnabled: null,
        time:      value,
        id:        stopwatch.id,
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