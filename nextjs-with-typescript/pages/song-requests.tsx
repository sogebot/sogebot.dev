import { Grid } from '@mui/material';
import { NextPage } from 'next/types';
import { useEffect, useRef } from 'react';

const scrollToRef = (ref) => window.scrollTo({ left: 0, top: ref.current.offsetTop, behavior: 'smooth'})

const Home: NextPage = () => {
  const myRef = useRef(null)
  const executeScroll = () => scrollToRef(myRef)

  useEffect(() => executeScroll(), []);

  return(
    <Grid container spacing={0}
      sx={{
        height: '100vh'
      }}>
    <Grid item>
      <div ref={myRef}>SONG REQUEST</div>
    </Grid>
    </Grid>
    )
};

export default Home;
