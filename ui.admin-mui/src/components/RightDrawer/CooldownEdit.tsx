import { Cooldown } from '@entity/cooldown';
import { LoadingButton } from '@mui/lab';
import {
  Box, Button, Checkbox, CircularProgress, Dialog, DialogContent, Divider, Fade, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, InputLabel, MenuItem, Select, Stack, TextField,
} from '@mui/material';
import { useWhatChanged } from '@simbathesailor/use-what-changed';
import {
  DAY, HOUR, MINUTE, SECOND,
} from '@sogebot/ui-helpers/constants';
import axios from 'axios';
import { validateOrReject } from 'class-validator';
import {
  capitalize,
  merge,
} from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {  useCallback, useState } from 'react';
import { useEffect } from 'react';

import getAccessToken from '~/src/getAccessToken';
import { timestampToObject } from '~/src/helpers/getTime';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';
import { StripTypeORMEntity } from '~/src/types/stripTypeORMEntity';

const newItem = new Cooldown();
newItem.name = '';
newItem.miliseconds = 0;
newItem.type = 'global';
newItem.timestamp = new Date(0).toISOString();
newItem.isEnabled = true;
newItem.isErrorMsgQuiet = false;
newItem.isOwnerAffected = true;
newItem.isModeratorAffected = true;
newItem.isSubscriberAffected = true;

export const CooldownEdit: React.FC<{
  items: Required<Cooldown>[]
}> = (props) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const [ editDialog, setEditDialog ] = useState(false);
  const [ item, setItem ] = useState<StripTypeORMEntity<Cooldown>>(newItem);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const [ time, setTime ] = useState({
    days: 0, hours: 0, minutes: 5, seconds: 0,
  });

  const handleTimeChange = <T extends keyof typeof time>(input: typeof time, key: T, value: string) => {
    let numberVal = Number(value);

    if (key === 'seconds' && numberVal < 0) {
      if (input.minutes > 0 || input.hours > 0 || input.days > 0) {
        const updatedInput = {
          ...input, [key]: 59,
        };
        handleTimeChange(updatedInput, 'minutes', String(input.minutes - 1));
        return;
      } else {
        numberVal = 0;
      }
    }

    if (key === 'minutes' && numberVal < 0) {
      if (input.hours > 0 || input.days > 0) {
        const updatedInput = {
          ...input, [key]: 59,
        };
        handleTimeChange(updatedInput, 'hours', String(input.hours - 1));
        return;
      } else {
        numberVal = 0;
      }
    }

    if (key === 'hours' && numberVal < 0) {
      if (input.days > 0) {
        const updatedInput = {
          ...input, [key]: 23,
        };
        handleTimeChange(updatedInput, 'days', String(input.days - 1));
        return;
      } else {
        numberVal = 0;
      }
    }

    if ((key === 'seconds' || key === 'minutes') && numberVal >= 60) {
      const updatedInput = {
        ...input, [key]: 0,
      };
      if(key === 'seconds') {
        handleTimeChange(updatedInput, 'minutes', String(input.minutes + 1));
      } else {
        handleTimeChange(updatedInput, 'hours', String(input.hours + 1));
      }
      return;
    }

    if (key === 'hours' && numberVal >= 24) {
      const updatedInput = {
        ...input, [key]: 0,
      };
      handleTimeChange(updatedInput, 'days', String(input.days + 1));
      return;

    }

    if (numberVal < 0) {
      numberVal = 0;
    }

    setTime({
      ...input, [key]: numberVal,
    });
  };

  const handleValueChange = useCallback(<T extends keyof Cooldown>(key: T, value: Cooldown[T]) => {
    setItem(i => ({
      ...i, [key]: value,
    }));
  }, []);

  useEffect(() => {
    handleValueChange('miliseconds', time.days * DAY + time.hours * HOUR + time.minutes * MINUTE + time.seconds * SECOND);
  }, [time, handleValueChange]);

  useEffect(() => {
    setLoading(true);
    if (router.query.id) {
      const it = props.items?.find(o => o.id === router.query.id) ?? newItem;
      setItem(it);
      setTime(timestampToObject(it.miliseconds));
    } else {
      setItem(newItem);
      setTime(timestampToObject(5 * 60000));
    }
    setLoading(false);
    reset();
  }, [router.query.id, props.items, editDialog, reset]);

  useWhatChanged([item]);
  useEffect(() => {
    if (!loading && editDialog && item) {
      const toCheck = new Cooldown();
      merge(toCheck, item);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, editDialog, setErrors]);

  useEffect(() => {
    if (router.asPath.includes('cooldowns/edit/') || router.asPath.includes('cooldowns/create') ) {
      setEditDialog(true);
    }
  }, [router]);

  const handleClose = () => {
    setEditDialog(false);
    setTimeout(() => {
      router.push('/commands/cooldowns');
    }, 200);
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${JSON.parse(localStorage.server)}/api/systems/cooldown`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Cooldown saved.', { variant: 'success' });
        router.push(`/commands/cooldowns/edit/${response.data.data.id}`);
      })
      .catch(e => {
        validate(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

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
          <TextField
            fullWidth
            {...propsError('name')}
            variant="filled"
            value={item?.name || ''}
            required
            multiline
            onKeyPress={(e) => {
              e.key === 'Enter' && e.preventDefault();
            }}
            label={'!' + translate('command') + ', ' + translate('keyword') + ' ' + translate('or') + ' g:' + translate('group')}
            onChange={(event) => handleValueChange('name', event.target.value)}
          />

          <Stack direction='row'>
            <TextField
              fullWidth
              variant="filled"
              type="number"
              value={time.days}
              required
              label={'Days'}
              onChange={(event) => handleTimeChange(time, 'days', event.target.value)}
              sx={{
                '& .MuiInputBase-root': {
                  borderRadius: 0, borderLeftRightRadius: '4px',
                },
              }}
            />
            <TextField
              fullWidth
              variant="filled"
              type="number"
              value={time.hours}
              required
              label={'Hours'}
              onChange={(event) => handleTimeChange(time, 'hours', event.target.value)}
              sx={{ '& .MuiInputBase-root': { borderRadius: 0 } }}
            />
            <TextField
              fullWidth
              variant="filled"
              type="number"
              value={time.minutes}
              required
              label={'Minutes'}
              onChange={(event) => handleTimeChange(time, 'minutes', event.target.value)}
              sx={{ '& .MuiInputBase-root': { borderRadius: 0 } }}
            />
            <TextField
              fullWidth
              variant="filled"
              type="number"
              value={time.seconds}
              required
              label={'Seconds'}
              onChange={(event) => handleTimeChange(time, 'seconds', event.target.value)}
              sx={{
                '& .MuiInputBase-root': {
                  borderRadius: 0, borderTopRightRadius: '4px',
                },
              }}
            />
          </Stack>

          <FormControl fullWidth variant='filled'>
            <InputLabel id="cooldown-type-label">{translate('type')}</InputLabel>
            <Select
              labelId="cooldown-type-label"

              label={translate('type')}
              value={item ? item.type : 'global'}
              onChange={event => handleValueChange('type', event.target.value as any)}
            >
              <MenuItem value="global">{translate('global')}</MenuItem>
              <MenuItem value="user">{translate('user')}</MenuItem>
            </Select>
            <FormHelperText>
              {item.type === 'global' ? 'Cooldown will be shared among users.' : 'Each user will have own cooldown'}
            </FormHelperText>
          </FormControl>

          <Grid container>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={item?.isEnabled || false} onChange={(event) => handleValueChange('isEnabled', event.target.checked)}/>} label={translate('enabled')} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px',
                }}>
                  {item?.isEnabled ? 'Cooldown is enabled': 'Cooldown is disabled'}
                </FormHelperText>
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={item?.isErrorMsgQuiet || false} onChange={(event) => handleValueChange('isErrorMsgQuiet', event.target.checked)}/>} label={capitalize(translate('quiet'))} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px',
                }}>
                  {item?.isErrorMsgQuiet
                    ? 'Cooldown won\'t send message if triggered.'
                    : 'Cooldown will send message if triggered.'}
                </FormHelperText>
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={item?.isOwnerAffected || false} onChange={(event) => handleValueChange('isOwnerAffected', event.target.checked)}/>} label={capitalize(translate('core.permissions.casters'))} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px',
                }}>
                  {item?.isOwnerAffected
                    ? 'Owners will be affected with cooldown.'
                    : 'Owners won\'t be affected with cooldown.'}
                </FormHelperText>
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={item?.isModeratorAffected || false} onChange={(event) => handleValueChange('isModeratorAffected', event.target.checked)}/>} label={capitalize(translate('core.permissions.moderators'))} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px',
                }}>
                  {item?.isModeratorAffected
                    ? 'Moderators will be affected with cooldown.'
                    : 'Moderators won\'t be affected with cooldown.'}
                </FormHelperText>
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={item?.isSubscriberAffected || false} onChange={(event) => handleValueChange('isSubscriberAffected', event.target.checked)}/>} label={capitalize(translate('core.permissions.subscribers'))} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px',
                }}>
                  {item?.isSubscriberAffected
                    ? 'Subscribers will be affected with cooldown.'
                    : 'Subscribers won\'t be affected with cooldown.'}
                </FormHelperText>
              </FormGroup>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Fade>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
        <Grid item>
          <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
        </Grid>
        <Grid item>
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors}>Save</LoadingButton>
        </Grid>
      </Grid>
    </Box>
  </Dialog>);
};