import { CheckSharp } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete, Backdrop, Box, Button, Container, Divider, Drawer, Grid, List, ListItem, ListItemButton, TextField, Typography,
} from '@mui/material';
import debounce from 'lodash/debounce';
import orderBy from 'lodash/orderBy';
import Image from 'next/image';
import * as React from 'react';

import { getSocket } from '~/src/helpers/socket';
import { useStyles } from '~/src/hooks/useStyles';
import theme from '~/src/theme';

export const DashboardDialogSetGameAndTitle: React.FC<{ game: string, title: string, open: boolean, setOpen: (value: React.SetStateAction<boolean>) => void}> = (props) => {
  const [ options, setOptions ] = React.useState<string[]>([]);
  const [ titles, setTitles ] = React.useState<{ game: string, title: string, timestamp: number }[]>([]);
  const [ inputValue, setInputValue ] = React.useState(props.game);
  const [ titleInputValue, setTitleInputValue ] = React.useState(props.title);
  const [ isSearching, setIsSearching ] = React.useState(false);
  const [ isSaving, setIsSaving ] = React.useState(false);
  const [ hover, setHover ] = React.useState('');

  const [ isOpened, setIsOpened ] = React.useState(false);

  const [ lastValidGame, setLastValidGame ] = React.useState(props.game);

  const classes = useStyles();

  React.useEffect(() => {
    if (props.open && isOpened) {
      setInputValue(props.game);
      setLastValidGame(props.game);
      setTitleInputValue(props.title);
      setIsOpened(true);
    } else {
      setIsOpened(false);
    }
  }, [props, isOpened]);

  const lastGames = React.useMemo(() => {
    const gameList = [] as string[];
    for (const title of orderBy(titles, 'timestamp', 'desc')) {
      if (!gameList.includes(title.game)) {
        gameList.push(title.game);
      }
      if (gameList.length === 12) {
        break;
      }
    }
    return gameList;
  }, [titles]);

  const lastTitles = React.useMemo(() => {
    const value = [] as string[];
    for (const title of orderBy(titles, 'timestamp', 'desc').filter(o => o.game === inputValue)) {
      if (!value.includes(title.title)) {
        value.push(title.title);
      }
      if (value.length === 12) {
        break;
      }
    }
    return value;
  }, [titles, inputValue]);

  const cachedSearch = React.useMemo(() => new Map<string, string[]>(), []);

  const eventHandler = (event: any, newValue: string) => {
    setInputValue(newValue);
  };

  const save = () => {
    setIsSaving(true);
    getSocket('/').emit('cleanupGameAndTitle');

    const emit = {
      game:  inputValue,
      title: titleInputValue,
      tags:  [],
    };

    getSocket('/').emit('updateGameAndTitle', emit, () => {
      // wait second to have data propagated in dashboard
      setTimeout(() => {
        setIsSaving(false);
        props.setOpen(false);
      }, 1000);
    });
  };

  React.useEffect(() => {
    if (inputValue && inputValue.length > 0) {
      setIsSearching(true);
      setOptions([]);

      // check if we have this search cached
      if (cachedSearch.has(inputValue)) {
        console.log('Using cached search for ' + inputValue);
        setOptions(cachedSearch.get(inputValue) ?? []);
        setIsSearching(false);
      } else {
        console.log('Searching for ' + inputValue);
        getSocket('/').emit('getGameFromTwitch', inputValue, (values) => {
          cachedSearch.set(inputValue, values.sort());
          setOptions(values.sort());
          setIsSearching(false);
        });
      }
    }
  }, [inputValue, cachedSearch]);

  React.useEffect(() => {
    if (props.open) {
      getSocket('/').emit('getUserTwitchGames', (values) => {
        console.groupCollapsed('panel::stats::getUserTwitchGames');
        console.log(values);
        console.groupEnd();
        setTitles(values);
      });
    }
  }, [props.open]);

  const debouncedEventHandler = React.useMemo(
    () => debounce(eventHandler, 300)
    , []);

  const handleBlur = () => {
    // select last valid game
    if (!options.includes(inputValue)) {
      setInputValue(lastValidGame);
    } else {
      setLastValidGame(inputValue);
    }
  };

  return (
    <Drawer
      open={props.open}
      anchor="right"
      onClose={() => props.setOpen(false)}
      sx={{
        flexShrink:           0,
        '& .MuiDrawer-paper': {
          width:     500,
          boxSizing: 'border-box',
        },
      }}
    >
      <Container disableGutters sx={{
        p: 1, height: 'calc(100% - 50px)', maxHeight: 'calc(100% - 50px)', overflow: 'auto',
      }}>
        <Autocomplete
          selectOnFocus
          onBlur={handleBlur}
          handleHomeEndKeys
          disableClearable
          onInputChange={debouncedEventHandler}
          filterOptions={(x) => x}
          options={options}
          loading={isSearching}
          value={inputValue}
          renderInput={(params) =>
            <TextField
              label='Game'
              variant="filled"
              placeholder='Start typing to Search game on Twitch'
              {...params}/>
          }
        />
        <TextField
          label='Title'
          fullWidth
          variant="filled"
          value={titleInputValue}
          onChange={(event) => setTitleInputValue(event.target.value)}/>

        <Typography component="div" variant="caption" sx={{ p: 2 }}>Last used games</Typography>
        <Grid container spacing={1} pl={1}>
          {lastGames.map((game) => {
            return (
              <Grid sx={{ padding: '0px !important', height: '114px' }} item key={game} xs={2} onMouseEnter={() => setHover(game)} onMouseLeave={() => setHover('')} className={classes.parent}>
                <Image alt='' width="200px" height="280px" src={'https://static-cdn.jtvnw.net/ttv-boxart/' + encodeURIComponent(game) + '-200x280.jpg'}/>
                <Backdrop open={hover === game || inputValue === game} className={classes.backdrop} onClick={() => setInputValue(game)}>
                  <CheckSharp/>
                </Backdrop>
              </Grid>
            );
          })}
        </Grid>

        <Typography component="div" variant="caption" sx={{ p: 2, pb: 0 }}>Last used titles for {inputValue}</Typography>
        <List>
          {lastTitles.map((title) => {
            return (
              <ListItem sx={{ color: title === titleInputValue ? theme.palette.primary.main : 'inherit' }}disablePadding key={title}><ListItemButton onClick={() => setTitleInputValue(title)}>{title}</ListItemButton></ListItem>
            );
          })}
        </List>
      </Container>
      <Divider/>
      <Box sx={{ height: '50px', p: 1 }}>
        <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
          <Grid item alignSelf={'end'}><Button sx={{ width: 150 }} onClick={() => props.setOpen(false)}>Close</Button></Grid>
          <Grid item alignSelf={'center'}>
            <LoadingButton sx={{ width: 150 }} variant="contained" loading={isSaving} onClick={() => save()}>Save</LoadingButton>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  );
};
