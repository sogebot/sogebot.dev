import {
  Button, Dialog, DialogActions, DialogContent, Typography,
} from '@mui/material';
import * as React from 'react';

export const DialogDelete: React.FC<{
  onDelete: () => void,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  open: boolean,
}> = ({
  onDelete,
  setOpen,
  open,
}) => {
  return (<Dialog
    sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
    maxWidth="xs"
    open={open}
  >
    <DialogContent dividers>
      <Typography>Do you want to delete this item?</Typography>
    </DialogContent>
    <DialogActions>
      <Button autoFocus fullWidth onClick={() => setOpen(false)}>Cancel</Button>
      <Button fullWidth color="error" variant="contained" onClick={() => {
        setOpen(false); onDelete();
      }}>Delete</Button>
    </DialogActions>
  </Dialog>
  );
};