import { Backdrop, CircularProgress, Grid, Box } from '@mui/material';
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { isBotStarted } from '../isBotStarted';

export default function BackdropLoading() {
  const { state, message } = useSelector((state: any) => state.loader)
  const dispatch = useDispatch()

  useEffect(() => {
    isBotStarted(dispatch);
  }, [dispatch]);

  useEffect(() => {
    setOpen(false)
  }, [state]);

  const [open, setOpen] = React.useState(true);

  return (
    <Backdrop open={open}>
      <Grid
        container
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
      >
        <CircularProgress color="inherit" />
        <Box fontWeight="fontWeightLight" m={2} alignContent="center">
          <div>{message}</div>
        </Box>
      </Grid>
    </Backdrop>
  )
}