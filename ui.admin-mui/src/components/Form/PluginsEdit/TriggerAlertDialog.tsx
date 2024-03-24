import { Button, Dialog, SxProps, Theme } from '@mui/material';
import React from 'react';

import { FormTriggerAlert } from '../Input/TriggerAlert';

type Props = {
  buttonsx?: SxProps<Theme>;
};

export const TriggerAlertDialog: React.FC<Props> = ({ buttonsx }) => {
  const [ open, setOpen ] = React.useState(false);

  return <>
    <Dialog open={open} onClose={() => setOpen(false)}>

      <FormTriggerAlert value={{
        response: '$triggerAlert()'
      }} idx={0}/>
    </Dialog>
    <Button fullWidth sx={buttonsx} variant='text' onClick={() => setOpen(true)}>Open Alert Trigger Editor</Button>
  </>;
};