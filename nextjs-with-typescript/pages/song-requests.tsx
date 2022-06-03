import { Grid, Typography } from '@mui/material';
import { NextPage } from 'next/types';
import { useEffect, useRef } from 'react';
import ListSongRequests from '../src/components/listSongRequests';
import { scrollToRef } from '../src/scrollTo';


const Home: NextPage = () => {
  const myRef = useRef(null)
  const executeScroll = () => scrollToRef(myRef)
  useEffect(() => executeScroll(), []);

  return (
    <Grid container spacing={0} ref={myRef}
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
