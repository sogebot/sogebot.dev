import { QuickActions } from '@entity/dashboard';
import { Button, Menu, MenuItem } from '@mui/material';
import React from 'react';

export const DashboardWidgetActionButtonsAddItem: React.FC<{
  onItemAdd: (type: QuickActions.Item['type']) => void,
}> = ({
  onItemAdd,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const addItem = (type: QuickActions.Item['type']) => {
    onItemAdd(type);
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Button onClick={handleClick} sx={{ width: '150px' }}>Add item</Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ 'aria-labelledby': 'basic-button' }}
        anchorOrigin={{
          vertical:   'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical:   'bottom',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => addItem('customvariable')}>Custom Variable</MenuItem>
        <MenuItem onClick={() => addItem('command')}>Command</MenuItem>
        <MenuItem onClick={() => addItem('overlayCountdown')}>Countdown</MenuItem>
        <MenuItem onClick={() => addItem('divider')}>Divider</MenuItem>
        <MenuItem onClick={() => addItem('overlayMarathon')}>Marathon</MenuItem>
        <MenuItem onClick={() => addItem('overlayStopwatch')}>Stopwatch</MenuItem>
        <MenuItem onClick={() => addItem('randomizer')}>Randomizer</MenuItem>
      </Menu>
    </>
  );
};