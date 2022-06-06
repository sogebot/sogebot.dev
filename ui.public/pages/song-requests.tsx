import { Grid } from '@mui/material';
import { NextPage } from 'next/types';
import ListSongRequests from '../src/components/listSongRequests';

const Home: NextPage = () => {
  return (
    <Grid container spacing={0}>
      <Grid item sx={{ width: '100%', p: 2 }}>
        <ListSongRequests/>
      </Grid>
    </Grid>);
};

export default Home;
