import { NextPage } from 'next/types';

import ListQuote from '../src/components/quotes/listQuotes';
import { Chip, Grid, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setTag } from '../src/store/quotesSlice';

const Home: NextPage = () => {
  const { tag } = useSelector((state: any) => state.quotes);
  const dispatch = useDispatch()

  const handleDelete = () => {
    dispatch(setTag(null));
  }

  return (
    <Grid container spacing={0}
      sx={{
        height: '100vh',
        width: '100%'
      }}>
      <Grid item sx={{ width: '100%', p: 2 }}>
        <Typography variant="h6" component="h6" sx={{ mb: 2 }}>
          Quotes

          {tag && <Chip sx={{ mx: 1 }} label={tag} color="primary" variant="filled" onDelete={handleDelete} />}
        </Typography>
        <ListQuote />
      </Grid>
    </Grid>);
};

export default Home;
