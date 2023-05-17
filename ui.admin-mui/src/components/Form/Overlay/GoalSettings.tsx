import {
  Box,
  Divider,
  Stack,
} from '@mui/material';
import { Goal } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

type Props = {
  model: Goal;
  onUpdate: (value: Goal) => void;
};

export const GoalSettings: React.FC<Props> = () => {
  return <>
    <Divider/>

    <Box sx={{ py: 2 }}>
      <Stack spacing={0.5}>
        Lorem Ipsum
      </Stack>
    </Box>
  </>;
};