import { Grid } from '@mui/material';
import { NextPage } from 'next/types';
import ListPlaylist from '../src/components/listPlaylist'
import { useDispatch } from 'react-redux';
import { enableSearch } from '../src/store/searchSlice';
import { useEffect } from 'react';
import { nextTick } from 'process';

const Home: NextPage = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    nextTick(() => {
      dispatch(enableSearch())
    })
  }, [dispatch])

  return (
    <Grid container spacing={0}>
      <Grid item sx={{ width: '100%', p: 2 }}>
        <ListPlaylist/>
      </Grid>
    </Grid>);
};

export default Home;
