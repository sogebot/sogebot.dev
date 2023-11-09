import { Autocomplete, LoadingButton } from '@mui/lab';
import { Box, Button, Chip, Collapse, DialogContent, Divider, FormLabel, Grid, LinearProgress, Slider, Stack } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import { createFilterOptions } from '@mui/material/useAutocomplete';
import { SongPlaylist } from '@sogebot/backend/dest/database/entity/song';
import { cloneDeep } from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import YouTube, { YouTubeProps } from 'react-youtube';

import { dayjs } from '../../helpers/dayjsHelper';
import { getSocket } from '../../helpers/socket';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';

export const PlaylistEdit: React.FC<{
  tags: string[],
}> = (props) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { translate } = useTranslation();
  const [ item, setItem ] = useState<SongPlaylist>(Object.assign(new SongPlaylist(), { tags: [] }));
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { reset, setErrors, haveErrors, validate } = useValidator();
  const [ loading, setLoading ] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getSocket('/systems/songs').emit('find.playlist', {
        page:    0,
        perPage: 1,
        search:  id,
      }, (err, res) => {
        if (err) {
          console.error(err);
        } else {
          setItem(res[0] ?? Object.assign(new SongPlaylist(), { tags: [] }));
        }
        setLoading(false);

      });
      //setItem(props.items?.find(o => o.videoId === id) ?? Object.assign(new SongPlaylist(), { tags: [] }));
      setLoading(false);
    } else {
      setItem(Object.assign(new SongPlaylist(), { tags: [] }));
      setLoading(false);
    }
    reset();
  }, [id, reset]);

  const tagsItems = props.tags.map(tag => ({
    title: tag, value: tag,
  }));
  const filter = createFilterOptions<typeof tagsItems[number]>();

  const handleValueChange = <T extends keyof SongPlaylist>(key: T, value: SongPlaylist[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  };

  useEffect(() => {
    if (item) {
      validate(SongPlaylist, item);
    }
  }, [item, setErrors]);

  useEffect(() => {
    reset();
  }, [location.pathname, reset]);

  const handleClose = () => {
    navigate('/manage/songs/playlist');
  };

  const handleSave = useCallback(() => {
    setSaving(true);
    getSocket('/systems/songs').emit('songs::save', item, (err) => {
      if (err) {
        enqueueSnackbar(String(err), { variant: 'error' });
        setSaving(false);
        return;
      }
      setSaving(false);
      enqueueSnackbar('Song saved.', { variant: 'success' });
      navigate(`/manage/songs/playlist`);
    });
  }, [item, enqueueSnackbar, navigate]);

  const opts = useMemo<YouTubeProps['opts']>(() => {
    return {
      height: '100%',
      width:  '100%',
    };
  }, []);

  const setRange = useCallback((newValue: [min: number, max: number], activeThumb: number) => {
    const minDistance = 10;

    const update = cloneDeep(item);
    if (newValue[1] - newValue[0] < minDistance) {
      if (activeThumb === 0) {
        update.startTime = Math.min(newValue[0], update.length - minDistance),
        update.endTime =   Math.min(newValue[0], update.length - minDistance) + minDistance,
        setItem(update);
      } else {
        const clamped = Math.max(newValue[1], minDistance);
        update.startTime = clamped - minDistance,
        update.endTime =   clamped,
        setItem(update);

      }
    } else {
      update.startTime = newValue[0],
      update.endTime =   newValue[1],
      setItem(update);
    }
  }, [ item ]);

  const marks = useMemo(() => {
    const step = 60;
    const markCount = item.length / step;
    const list = [];
    for (let i = 0; i < markCount; i++) {
      list.push({
        value: i * step,
        label: dayjs.duration(i * step * 1000).format('HH:mm:ss').replace('00:0', '').replace('00:', ''),
      });
    }
    return list;
  }, [item]);

  return(<>
    {loading && <LinearProgress />}
    <Collapse in={!loading} mountOnEnter unmountOnExit>
      <DialogContent>
        <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <Grid>
            <Grid item>
              {item.videoId && <YouTube
                style={{ aspectRatio: '16/9' }}
                videoId={item.videoId}
                opts={opts}
              />}
            </Grid>
            <Grid item></Grid>
          </Grid>

          <Autocomplete
            fullWidth
            value={item.tags.map((o: string) => ({
              title: o, value: o,
            })) as { title: string, value: string }[]}
            multiple
            onChange={(event, newValue) => {
              if (Array.isArray(newValue)) {
                handleValueChange('tags', Array.from(new Set(['general', ...newValue.map(o => typeof o === 'string' ? o : o.value)])));
              }
            }}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);

              const { inputValue } = params;
              // Suggest the creation of a new value
              const isExisting = options.some((option) => inputValue === option.title);
              if (inputValue !== '' && !isExisting) {
                filtered.push({
                  value: inputValue,
                  title: `Add tag "${inputValue}"`,
                });
              }

              return filtered;
            }}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            options={tagsItems}
            getOptionLabel={(option) => {
            // Value selected with enter, right from the input
              if (typeof option === 'string') {
                return option;
              }
              // Add "xxx" option created dynamically
              if (option.value) {
                return option.value;
              }
              // Regular option
              return option.title;
            }}
            renderOption={(_props, option) => <li {..._props}>{option.title}</li>}
            isOptionEqualToValue={(option, v) => {
              return option.value === v.value;
            }}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  label={option.title}
                  {...getTagProps({ index })}
                  disabled={option.value==='general'}
                  key={option.title}
                  size="small"
                />
              ))
            }
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                variant="filled"
                label={translate('systems.quotes.tags.name')}
                placeholder='Start typing to add tag'
              />
            )}
          />

          <FormLabel sx={{ marginTop: '30px' }}>{translate('systems.songs.settings.volume')}</FormLabel>
          <Stack direction='row' spacing={2} alignItems="center">
            <FormControlLabel
              label={translate('systems.songs.calculated') }
              control={
                <Checkbox
                  checked={!item.forceVolume}
                  onChange={(_, checked) => handleValueChange('forceVolume', checked)}
                  inputProps={{ 'aria-label': 'controlled' }}
                />
              }/>

            <Slider
              disabled={!item.forceVolume}
              value={item.volume}
              max={100}
              valueLabelDisplay="on"
              valueLabelFormat={(value) => `${value}%`}
              size='small'
              onChange={(event, newValue) => handleValueChange('volume', Number(newValue))}
            />
          </Stack>

          <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 30px 0' }}>
            <FormLabel sx={{ width: '100px' }}>Trim song</FormLabel>
            <Slider
              marks={marks}
              value={[item.startTime, item.endTime]}
              disableSwap
              max={item.length}
              valueLabelDisplay="on"
              size='small'
              valueLabelFormat={(value) => dayjs.duration(value * 1000).format('HH:mm:ss').replace('00:0', '').replace('00:', '')}
              onChange={(event, newValue, activeThumb) => setRange(newValue as [min: number, max: number], activeThumb)}
            />
          </Stack>
        </Box>
      </DialogContent>
    </Collapse>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item></Grid>
        <Grid item>
          <Stack spacing={1} direction='row'>
            <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
            <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  </>);
};