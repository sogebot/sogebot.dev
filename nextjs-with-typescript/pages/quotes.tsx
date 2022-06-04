import { NextPage } from 'next/types';

import ListQuote from '../src/components/listQuotes';
import { AppBar, Chip, Grid, Toolbar, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setTag } from '../src/store/quotesSlice';
import { Box } from '@mui/system';

const Home: NextPage = () => {
  const { tag, tags } = useSelector((state: any) => state.quotes);
  const dispatch = useDispatch()

  const handleDelete = () => {
    dispatch(setTag(null));
  }

  const handleTagClick = (newTag: string) => {
    dispatch(setTag(newTag));
  }

  return (
    <><AppBar position="sticky" elevation={24} sx={{display: tags.length === 0 ? 'none' : undefined }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          {tags.map((item: string) => {
            return (
              <Chip key={item} sx={{ mr: 1 }} label={item} color="primary"
                variant={tag === item ? "filled" : "outlined"}
                onClick={() => handleTagClick(item)}
                onDelete={tag === item ? handleDelete : undefined} />)
          })}
        </Box>
      </Toolbar>
    </AppBar>
    <Grid container spacing={0}>
      <Grid item sx={{ width: '100%', p: 2 }}>
        <ListQuote />
      </Grid>
    </Grid></>);
};

export default Home;
