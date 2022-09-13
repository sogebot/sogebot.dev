import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import * as React from 'react';

import { getSocket } from '~/src/helpers/socket';

interface ConfirmationDialogProps {
  id: string;
  keepMounted: boolean;
  open: boolean;
  setOpen: (value: boolean) => void;
  onPick: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = (props) => {
  const { setOpen, onPick, open, ...other } = props;

  const handleCancel = () => {
    setOpen(false);
  };

  const handleOk = () => {
    getSocket('/systems/raffles').emit('raffle::pick');
    onPick();
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
        Do you want to close pick a winner of raffle?
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleOk}>Ok</Button>
      </DialogActions>
    </Dialog>
  );
};

const DashboardWidgetBotDialogConfirmRafflePick: React.FC<{onPick: () => void, title?: React.ReactElement<any, any>, color?: 'inherit' | 'success' | 'primary' | 'secondary' | 'error' | 'info' | 'warning'}> = ({
  onPick,
  color,
  title,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} sx={{ width: '400px' }} variant='contained' color={color ? color : 'success'}>
        {title ? title : 'Pick winner'}
      </Button>
      <ConfirmationDialog
        id='raffle-confirm-pick-dlg'
        keepMounted
        open={open}
        setOpen={setOpen}
        onPick={onPick}
      />
    </>
  );
};

export default DashboardWidgetBotDialogConfirmRafflePick;