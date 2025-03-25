import { QuickActions } from '@backend/database/entity/dashboard';
import { Variable } from '@entity/variable';
import { Edit } from '@mui/icons-material';
import { Popover, Stack, TextField, Typography } from '@mui/material';
import { Box } from '@mui/system';
import axios from 'axios';
import { useAtomValue } from 'jotai';
import React, { useCallback, useRef, useState } from 'react';

import { loggedUserAtom } from '../../../../../atoms';
import getAccessToken from '../../../../../getAccessToken';
import { ColorButton } from '../_ColorButton';

export const DashboardWidgetActionCustomVariableTextButton: React.FC<{ item: QuickActions.Item, variable: Variable, onUpdate: (value: string) => void, disabled: boolean }> = ({
  item, variable, onUpdate, disabled
}) => {
  const user = useAtomValue(loggedUserAtom);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [ menuWidth, setMenuWidth ] = useState<string>('inherit');
  const open = Boolean(anchorEl);
  const btnRef = useRef<any>(null);

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
    if (!user) {
      return;
    }
    onUpdate(value);
    console.log(`quickaction::trigger::${item.id}`);
    axios.post(`/api/widgets/quickaction/${item.id}?_action=trigger`, { value: value }, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    });
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
      endIcon={<Edit/>}
      disabled={disabled}
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
      <TextField
        sx={{ width: menuWidth }}
        hiddenLabel
        variant="filled"
        value={variable.currentValue}
        onChange={(event) => updateValue(event.target.value)}/>
    </Popover>
  </>
  );
};