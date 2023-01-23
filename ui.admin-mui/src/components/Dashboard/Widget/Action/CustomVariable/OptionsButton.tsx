import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import {
  Menu, MenuItem, Stack, Typography,
} from '@mui/material';
import { Box } from '@mui/system';
import { Variable } from '@sogebot/backend/dest/database/entity/variable';
import { QuickActions } from '@sogebot/backend/src/database/entity/dashboard';
import React, {
  useCallback, useRef, useState,
} from 'react';
import { useSelector } from 'react-redux';

import { getSocket } from '../../../../../helpers/socket';
import { ColorButton } from '../_ColorButton';

export const DashboardWidgetActionCustomVariableOptionsButton: React.FC<{ item: QuickActions.Item, variable: Variable, onUpdate: (value: string) => void }> = ({
  item, variable, onUpdate,
}) => {
  const { user } = useSelector((state: any) => state.user);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [ menuWidth, setMenuWidth ] = useState<string>('inherit');
  const open = Boolean(anchorEl);
  const btnRef = useRef<any>();

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (btnRef.current) {
      setMenuWidth(`${btnRef.current.offsetWidth}px`);
    }
    setAnchorEl(event.currentTarget);
  }, [ btnRef ]);
  const handleClose = () => {
    setAnchorEl(null);
  };

  const updateValue = useCallback((value: string) => {
    onUpdate(value);
    console.log(`quickaction::trigger::${item.id}`);
    getSocket('/widgets/quickaction').emit('trigger', {
      user: {
        userId: user.id, userName: user.login,
      },
      id:    item.id,
      value: value,
    });
    setAnchorEl(null);
  }, [ user, item, onUpdate ]);

  return (<>
    <ColorButton
      key={item.id}
      ref={btnRef}
      variant="contained"
      onClick={handleClick}
      htmlcolor={item.options.color}
      fullWidth
      startIcon={<Box width={20} height={20}/>}
      endIcon={open ? <KeyboardArrowUp/> : <KeyboardArrowDown />}
      sx={{ borderRadius: 0 }}>
      <Box sx={{
        position: 'absolute', width: '100%', height: '100%',
      }}></Box>
      <Stack direction="row" alignItems='center' width='100%'>
        <Stack sx={{ width: '100%' }} spacing={0}>
          <Typography sx={{
            fontWeight: 'bold', fontSize: '14px', lineHeight: '20px',
          }}>{variable.currentValue}</Typography>
          <Typography variant="button" sx={{
            fontWeight: '300', fontSize: '12px', lineHeight: '10px',
          }}>{variable.variableName}</Typography>
        </Stack>
      </Stack>
    </ColorButton>
    <Menu
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
      {variable.usableOptions.map(option => {
        return <MenuItem key={option} onClick={() => updateValue(option.trim())} sx={{ width: menuWidth }}>{option.trim()}</MenuItem>;
      })}
    </Menu>
  </>
  );
};