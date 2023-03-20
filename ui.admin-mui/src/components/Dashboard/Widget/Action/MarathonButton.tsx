import {
  AddTwoTone, Edit, RemoveTwoTone,
} from '@mui/icons-material';
import {
  IconButton, InputAdornment, Popover,
} from '@mui/material';
import { Box } from '@mui/system';
import { Marathon } from '@sogebot/backend/dest/database/entity/overlay';
import { OverlayMarathonItem } from '@sogebot/backend/src/database/entity/dashboard';
import parse from 'html-react-parser';
import React, {
  MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useIntervalWhen } from 'rooks';

import { ColorButton } from './_ColorButton';
import { GenerateTime } from './GenerateTime';
import { getSocket } from '../../../../helpers/socket';
import { FormInputTime } from '../../../Form/Input/Time';

export const DashboardWidgetActionMarathonButton: React.FC<{ item: OverlayMarathonItem }> = ({
  item,
}) => {
  const [ marathon, setMarathon ] = useState<null | Marathon>(null);
  const [ timestamp, setTimestamp ] = useState(0);
  const [ key, setKey ] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const btnRef = useRef<any>();
  const [ menuWidth, setMenuWidth ] = useState<string>('inherit');
  const open = Boolean(anchorEl);

  const [ addTimeValue, setAddTimeValue ] = useState(0);

  const time = useMemo(() => {
    return GenerateTime(Math.max(timestamp - Date.now(), 0), marathon?.showMilliseconds ?? false);
  }, [ timestamp, marathon, key ]);

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
      setMarathon(result?.items.find(o => o.id === item.options.marathonId && o.opts.typeId === 'marathon')?.opts as Marathon ?? null);
    });
  }, [item.options.marathonId]);

  useIntervalWhen(() => {
    setKey(Date.now());
    // get actual status of opened overlay
    if (marathon) {
      getSocket('/overlays/marathon').emit('marathon::check', item.options.marathonId, (_err, data) => {
        if (data && marathon) {
          setTimestamp(Math.max(data.endTime, Date.now()));
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
        id:   item.options.marathonId,
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
        value={addTimeValue}
        onChange={setAddTimeValue}
        InputProps={{
          startAdornment: <InputAdornment position="start"><IconButton onClick={() => updateValue(-addTimeValue)}><RemoveTwoTone/></IconButton></InputAdornment>,
          endAdornment:   <InputAdornment position="end"><IconButton onClick={() => updateValue(addTimeValue)}><AddTwoTone/></IconButton></InputAdornment>,
        }}

      />
    </Popover>
  </>
  );
};