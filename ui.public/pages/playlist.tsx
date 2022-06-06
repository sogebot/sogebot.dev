import { AppBar, Chip, Grid, Toolbar, Typography } from '@mui/material';
import { NextPage } from 'next/types';
import ListPlaylist from '../src/components/listPlaylist'
import { useDispatch, useSelector } from 'react-redux';
import { enableSearch } from '../src/store/searchSlice';
import { useEffect } from 'react';
import { nextTick } from 'process';
import { Box } from '@mui/system';

const Home: NextPage = () => {
  const { tag } = useSelector((state: any) => state.playlist);
  const dispatch = useDispatch()

  useEffect(() => {
    nextTick(() => {
      dispatch(enableSearch())
    })
  }, [dispatch])

  return (
    <><AppBar position="sticky" elevation={24}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant='body1' display='inline' sx={{pr:1}}>Current playlist:</Typography>
          <Chip variant="filled" color="secondary" size="small" label={tag}/>
        </Box>
      </Toolbar>
    </AppBar>
    <Grid container spacing={0}>
      <Grid item sx={{p: 2, width: '100%'}}>
        <ListPlaylist/>
      </Grid>
    </Grid></>);
};

export default Home;
