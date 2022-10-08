import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { useState } from 'react';

export const ConfirmButton: React.FC<{
  children: string;
  handleOk: () => void;
  handleCancel?: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}> =  ({
  children,
  handleOk,
  handleCancel,
  variant = 'text',
  color = 'primary',
}) => {
  const [open, setOpen] = useState(false);

  const handleOkBtn = () => {
    setOpen(false);
    handleOk();
  };
  const handleCancelBtn = () => {
    setOpen(false);
    if (handleCancel) {
      handleCancel();
    }
  };

  return (<>
    <Button onClick={() => setOpen(true)} variant={variant} color={color}>{children}</Button>
    <Dialog
      open={open}
    >
      <DialogContent dividers>
        Do you want to proceed with your action?
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleCancelBtn}>
          Cancel
        </Button>
        <Button onClick={handleOkBtn}>Yes, do it</Button>
      </DialogActions>
    </Dialog>
  </>
  );
};