import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import * as React from 'react';

import { getSocket } from '~/src/helpers/socket';

export interface ConfirmationDialogProps {
  id: string;
  keepMounted: boolean;
  open: boolean;
  setOpen: (value: boolean) => void;
}

function ConfirmationDialog(props: ConfirmationDialogProps) {
  const { setOpen, open, ...other } = props;

  const handleCancel = () => {
    setOpen(false);
  };

  const handleOk = () => {
    getSocket('/systems/raffles').emit('raffle::close');
    setOpen(false);
  };

  return (
    <Dialog
      sx={{
        '& .MuiDialog-paper': {
          width: '80%', maxHeight: 435, 
        }, 
      }}
      maxWidth="xs"
      open={open}
      {...other}
    >
      <DialogContent dividers>
        Do you want to close raffle without a winner?
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleOk}>Ok</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function DashboardWidgetBotDialogConfirmRaffleClose() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} sx={{ width: '400px' }} variant='contained' color='warning'>
      Close raffle
      </Button>
      <ConfirmationDialog
        id='raffle-confirm-close-dlg'
        keepMounted
        open={open}
        setOpen={setOpen}
      />
    </>
  );
}