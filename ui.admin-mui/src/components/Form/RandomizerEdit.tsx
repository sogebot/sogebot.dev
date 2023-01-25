import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, DialogContent, Divider, Fade, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField,
} from '@mui/material';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import defaultPermissions from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import axios from 'axios';
import { validateOrReject } from 'class-validator';
import { cloneDeep, merge } from 'lodash';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import getAccessToken from '../../getAccessToken';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';
import { AccordionPosition } from '../Accordion/Position';
import { AccordionTTS } from '../Accordion/TTS';

const emptyItem: Partial<Randomizer> = {
  position: {
    x:       50,
    y:       50,
    anchorX: 'middle',
    anchorY: 'middle',
  },
  tts: {
    enabled: false,
    pitch:   1,
    rate:    1,
    voice:   '',
    volume:  0.5,
  },
};

export const RandomizerEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { permissions } = usePermissions();
  const { translate } = useTranslation();
  const [ item, setItem ] = React.useState<Randomizer>(new Randomizer(emptyItem));
  const [ loading, setLoading ] = React.useState(true);
  const [ saving, setSaving ] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const [ expanded, setExpanded ] = React.useState('');

  const handleValueChange = <T extends keyof Randomizer>(key: T, value: Randomizer[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  };

  React.useEffect(() => {
    if (id) {
      setLoading(true);
      axios.get(`${JSON.parse(localStorage.server)}/api/registries/randomizer/${id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
        .then(({ data }) => {
          console.log(data.data);
          setItem(data.data ?? new Randomizer(emptyItem));
          setLoading(false);
        });
    } else {
      setItem(new Randomizer(emptyItem));
      setLoading(false);
    }
    reset();
  }, [id, reset]);

  React.useEffect(() => {
    if (!loading && item) {
      const toCheck = new Randomizer();
      merge(toCheck, item);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, setErrors]);

  const handleClose = () => {
    navigate(`/registry/randomizer?server=${JSON.parse(localStorage.server)}`);
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${JSON.parse(localStorage.server)}/api/registries/randomizer`,
      { ...item },
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(({ data }) => {
        enqueueSnackbar('Randomizer saved.', { variant: 'success' });
        navigate(`/registries/randomizer/edit/${data.data.id}?server=${JSON.parse(localStorage.server)}`);
      })
      .catch(e => {
        validate(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  return(<>
    {loading
      && <Grid
        sx={{ pt: 10 }}
        container
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
      ><CircularProgress color="inherit" /></Grid>}
    <Fade in={!loading}>
      { item && <DialogContent>
        <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            fullWidth
            {...propsError('item')}
            variant="filled"
            required
            value={item?.name || ''}
            label={translate('registry.randomizer.form.name')}
            onChange={(event) => handleValueChange('name', event.target.value)}
          />

          <Stack direction='row' spacing={1}>
            <TextField
              fullWidth
              {...propsError('command')}
              variant="filled"
              required
              value={item?.command || ''}
              label={translate('registry.randomizer.form.command')}
              onChange={(event) => handleValueChange('command', event.target.value)}
            />
            <FormControl fullWidth variant="filled" >
              <InputLabel id="type-select-label">{translate('registry.randomizer.form.type')}</InputLabel>
              <Select
                label={translate('registry.randomizer.form.type')}
                labelId="type-select-label"
                onChange={(event) => handleValueChange('type', event.target.value as 'simple' | 'wheelOfFortune' | 'tape')}
                value={item?.type || 'simple'}
              >
                <MenuItem value='simple'>{translate('registry.randomizer.form.simple')}</MenuItem>
                <MenuItem value='wheelOfFortune'>{translate('registry.randomizer.form.wheelOfFortune')}</MenuItem>
                <MenuItem value='tape'>{translate('registry.randomizer.form.tape')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth variant="filled" >
              <InputLabel id="permission-select-label">{translate('permissions')}</InputLabel>
              <Select
                label={translate('permissions')}
                labelId="permission-select-label"
                onChange={(event) => handleValueChange('permissionId', event.target.value)}
                value={item?.permissionId || defaultPermissions.VIEWERS}
              >
                {permissions?.map(o => (<MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>))}
              </Select>
            </FormControl>
          </Stack>

          {item.position && <AccordionPosition
            model={item.position}
            disabled={item.type === 'wheelOfFortune'}
            open={expanded}
            onClick={value => typeof value === 'string' && setExpanded(value)}
            onChange={(value) => handleValueChange('position', value)}
          />}

          {item.tts && <AccordionTTS
            model={item.tts}
            open={expanded}
            onClick={value => typeof value === 'string' && setExpanded(value)}
            onChange={(value) => handleValueChange('tts', value)}
          />}

        </Box>
      </DialogContent>}
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
  </>);
};