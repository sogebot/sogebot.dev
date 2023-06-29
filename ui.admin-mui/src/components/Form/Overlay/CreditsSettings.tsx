import {
  Button,
  Stack,
} from '@mui/material';
import { Credits } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

type Props = {
  model: Credits;
  onUpdate: (value: Credits) => void;
};

export const CreditsSettings: React.FC<Props> = () => {

  const addNewScreen = () => {
    return;
  };

  return <>
    <Stack spacing={0.5}>
    </Stack>

    <Button sx={{ py: 1.5 }} fullWidth onClick={addNewScreen} variant='contained'>Add new screen</Button>
  </>;
};