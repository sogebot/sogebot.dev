import { ArrowDropDownTwoTone } from '@mui/icons-material';
import {
  Button, Menu, MenuItem,
} from '@mui/material';
import React from 'react';

type Props = {
  onClick(response: string): void,
};

export const CommandsMenu: React.FC<Props> = ({ onClick }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return <>
    <Button
      id="demo-positioned-button"
      aria-controls={open ? 'demo-positioned-menu' : undefined}
      aria-haspopup="true"
      aria-expanded={open ? 'true' : undefined}
      onClick={handleClick}
    >
      <ArrowDropDownTwoTone/>
    </Button>
    <Menu
      id="lock-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      MenuListProps={{
        'aria-labelledby': 'lock-button',
        role:              'listbox',
      }}
    >
      <MenuItem onClick={() => {
        onClick('$triggerAlert()');
        handleClose();
      }}>Trigger custom alert</MenuItem>
    </Menu>
  </>;
};