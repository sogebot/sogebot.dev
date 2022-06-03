import { Grid, Typography } from '@mui/material';
import { NextPage } from 'next/types';
import ListSongRequests from '../src/components/listSongRequests';


const Home: NextPage = () => {
  return (
    <Grid container spacing={0}
      sx={{
        height: '100vh',
        width: '100%'
      }}>
      <Grid item sx={{ width: '100%', p: 2 }}>
        <Typography variant="h6" component="h6" sx={{ mb: 2 }}>
          Song Requests
        </Typography>
        <ListSongRequests/>
      </Grid>
    </Grid>);
};

export default Home;
