import { LoadingButton } from '@mui/lab';
import { Box, Button, Checkbox, Collapse, DialogContent, Divider, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, InputLabel, LinearProgress, MenuItem, Select, Stack, TextField } from '@mui/material';
import { Cooldown } from '@sogebot/backend/dest/database/entity/cooldown';
import axios from 'axios';
import { capitalize, cloneDeep } from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { DAY, HOUR, MINUTE, SECOND } from '../../constants';
import getAccessToken from '../../getAccessToken';
import { timestampToObject } from '../../helpers/getTime';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';

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
  const { translate } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [ item, setItem ] = useState<Cooldown>(newItem);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, showErrors, validate, haveErrors } = useValidator();

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
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  }, [item]);

  useEffect(() => {
    handleValueChange('miliseconds', time.days * DAY + time.hours * HOUR + time.minutes * MINUTE + time.seconds * SECOND);
  }, [time, handleValueChange]);

  useEffect(() => {
    setLoading(true);
    if (id) {
      const it = props.items?.find(o => o.id === id) ?? newItem;
      console.log({
        id, it, items: props.items, a: props.items?.find(o => o.id === id),
      });
      setTime(timestampToObject(it.miliseconds));
      setItem(it);
    } else {
      setItem(newItem);
      setTime(timestampToObject(5 * 60000));
    }
    setLoading(false);
    reset();
  }, [id, props.items, reset]);

  useEffect(() => {
    if (!loading && item) {
      validate(Cooldown, item);
    }
  }, [item, loading, validate]);

  const handleClose = () => {
    navigate('/commands/cooldowns');
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${JSON.parse(localStorage.server)}/api/systems/cooldown`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Cooldown saved.', { variant: 'success' });
        navigate(`/commands/cooldowns/edit/${response.data.data.id}`);
      })
      .catch(e => {
        showErrors(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

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
    </Collapse>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
        <Grid item>
          <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
        </Grid>
        <Grid item>
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
        </Grid>
      </Grid>
    </Box>
  </>);
};