import { Add, Remove } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Variable } from '@sogebot/backend/dest/database/entity/variable';
import { QuickActions } from '@sogebot/backend/src/database/entity/dashboard';
import axios from 'axios';
import React, { MouseEventHandler, useCallback, useState } from 'react';
import { useIntervalWhen } from 'rooks';

import { useAppSelector } from '../../../../../hooks/useAppDispatch';
import { ColorButton } from '../_ColorButton';

export const DashboardWidgetActionCustomVariableNumberButton: React.FC<{ item: QuickActions.Item, variable: Variable, onUpdate: (value: number) => void }> = ({
  item, variable, onUpdate,
}) => {
  const { user } = useAppSelector(state => state.user);
  const [ isIncrement, setIsIncrement ] = useState(true);
  const [ isShiftKey, setIsShiftKey ] = useState(false);
  const [ isCtrlKey, setIsCtrlKey ] = useState(false);
  const [ mouseDown, setMouseDown ] = useState(false);
  const [ timestamp, setTimestamp ] = useState(Date.now());

  const updateValue = useCallback((increment: boolean, shift: boolean, ctrl: boolean) => {
    if (!user) {
      return;
    }

    let value = 1;
    if (shift) {
      value = 10;
    }
    if (shift && ctrl) {
      value = 100;
    }
    onUpdate(increment
      ? Number(variable.currentValue) + value
      : Number(variable.currentValue) - value);
    console.log(`quickaction::trigger::${item.id}`);
    axios.post(`/api/widgets/quickaction/${item.id}?_action=trigger`, { value: increment ? `+${value}` : `-${value}` });
  }, [ user, item, variable, onUpdate ]);

  const trigger: MouseEventHandler<HTMLElement> = useCallback((ev) => {
    const mouseOffsetX = ev.nativeEvent.offsetX;
    const target = ev.nativeEvent.target as HTMLElement;
    const boxWidth = target.offsetWidth;
    setIsShiftKey(ev.shiftKey);
    setIsCtrlKey(ev.ctrlKey);
    setIsIncrement(mouseOffsetX > boxWidth / 2);
    setMouseDown(true);
    setTimestamp(Date.now());
    updateValue(mouseOffsetX > boxWidth / 2, ev.shiftKey, ev.ctrlKey);
  }, [updateValue]);

  useIntervalWhen(() => {
    if ((Date.now() - timestamp) > 500) {
      updateValue(isIncrement, isShiftKey, isCtrlKey);
    }
  }, 100, mouseDown);

  return (
    <ColorButton
      onMouseDown={trigger}
      onMouseUp={() => setMouseDown(false)}
      onMouseLeave={() => setMouseDown(false)}
      key={item.id}
      variant="contained"
      htmlcolor={item.options.color}
      startIcon={<Remove/>}
      endIcon={<Add />}
      fullWidth
      sx={{ borderRadius: 0 }}>
      <Box sx={{
        position: 'absolute', width: '100%', height: '100%',
      }}></Box>
      <Stack sx={{ width: '100%' }} spacing={0}>
        <Typography sx={{
          fontWeight: 'bold', fontSize: '20px', lineHeight: '20px',
        }}>{variable.currentValue}</Typography>
        <Typography variant="button" sx={{
          fontWeight: '300', fontSize: '12px', lineHeight: '10px',
        }}>{variable.variableName}</Typography>
      </Stack>
    </ColorButton>

  );
};