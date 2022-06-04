import { useDispatch, useSelector } from 'react-redux';
import BackdropLoading from '../src/components/backdropLoading';
import NavDrawer from '../src/components/navDrawer';
import { Box, AppBar, Toolbar, Avatar, Badge, FormControl, Input, InputAdornment, IconButton, Fade } from '@mui/material';
import { AppProps } from 'next/app';
import TwitchEmbed from './components/twitchEmbed';
import theme from './theme';
import Image from 'next/image'
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { disableSearch, setSearch } from './store/searchSlice';
import ClearTwoToneIcon from '@mui/icons-material/ClearTwoTone';
import SearchIcon from '@mui/icons-material/SearchTwoTone';

export default function Layout(props: AppProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { haveSearch, search } = useSelector((state: any) => state.search);

  let [lastPath, setLastPath] = useState('/')

  useEffect(() => {
    if (lastPath !== router.asPath) {
    setLastPath(router.asPath);
      dispatch(disableSearch())
    }
  }, [dispatch, router])

  const handleClearSearch = () => {
    dispatch(setSearch(''))
  }

  const { state } = useSelector((state: any) => state.loader);
  const { Component, pageProps } = props;

  return (
    <>{!state && <BackdropLoading />}
      {state &&  <Box sx={{ flexGrow: 1 }}>
      <AppBar position="sticky" elevation={5} sx={{ zIndex: theme.zIndex.drawer + 1}}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Badge badgeContent={'public'} color="primary"
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}>
              <a href="https://sogebot.xyz" target={'_blank'} rel="noreferrer"><Image src={"/public/static/sogebot_large.png"} width={190} height={25} /></a>
            </Badge>
          </Box>

          <Fade in={haveSearch}>
            <FormControl sx={{ pr: 4 }}>
              <Input
                id="search"
                value={search}
                placeholder="Type to search"
                onChange={(event) => dispatch(setSearch(event.target.value))}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                }
                endAdornment={
                  <Fade in={search.length > 0}>
                    <InputAdornment position="end">
                      <IconButton onClick={handleClearSearch}>
                        <ClearTwoToneIcon />
                      </IconButton>
                    </InputAdornment>
                  </Fade>
                }
              />
            </FormControl>
          </Fade>
          <Avatar alt="Sogeking!" src="https://i.pravatar.cc/32" />
        </Toolbar>
      </AppBar>
      <NavDrawer />

      <Box sx={{ paddingLeft:'72px'}}>
        <TwitchEmbed/>
        <Box sx={{ maxHeight:'calc(100vh - 65px)', overflow: 'auto', maxWidth:'calc(100vw - 65px)' }}>
          <Component  {...pageProps} />
        </Box>
      </Box>
    </Box>}</>
  );
}