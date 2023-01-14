import { Stack } from '@mdi/react';
import { CheckSharp } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete, Backdrop, Box, Button, Chip, CircularProgress, Container, Dialog, Divider, Drawer, Grid, List, ListItem, ListItemButton, TextField, Typography,
} from '@mui/material';
import { CacheGamesInterface } from '@sogebot/backend/dest/database/entity/cacheGames';
import { CacheTitlesInterface } from '@sogebot/backend/dest/database/entity/cacheTitles';
import { capitalize } from 'lodash';
import debounce from 'lodash/debounce';
import orderBy from 'lodash/orderBy';
import Image from 'next/image';
import * as React from 'react';
import SimpleBar from 'simplebar-react';

import { classes } from '~/src/components/styles';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';
import theme from '~/src/theme';

export const DashboardDialogSetGameAndTitle: React.FC<{ game: string, title: string, tags: string[], open: boolean, setOpen: (value: React.SetStateAction<boolean>) => void}> = (props) => {
  const [ options, setOptions ] = React.useState<string[]>([]);
  const [ loading, setLoading ] = React.useState(true);
  const [ titles, setTitles ] = React.useState<CacheTitlesInterface[]>([]);
  const [ cacheGames, setCacheGames ] = React.useState<CacheGamesInterface[]>([]);
  const [ inputValue, setInputValue ] = React.useState(props.game);
  const [ titleInputValue, setTitleInputValue ] = React.useState(props.title);

  const [ selectedTags, setSelectedTags ] = React.useState(props.tags);

  const [ isSearching, setIsSearching ] = React.useState(false);
  const [ isSaving, setIsSaving ] = React.useState(false);
  const [ hover, setHover ] = React.useState('');
  const { translate } = useTranslation();

  const [ isOpened, setIsOpened ] = React.useState(false);

  const [ lastValidGame, setLastValidGame ] = React.useState(props.game);

  React.useEffect(() => {
    if (props.open && isOpened) {
      setInputValue(props.game);
      setLastValidGame(props.game);
      setTitleInputValue(props.title);
      setIsOpened(true);
      setLoading(true);
    } else {
      setIsOpened(false);
    }
  }, [props, isOpened]);

  const usedTagsOptions = React.useMemo(() => {
    const tagList = new Set<string>();
    for (const title of titles) {
      title.tags.forEach(val => tagList.add(val));
    }
    console.log({ tagList });
    return [...tagList];
  }, [titles]);

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
    const value = [] as {title: string, tags: string[]}[];
    for (const title of orderBy(titles, 'timestamp', 'desc').filter(o => o.game === inputValue)) {
      if (!value.find(o => o.title === title.title)) {
        value.push({
          title: title.title, tags: title.tags,
        });
      }
      if (value.length === 20) {
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
      tags:  selectedTags,
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
      getSocket('/').emit('getUserTwitchGames', (_titles, games) => {
        console.groupCollapsed('panel::stats::getUserTwitchGames');
        console.log({
          _titles, games,
        });
        console.groupEnd();
        setTitles(_titles);
        setCacheGames(games);
        setLoading(false);
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
    <Dialog
      open={props.open}
      onClose={() => props.setOpen(false)}
      fullWidth
      maxWidth='lg'
      PaperProps={{ sx: { height: '100% !important' } }}
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
              label={capitalize(translate('game'))}
              variant="filled"
              placeholder='Start typing to Search game on Twitch'
              {...params}/>
          }
        />
        <TextField
          label={capitalize(translate('title'))}
          onKeyPress={(e) => {
            e.key === 'Enter' && save();
          }}
          fullWidth
          variant="filled"
          value={titleInputValue}
          onChange={(event) => setTitleInputValue(event.target.value)}/>
        <Autocomplete
          selectOnFocus
          handleHomeEndKeys
          freeSolo
          disableClearable
          filterOptions={(x) => x}
          options={usedTagsOptions}
          loading={isSearching}
          onChange={(_, value) => {
            value.length = Math.min(value.length, 10);
            setSelectedTags(value.map(o => o.replace(/ /g, '')));
          }}
          multiple
          renderTags={(value: readonly string[], getTagProps) =>
            value.map((option: string, index: number) => (
              <Chip size='small' variant="outlined" label={option} {...getTagProps({ index })} key={option} />
            ))
          }
          value={selectedTags}
          renderInput={(params) =>
            <TextField
              label={capitalize(translate('tags'))}
              variant="filled"
              placeholder='Start typing to add tag on Twitch and press ENTER'
              helperText='Add up to 10 tags. Each tag can be 25 characters long with no spaces or special characters.'
              {...params}/>
          }
        />

        {loading
          ? <Grid container sx={{
            placeContent: 'center', pt: 2,
          }}><Grid item><CircularProgress/></Grid></Grid>
          : <>
            <Typography component="div" variant="caption" sx={{ p: 2 }}>Last used games</Typography>
            <Grid container spacing={1} pl={1}>
              {lastGames.map((game) => {
                return (
                  <Grid sx={{
                    padding: '0px !important', height: '130px', ...classes.parent,
                  }} item key={game} xs={1} onMouseEnter={() => setHover(game)} onMouseLeave={() => setHover('')}>
                    <Image title={game} alt={game} fill src={(cacheGames.find(o => o.name === game)?.thumbnail || '').replace('{width}', '144').replace('{height}', '192')}/>
                    <Backdrop open={hover === game || inputValue === game} sx={classes.backdrop} onClick={() => setInputValue(game)}>
                      <CheckSharp/>
                    </Backdrop>
                  </Grid>
                );
              })}
            </Grid>

            <Typography component="div" variant="caption" sx={{
              p: 2, pb: 0,
            }}>Last used titles for {inputValue}</Typography>
            <SimpleBar style={{ height: 'calc(100% - 420px)' }} autoHide={false}>
              <List>
                {lastTitles.map((title) => {
                  return (
                    <ListItem
                      sx={{ color: title.title === titleInputValue ? theme.palette.primary.main : 'inherit' }}
                      disablePadding
                      key={title.title}>
                      <ListItemButton
                        sx={{
                          display: 'flex', flexDirection: 'column', alignItems: 'self-start',
                        }}
                        onClick={() => {
                          setTitleInputValue(title.title);
                          setSelectedTags(title.tags);
                        }}>
                        <Typography>{title.title}</Typography>
                        <Box>
                          {title.tags.map(tag => <Chip key={tag} size='small' label={tag} sx={{ mr: 1 }}/>)}
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </SimpleBar>
          </>
        }
      </Container>
      <Divider/>
      <Box sx={{
        height: '50px', p: 1,
      }}>
        <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
          <Grid item alignSelf={'end'}><Button sx={{ width: 150 }} onClick={() => props.setOpen(false)}>Close</Button></Grid>
          <Grid item alignSelf={'center'}>
            <LoadingButton sx={{ width: 150 }} variant="contained" loading={isSaving} onClick={() => save()}>Save</LoadingButton>
          </Grid>
        </Grid>
      </Box>
    </Dialog>
  );
};
