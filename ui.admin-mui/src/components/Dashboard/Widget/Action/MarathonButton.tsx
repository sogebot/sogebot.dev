import { Edit } from '@mui/icons-material';
import { Popover } from '@mui/material';
import { Box } from '@mui/system';
import { OverlayMarathonItem } from '@sogebot/backend/src/database/entity/dashboard';
import {
  DAY, HOUR, MINUTE, SECOND,
} from '@sogebot/ui-helpers/constants';
import parse from 'html-react-parser';
import {
  MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useIntervalWhen } from 'rooks';
import { OverlayMapperMarathon } from '~/../backend/src/database/entity/overlay';

import { FormInputTime } from '~/src/components/Form/Input/Time';
import { getSocket } from '~/src/helpers/socket';

import { ColorButton } from './_ColorButton';

export const DashboardWidgetActionMarathonButton: React.FC<{ item: OverlayMarathonItem }> = ({
  item,
}) => {
  const [ marathon, setMarathon ] = useState<null | OverlayMapperMarathon>(null);
  const [ timestamp, setTimestamp ] = useState(0);
  const [ key, setKey ] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const btnRef = useRef<any>();
  const [ menuWidth, setMenuWidth ] = useState<string>('inherit');
  const open = Boolean(anchorEl);

  const time = useMemo(() => {
    if (timestamp === 0 || !marathon) {
      return '--:--:--';
    }

    const _time = Math.max(timestamp - Date.now(), 0);
    const days = Math.floor(_time / DAY);
    const hours = Math.floor((_time - days * DAY) / HOUR);
    const minutes = Math.floor((_time - (days * DAY) - (hours * HOUR)) / MINUTE);
    const seconds = Math.floor((_time - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
    let millis: number | string = Math.floor((_time - (days * DAY) - (hours * HOUR) - (minutes * MINUTE) - (seconds * SECOND)) / 10);

    if (millis < 10) {
      millis = `0${millis}`;
    }

    let output = '';
    if (days > 0) {
      output += `${days}d`;
    }

    output += `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    const opts = typeof marathon.opts === 'string' ? JSON.parse(marathon.opts) : marathon.opts;
    if (opts.showMilliseconds) {
      output += `<small>.${millis}</small>`;
    }
    return output;
  }, [ timestamp, marathon ]);

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
    if (!marathon) {
      return;
    }
    handleClick(ev);
  }, [marathon, handleClick]);

  useEffect(() => {
    getSocket('/registries/overlays').emit('generic::getOne', item.options.marathonId, (err, result) => {
      if (err) {
        return console.error(err);
      }
      setMarathon(result as any ?? null);
    });
  }, [item.options.marathonId]);

  useIntervalWhen(() => {
    // get actual status of opened overlay
    if (marathon) {
      getSocket('/overlays/marathon').emit('marathon::check', marathon.id, (_err, data) => {
        setKey(Date.now());
        if (data && marathon) {
          setTimestamp(Math.max(data.opts.endTime, Date.now()));
        }
      });
    }
  }, 1000, true, true);

  const updateValue = (value: number) => {
    if (marathon) {
      console.log({
        value, timestamp, newValue: timestamp + value,
      });
      getSocket('/overlays/marathon').emit('marathon::update::set', {
        time: value,
        id:   marathon.id,
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
      startIcon={<Box width={20} height={20}/>}
      endIcon={<Edit/>}
      fullWidth
      sx={{ borderRadius: 0 }}>
      <Box sx={{
        position: 'absolute', width: '100%', height: '100%',
      }}></Box>
      <Box sx={{ width: '100%' }} key={key}>
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
        value={0}
        onChange={(value) => updateValue(value)}
      />
    </Popover>
  </>
  );
};