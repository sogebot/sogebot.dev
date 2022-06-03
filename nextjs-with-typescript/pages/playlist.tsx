import { FormControl, Grid, IconButton, Input, InputAdornment } from '@mui/material';
import { NextPage } from 'next/types';
import ListPlaylist from '../src/components/listPlaylist'
import SearchIcon from '@mui/icons-material/SearchTwoTone';
import { useDispatch, useSelector } from 'react-redux';
import { setSearch } from '../src/store/playlistSlice';
import ClearTwoToneIcon from '@mui/icons-material/ClearTwoTone';

const Home: NextPage = () => {
  const { search } = useSelector((state: any) => state.playlist);
  const dispatch = useDispatch()

  const handleClearSearch = () => {
    dispatch(setSearch(''))
  }

  return (
    <Grid container spacing={0}
      sx={{
        height: '100vh',
        width: '100%'
      }}>
      <Grid item sx={{ width: '100%', p: 2 }}>
        <FormControl>
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
        <ListPlaylist/>
      </Grid>
    </Grid>);
};

export default Home;
