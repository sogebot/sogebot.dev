import {MobileView, BrowserView} from 'react-device-detect';
import { useDispatch, useSelector } from 'react-redux';
import { Fade, FormControl, TextField, InputAdornment, IconButton, InputBase, Paper } from '@mui/material';

import ClearTwoToneIcon from '@mui/icons-material/ClearTwoTone';
import SearchIcon from '@mui/icons-material/SearchTwoTone';
import { setSearch } from '../store/searchSlice';

export const Search: React.FC = () => {
  const { haveSearch, search } = useSelector((state: any) => state.search);
  const dispatch = useDispatch();

  const handleClearSearch = () => {
    dispatch(setSearch(''))
  }

  return (
    <Fade in={haveSearch}>
    <FormControl sx={{ pr: 4 }}>
      <MobileView>
        <Paper sx={{ p: '2px 4px', mx:2, display: 'flex', alignItems: 'center', width: '100%' }}>
          <SearchIcon />
          <InputBase
            sx={{ flex: 1, ml: 1 }}
            placeholder="Type to search"
            onChange={(event) => dispatch(setSearch(event.target.value))}
            value={search}
          />
          <Fade in={search.length > 0}>
            <InputAdornment position="end">
              <IconButton onClick={handleClearSearch}>
                <ClearTwoToneIcon />
              </IconButton>
            </InputAdornment>
          </Fade>
        </Paper>
      </MobileView>
      <BrowserView>
      <TextField
        value={search}
        variant="standard"
        placeholder="Type to search"
        onChange={(event) => dispatch(setSearch(event.target.value))}
        InputProps={{
          startAdornment:
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>,
          endAdornment:
            <Fade in={search.length > 0}>
              <InputAdornment position="end">
                <IconButton onClick={handleClearSearch}>
                  <ClearTwoToneIcon />
                </IconButton>
              </InputAdornment>
            </Fade>
        }}
      />
      </BrowserView>
    </FormControl>
  </Fade>
  )
}