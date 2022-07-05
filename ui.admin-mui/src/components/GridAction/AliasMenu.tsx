import { MoreVert } from '@mui/icons-material';
import {
  IconButton, Menu, MenuItem,
} from '@mui/material';
import * as React from 'react';

import { DialogDelete } from '~/src/components/Dialog/Delete';

export const GridActionAliasMenu: React.FC<{
  onDelete: () => void,
}> = ({
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [ open2, setOpen2 ] = React.useState(false);

  return (
    <div>
      <IconButton
        onClick={handleClick}
      >
        <MoreVert/>
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem sx={{ minWidth: '200px' }} onClick={() => {
          setOpen2(true); handleClose();
        }}>Delete</MenuItem>
      </Menu>
      <DialogDelete open={open2} setOpen={setOpen2} onDelete={onDelete}/>
    </div>
  );
  /**/
};