import { LoadingButton } from '@mui/lab';
import {
  Autocomplete, Box, Button, Checkbox, CircularProgress, createFilterOptions, DialogContent, Divider, Fade, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, InputLabel, MenuItem, Select, TextField,
} from '@mui/material';
import { Alias, AliasGroup } from '@sogebot/backend/dest/database/entity/alias';
import { defaultPermissions } from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import { validateOrReject } from 'class-validator';
import {
  capitalize, cloneDeep, merge,
} from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useEffect , useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getSocket } from '../../helpers/socket';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';

const filter = createFilterOptions<string>();

const newAlias = new Alias();
newAlias.alias = '';
newAlias.permission = defaultPermissions.VIEWERS;
newAlias.command = '';
newAlias.enabled = true;
newAlias.visible = true;
newAlias.group = null;

export const AliasEdit: React.FC<{
  aliasGroups: AliasGroup[]
  aliases: Alias[]
}> = (props) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { translate } = useTranslation();
  const { permissions } = usePermissions();
  const [ alias, setAlias ] = useState<Alias>(newAlias);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const handleValueChange = <T extends keyof Alias>(key: T, value: Alias[T]) => {
    if (!alias) {
      return;
    }
    const update = cloneDeep(alias);
    if (key === 'group' && String(value).trim().length === 0) {
      update.group = null;
    } else {
      update[key] = value;
    }
    setAlias(update);
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      setAlias(props.aliases?.find(o => o.id === id) ?? newAlias);
      setLoading(false);
    } else {
      setAlias(newAlias);
      setLoading(false);
    }
    reset();
  }, [id, props.aliases, reset]);

  useEffect(() => {
    if (!loading && alias) {
      const toCheck = new Alias();
      merge(toCheck, alias);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [alias, loading, setErrors]);

  const handleClose = () => {
    setTimeout(() => {
      navigate(`/commands/alias?server=${JSON.parse(sessionStorage.server)}`);
    }, 200);
  };

  const handleSave = () => {
    setSaving(true);
    getSocket('/systems/alias').emit('generic::save', alias, (err, savedItem) => {
      if (err) {
        validate(err as any);
      } else {
        enqueueSnackbar('Alias saved.', { variant: 'success' });
        navigate(`/commands/alias/edit/${savedItem.id}?server=${JSON.parse(sessionStorage.server)}`);
      }
      setSaving(false);
    });
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
      <DialogContent>
        <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            fullWidth
            {...propsError('alias')}
            variant="filled"
            required
            value={alias?.alias || ''}
            label={translate('alias')}
            onChange={(event) => handleValueChange('alias', event.target.value)}
          />

          <TextField
            fullWidth
            {...propsError('command')}
            variant="filled"
            value={alias?.command || ''}
            required
            multiline
            onKeyPress={(e) => {
              e.key === 'Enter' && e.preventDefault();
            }}
            label={translate('command')}
            onChange={(event) => handleValueChange('command', event.target.value)}
          />

          <Grid container columnSpacing={1}>
            <Grid item xs={6}>
              <FormControl fullWidth variant="filled" >
                <InputLabel id="permission-select-label">{translate('permissions')}</InputLabel>
                <Select
                  label={translate('permissions')}
                  labelId="permission-select-label"
                  onChange={(event) => handleValueChange('permission', event.target.value)}
                  value={alias?.permission || defaultPermissions.VIEWERS}
                >
                  {permissions?.map(o => (<MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth variant="filled">
                <Autocomplete
                  selectOnFocus
                  sx={{ '& .MuiFormControl-root': { marginTop: 0 } }}
                  handleHomeEndKeys
                  freeSolo
                  clearOnBlur
                  options={[...props.aliasGroups.map((o) => o.name)]}
                  onChange={(_, value) => {
                    handleValueChange('group', value as string);
                  }}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);

                    const { inputValue } = params;
                    // Suggest the creation of a new value
                    const isExisting = options.some((option) => inputValue === option);
                    if (inputValue !== '' && !isExisting) {
                      filtered.push(inputValue);
                    }

                    return filtered;
                  }}
                  value={alias?.group ?? ''}
                  renderInput={(params) =>
                    <TextField
                      label={translate('group')}
                      variant="filled"
                      {...params}/>
                  }
                />
              </FormControl>
            </Grid>
          </Grid>

          <Grid container columnSpacing={1}>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={alias?.enabled || false} onChange={(event) => handleValueChange('enabled', event.target.checked)}/>} label={translate('enabled')} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px',
                }}>
                  {alias?.enabled ? 'Alias is enabled': 'Alias is disabled'}
                </FormHelperText>
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={alias?.visible || false} onChange={(event) => handleValueChange('visible', event.target.checked)}/>} label={capitalize(translate('visible'))} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px',
                }}>
                  {alias?.visible ? 'Alias will be visible in lists': 'Alias won\'t be visible in lists'}
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
  </>);
};