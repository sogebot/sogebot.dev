import { KeyTwoTone } from '@mui/icons-material';
import {
  Button, Menu, MenuItem, Tooltip,
} from '@mui/material';
import React from 'react';

import { usePermissions } from '../../hooks/usePermissions';

export const ButtonsPermissionsBulk: React.FC<{
  onSelect: (permissionId: string) => void,
  disabled?: boolean,
}> = ({
  onSelect,
  disabled,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { permissions } = usePermissions();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const selectPermission = (permId: string) => {
    onSelect(permId);
    handleClose();
  };

  return (
    <>
      <Tooltip arrow title="Change permission">
        <Button
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          disabled={disabled}
          variant="contained"
          color="info"
          sx={{
            minWidth: '36px', width: '36px',
          }}
        >
          <KeyTwoTone/>
        </Button>
      </Tooltip>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ 'aria-labelledby': 'basic-button' }}
      >
        {permissions.map((permission) => {
          return (<MenuItem key={permission.id} onClick={() => selectPermission(permission.id)}>{permission.name}</MenuItem>);
        })}
      </Menu>
    </>
  );
};