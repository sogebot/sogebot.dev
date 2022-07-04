import { MoreVert } from '@mui/icons-material';
import {
  Button, Dialog, DialogActions, DialogContent, IconButton, Menu, MenuItem, Typography,
} from '@mui/material';
import * as React from 'react';

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
      <Dialog
        sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
        maxWidth="xs"
        open={open2}
      >
        <DialogContent dividers>
          <Typography>Do you want to delete this item?</Typography>
        </DialogContent>
        <DialogActions>
          <Button autoFocus fullWidth onClick={() => setOpen2(false)}>Cancel</Button>
          <Button fullWidth color="error" variant="contained" onClick={() => {
            setOpen2(false); onDelete();
          }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
  /**/
};