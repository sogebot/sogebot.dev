import {
  Box,
  Button, Fade, Paper, Stack,
  Typography,
} from '@mui/material';
import React from 'react';
import { useSessionstorageState } from 'rooks';

export default function DevelopmentAlert() {
  const [ acknowledge, setAcknowledged ] = useSessionstorageState('dev_acknowledged', false);

  return (
    <Fade in={acknowledge === false} unmountOnExit mountOnEnter>
      <Box sx={{
        position: 'absolute', right: 10, bottom: 10, width: '500px', p: 2, marginLeft: 'auto', zIndex: 9999999,
      }} component={Paper}>
        <Typography variant={'h5'} sx={{
          fontWeight: 'bold', pb: 2,
        }}>Development</Typography>
        <Typography>This dashboard is still in heavy development and doesn't contain all features. You may expect 404 on some pages, which is expected. If you find any bugs on implemented pages, let me on discord know so it can be fixed as soon as possible.</Typography>
        <Typography sx={{ pt: 2 }}>Happy testing!</Typography>

        <Stack direction='row' spacing={2} justifyContent='flex-end' sx={{ pt: 2 }}>
          <Button variant='contained' onClick={() => setAcknowledged(true)}>I understand!</Button>
        </Stack>
      </Box>
    </Fade>
  );
}