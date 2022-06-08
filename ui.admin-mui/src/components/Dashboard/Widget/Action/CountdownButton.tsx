import {
  Edit,
  Pause,
  PlayArrow,
} from '@mui/icons-material';
import { Popover } from '@mui/material';
import { Box } from '@mui/system';
import { OverlayCountdownItem } from '@sogebot/backend/src/database/entity/dashboard';
import {
  DAY, HOUR, MINUTE, SECOND,
} from '@sogebot/ui-helpers/constants';
import parse from 'html-react-parser';
import {
  MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useIntervalWhen } from 'rooks';
import { OverlayMapperCountdown } from '~/../backend/src/database/entity/overlay';

import { FormInputTime } from '~/src/components/Form/Input/Time';
import { getSocket } from '~/src/helpers/socket';

import { ColorButton } from './_ColorButton';

export const DashboardWidgetActionCountdownButton: React.FC<{ item: OverlayCountdownItem }> = ({
  item,
}) => {
  const [ countdown, setCountdown ] = useState<null | OverlayMapperCountdown>(null);
  const [ isStarted, setIsStarted ] = useState(false);
  const [ timestamp, setTimestamp ] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const btnRef = useRef<any>();
  const [ menuWidth, setMenuWidth ] = useState<string>('inherit');
  const open = Boolean(anchorEl);

  const time = useMemo(() => {
    if (timestamp === null || !countdown) {
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
    const opts = typeof countdown.opts === 'string' ? JSON.parse(countdown.opts) : countdown.opts;
    if (opts) {
      output += `<small>.${millis}</small>`;
    }
    return output;
  }, [ timestamp, countdown ]);

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
    if (!countdown) {
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
      getSocket('/overlays/countdown').emit('countdown::update::set', {
        isEnabled: !isStarted,
        time:      null,
        id:        countdown.id,
      });
      setIsStarted(!isStarted);
    }
    // trigger
  }, [countdown, isStarted, handleClick]);

  useEffect(() => {
    getSocket('/registries/overlays').emit('generic::getOne', item.options.countdownId, (err, result) => {
      if (err) {
        return console.error(err);
      }
      setCountdown(result as any ?? null);
    });
  }, [item.options.countdownId]);

  useIntervalWhen(() => {
    // get actual status of opened overlay
    if (countdown && !anchorEl) {
      getSocket('/overlays/countdown').emit('countdown::check', countdown.id, (_err, data) => {
        if (data && countdown) {
          setIsStarted(data.isEnabled);
          setTimestamp(data.time);
        }
      });
    }
  }, 1000, true, true);

  const updateValue = (value: number) => {
    if (countdown) {
      getSocket('/overlays/countdown').emit('countdown::update::set', {
        isEnabled: null,
        time:      value,
        id:        countdown.id,
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