import { HowLongToBeatGame } from '@entity/howLongToBeatGame';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Box, Button, CircularProgress, Dialog, DialogContent, Divider, Fade, FormLabel, Grid, Slider, Stack, TextField, Typography,
} from '@mui/material';
import { HOUR, MINUTE } from '@sogebot/ui-helpers/constants';
import axios from 'axios';
import { validateOrReject } from 'class-validator';
import {
  capitalize,
  merge,
} from 'lodash';
import debounce from 'lodash/debounce';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  useCallback, useMemo, useState,
} from 'react';
import { useEffect } from 'react';
import { v4 } from 'uuid';

import getAccessToken from '~/src/getAccessToken';
import { dayjs } from '~/src/helpers/dayjsHelper';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';
import { StripTypeORMEntity } from '~/src/types/stripTypeORMEntity';

export const HLTBEdit: React.FC<{
  items: HowLongToBeatGame[]
}> = (props) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const [ editDialog, setEditDialog ] = useState(false);
  const [ item, setItem ] = useState<StripTypeORMEntity<HowLongToBeatGame>>(new HowLongToBeatGame({
    game:   '',
    offset: 0,
  }));
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const handleValueChange = useCallback(<T extends keyof HowLongToBeatGame>(key: T, value: HowLongToBeatGame[T]) => {
    setItem(i => ({
      ...i, [key]: value,
    }));
  }, []);

  useEffect(() => {
    setLoading(true);
    if (router.query.id) {
      const it = props.items?.find(o => o.id === router.query.id) ?? new HowLongToBeatGame({
        id:     v4(),
        game:   '',
        offset: 0,
      });
      setItem(it);
      setLastValidGame(it.game);
      setInputValue(it.game);
    } else {
      setLastValidGame('');
      setInputValue('');
      setItem(new HowLongToBeatGame({
        id:     v4(),
        game:   '',
        offset: 0,
      }));
    }
    setLoading(false);
    reset();
  }, [router.query.id, props.items, editDialog, reset]);

  useEffect(() => {
    if (!loading && editDialog && item) {
      const toCheck = new HowLongToBeatGame();
      merge(toCheck, item);
      console.log('Validating', toCheck);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, editDialog, setErrors]);

  useEffect(() => {
    if (router.asPath.includes('howlongtobeat/create') || router.asPath.includes('howlongtobeat/edit') ) {
      setEditDialog(true);
    } else {
      setEditDialog(false);
    }
  }, [router]);

  const handleClose = () => {
    setEditDialog(false);
    setTimeout(() => {
      router.push('/manage/howlongtobeat');
    }, 200);
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${JSON.parse(localStorage.server)}/api/systems/hltb/${item.id}`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(() => {
        enqueueSnackbar('Game saved.', { variant: 'success' });
        router.push(`/manage/howlongtobeat/`);
      })
      .catch(e => {
        validate(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  function calculateValue(value: number) {
    return 2 ** value;
  }

  function valueLabelFormat(value: number) {
    return (value > 0 ? ' +' : '') + dayjs.duration(value).format('H[h] m[m]').replace('0h', '').replace('-', '- ');
  }

  const marks = [
    {
      value: 0,
      label: 'no offset',
    },
    {
      value: -1 * HOUR,
      label: '- 1 hour',
    },
    {
      value: HOUR,
      label: '1 hour',
    },
    {
      value: -2 * HOUR,
      label: '- 2 hours',
    },
    {
      value: 2 * HOUR,
      label: '2 hours',
    },
    {
      value: -3 * HOUR,
      label: '- 3 hours',
    },
    {
      value: 3 * HOUR,
      label: '3 hours',
    },
    {
      value: -4 * HOUR,
      label: '- 4 hours',
    },
    {
      value: 4 * HOUR,
      label: '4 hours',
    },
  ];

  const [ lastValidGame, setLastValidGame ] = useState('');
  const [ inputValue, setInputValue ] = useState('');
  const [ options, setOptions ] = useState<string[]>([]);
  const [ isSearching, setIsSearching ] = useState(false);
  const cachedSearch = useMemo(() => new Map<string, string[]>(), []);

  const eventHandler = (event: any, newValue: string) => {
    setInputValue(newValue);
  };

  const debouncedEventHandler = useMemo(
    () => debounce(eventHandler, 300)
    , []);

  const handleBlur = () => {
    // select last valid game
    if (!options.includes(inputValue)) {
      setInputValue(lastValidGame);
      handleValueChange('game', lastValidGame);
    } else {
      setLastValidGame(inputValue);
      handleValueChange('game', inputValue);
    }
  };

  useEffect(() => {
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

  return(<Dialog
    open={editDialog}
    fullWidth
    maxWidth='md'
  >
    {loading
      && <Grid
        sx={{ pt: 10 }}
        container
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
      ><CircularProgress color="inherit" /></Grid>}
    <Fade in={!loading}>
      <DialogContent>
        <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <Autocomplete
            readOnly={!!router.query.id}
            selectOnFocus
            onBlur={handleBlur}
            handleHomeEndKeys
            disableClearable
            onInputChange={debouncedEventHandler}
            filterOptions={(x) => x}
            options={options}
            loading={isSearching}
            value={inputValue}
            sx={{ paddingBottom: '1em' }}
            renderInput={(params) =>
              <TextField
                label={capitalize(translate('systems.howlongtobeat.game'))}
                variant="filled"
                placeholder='Start typing to Search game on Twitch'
                {...params}
                {...propsError('game')}
                disabled={!!router.query.id}/>
            }
          />

          <FormLabel>Offset</FormLabel>
          <Stack direction={'row'} spacing={2}>
            <Box sx={{
              padding: '0 30px', width: '100%',
            }}>
              <Slider
                value={item.offset}
                min={- 4 * HOUR}
                step={10 * MINUTE}
                max={4 * HOUR}
                scale={calculateValue}
                valueLabelFormat={valueLabelFormat}
                onChange={(_ev, newValue) => handleValueChange('offset', Number(newValue))}
                valueLabelDisplay="off"
                size='small'
                marks={marks}
              />
            </Box>
            <Typography sx={{ minWidth: '75px' }}>{valueLabelFormat(item.offset)}</Typography>
          </Stack>
        </Box>
      </DialogContent>
    </Fade>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item></Grid>
        <Grid item>
          <Stack spacing={1} direction='row'>
            <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
            <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors}>Save</LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  </Dialog>);
};