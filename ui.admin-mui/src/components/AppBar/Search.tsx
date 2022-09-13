import ClearTwoToneIcon from '@mui/icons-material/ClearTwoTone';
import SearchIcon from '@mui/icons-material/SearchTwoTone';
import {
  Fade, FormControl, IconButton, InputAdornment, InputBase, Paper, TextField,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useState } from 'react';
import { BrowserView, MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';

import { setSearch } from '~/src/store/appbarSlice';

export const Search: React.FC = () => {
  const [ input, setInput ] = useState('');
  const [ hideSearchButton, setHideSearchButton ] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    /* if (router.asPath.includes('alias')) {
      setHideSearchButton(false);
    } else { */
    setHideSearchButton(true);
    /* } */
  }, [ router ]);

  const handleClearSearch = () => {
    setInput('');
  };

  useEffect(() => {
    dispatch(setSearch(input));
  }, [input, dispatch]);

  return (
    <Fade in={!hideSearchButton}>
      <FormControl sx={{ pr: 4 }}>
        <MobileView>
          <Paper sx={{
            p: '2px 4px', mx: 2, display: 'flex', alignItems: 'center', width: '100%',
          }}>
            <SearchIcon />
            <InputBase
              sx={{
                flex: 1, ml: 1, 
              }}
              value={input}
              placeholder="Type to search"
              onChange={(event) => setInput(event.target.value)}
            />
            <Fade in={input.length > 0}>
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
            variant="standard"
            placeholder="Type to search"
            onChange={(event) => setInput(event.target.value)}
            value={input}
            InputProps={{
              startAdornment:
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>,
              endAdornment:
              <Fade in={input.length > 0}>
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch}>
                    <ClearTwoToneIcon />
                  </IconButton>
                </InputAdornment>
              </Fade>,
            }}
          />
        </BrowserView>
      </FormControl>
    </Fade>)
  ;
};