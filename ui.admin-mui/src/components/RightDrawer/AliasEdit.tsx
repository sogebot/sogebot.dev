import { Error, ThumbUpSharp } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete, Box, Button, Checkbox, CircularProgress, createFilterOptions, Divider, Drawer, Fade, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, InputLabel, MenuItem, Select, TextField,
} from '@mui/material';
import { Container } from '@mui/system';
// import { Alias, AliasGroup } from '@entity/alias';
import { defaultPermissions } from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import { capitalize, cloneDeep } from 'lodash';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getSocket } from '~/src/helpers/socket';
import translate from '~/src/helpers/translate';
import { usePermissions } from '~/src/hooks/usePermissions';
import { showEditDialog } from '~/src/store/pageSlice';

type Alias = any;
type AliasGroup = any;

interface GroupType {
  inputValue?: string;
  title: string;
}

const filter = createFilterOptions<GroupType>();

//const newAlias = new Alias();
const newAlias: any = {};
newAlias.alias = '';
newAlias.permission = defaultPermissions.VIEWERS;
newAlias.command = '';
newAlias.enabled = true;
newAlias.visible = true;
newAlias.id = '';
newAlias.group = null;

export const AliasEdit: React.FC<{
  aliasGroups: AliasGroup[]
  aliases: Alias[]
}> = (props) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { editDialog } = useSelector((state: any) => state.page);
  const { permissions } = usePermissions();
  const [ alias, setAlias ] = useState<Alias>(newAlias);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const [ successButton, setSuccessButton ] = useState(false);
  const [ errorButton, setErrorButton ] = useState(false);
  const { id } = router.query;

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
    }
  }, [router, id, props.aliases]);

  useEffect(() => {
    getSocket('/systems/alias').emit('generic::validate', alias, (err) => {
      if (err) {
        return console.error(err);
      }
    });
  }, [alias]);

  const handleClose = () => {
    dispatch(showEditDialog(false));
    setTimeout(() => {
      router.push('/commands/alias');
    }, 200);
  };

  const handleSave = () => {
    setSaving(true);
    getSocket('/systems/alias').emit('generic::save', alias, (err) => {
      if (err) {
        setErrorButton(true);
        setTimeout(() => {
          setErrorButton(false);
        }, 500);
        console.error(err);
      } else {
        setSuccessButton(true);
        setTimeout(() => {
          setSuccessButton(false);
        }, 500);
      }
      setSaving(false);
    });
  };

  return(<Drawer
    open={editDialog}
    anchor="right"
    onClose={handleClose}
    sx={{
      flexShrink:           0,
      '& .MuiDrawer-paper': {
        padding:   '10px',
        marginTop: '58px',
        width:     500,
        boxSizing: 'border-box',
      },
    }}
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
      <Container disableGutters sx={{
        p: 1, height: 'calc(100% - 100px)', maxHeight: 'calc(100% - 100px)', overflow: 'auto',
      }}>
        <Box
          component="form"
          sx={{ '& .MuiTextField-root': { my: 1, width: '100%' } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            variant="filled"
            required
            value={alias?.alias || ''}
            label={translate('alias')}
            onChange={(event) => handleValueChange('alias', event.target.value)}
          />

          <TextField
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

          <FormControl fullWidth variant="filled" sx={{ mt: 1 }}>
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

          <FormControl fullWidth variant="filled" sx={{ mt: 1 }}>
            <Autocomplete
              selectOnFocus
              handleHomeEndKeys
              onChange={(event, newValue) => {
                if (typeof newValue === 'string') {
                  handleValueChange('group', newValue);
                } else if (newValue && newValue.inputValue) {
                // Create a new value from the user input
                  handleValueChange('group', newValue.inputValue);
                } else {
                  handleValueChange('group', newValue?.title ?? '');
                }
              }}
              getOptionLabel={(option) => {
              // Value selected with enter, right from the input
                if (typeof option === 'string') {
                  return option;
                }
                // Add "xxx" option created dynamically
                if (option.inputValue) {
                  return option.inputValue;
                }
                // Regular option
                return option.title;
              }}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                // Suggest the creation of a new value
                const isExisting = options.some((option) => inputValue === option.title);
                if (inputValue !== '' && !isExisting) {
                  filtered.push({
                    inputValue,
                    title: `Add "${inputValue}"`,
                  });
                }
                return filtered;
              }}
              renderOption={(props2, option) => <li {...props2}>{option.title}</li>}
              value={{ title: alias?.group ?? '' }}
              options={[...props.aliasGroups.map((o) => ({ title: o.name }))] as GroupType[]}
              renderInput={(params) =>
                <TextField
                  label={translate('group')}
                  variant="filled"
                  {...params}/>
              }
            />
          </FormControl>

          <Grid container sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={alias?.enabled || false} onChange={(event) => handleValueChange('enabled', event.target.checked)}/>} label={translate('enabled')} />
                <FormHelperText sx={{ position: 'relative', top: '-10px' }}>
                  {alias?.enabled ? 'Alias is enabled': 'Alias is disabled'}
                </FormHelperText>
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={alias?.visible || false} onChange={(event) => handleValueChange('visible', event.target.checked)}/>} label={capitalize(translate('visible'))} />
                <FormHelperText sx={{ position: 'relative', top: '-10px' }}>
                  {alias?.visible ? 'Alias will be visible in lists': 'Alias won\'t be visible in lists'}
                </FormHelperText>
              </FormGroup>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Fade>
    <Divider/>
    <Box sx={{ height: '50px', p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
        <Grid item alignSelf={'end'}>
          <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
        </Grid>
        <Grid item alignSelf={'center'}>
          {!successButton && !errorButton && <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving}>Save</LoadingButton>}
          {successButton && <Button variant='contained' color='success' sx={{ width: 150 }} startIcon={<ThumbUpSharp/>}>Saved</Button>}
          {errorButton && <Button variant='contained' color='error' sx={{ width: 150 }} startIcon={<Error/>}>Error!</Button>}
        </Grid>
      </Grid>
    </Box>
  </Drawer>);
};