import { Chip, FormControl, Grid, IconButton, Input, InputAdornment, Typography } from '@mui/material';
import { NextPage } from 'next/types';
import { useEffect, useRef } from 'react';
import { scrollToRef } from '../src/scrollTo';
import ListPlaylist from '../src/components/listPlaylist'
import SearchIcon from '@mui/icons-material/SearchTwoTone';
import { useDispatch, useSelector } from 'react-redux';
import { setSearch } from '../src/store/playlistSlice';
import ClearTwoToneIcon from '@mui/icons-material/ClearTwoTone';

const Home: NextPage = () => {
  const myRef = useRef(null)
  const executeScroll = () => scrollToRef(myRef)
  useEffect(() => executeScroll(), []);

  const { tag } = useSelector((state: any) => state.playlist);
  const { search } = useSelector((state: any) => state.playlist);
  const dispatch = useDispatch()

  const handleClearSearch = () => {
    dispatch(setSearch(''))
  }

  return (
    <Grid container spacing={0} ref={myRef}
      sx={{
        height: '100vh',
        width: '100%'
      }}>
      <Grid item sx={{ width: '100%', p: 2 }}>
        <Typography variant="h6" component="h6" sx={{ mb: 2 }}>
          Playlist

          {tag && <Chip sx={{ mx: 1 }} label={tag} color="primary" variant="filled" />}

          <FormControl variant="standard" sx={{ ml: 2}}>
            <Input
              id="playlist-search"
              value={search}
              onChange={(event) => dispatch(setSearch(event.target.value))}
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              }
              endAdornment={
                search.length > 0 && <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch}>
                    <ClearTwoToneIcon />
                  </IconButton>
                </InputAdornment>

              }
            />
          </FormControl>
        </Typography>
        <ListPlaylist/>
      </Grid>
    </Grid>);
};

export default Home;
