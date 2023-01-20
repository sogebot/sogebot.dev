import { LoadingButton } from '@mui/lab';
import { SxProps, Theme } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import React, { useState } from 'react';

export const ConfirmButton: React.FC<{
  children: string;
  handleOk: () => void;
  handleCancel?: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  loading?: boolean;
  sx?: SxProps<Theme> | undefined
}> =  ({
  children,
  handleOk,
  handleCancel,
  variant = 'text',
  color = 'primary',
  loading,
  sx,
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
    <LoadingButton sx={sx} loading={loading || false} onClick={() => setOpen(true)} variant={variant} color={color}>{children}</LoadingButton>
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