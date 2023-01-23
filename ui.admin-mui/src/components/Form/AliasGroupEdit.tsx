import { Clear } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, DialogContent, DialogTitle, Divider, Fade, FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select, TextField,
} from '@mui/material';
import { AliasGroup } from '@sogebot/backend/dest/database/entity/alias';
import { capitalize, cloneDeep } from 'lodash';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect , useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { FormInputAdornmentCustomVariable } from './Input/Adornment/CustomVariables';
import { getSocket } from '../../helpers/socket';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from '../../hooks/useTranslation';
import { classes } from '../styles';

export const AliasGroupEdit: React.FC<{
  onSave: () => void,
}> = ({
  onSave,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [ group, setGroup ] = useState<AliasGroup | null>(null);

  const { translate } = useTranslation();
  const { permissions } = usePermissions();
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!id) {
      setGroup(null);
      return;
    }
    getSocket('/systems/alias').emit('generic::groups::getAll', (err, res) => {
      if (err) {
        return console.error(err);
      }
      const _group = res.find(o => o.name === id) ?? {
        name:    id,
        options: {
          filter:     null,
          permission: null,
        },
      };
      setGroup(_group);
      setLoading(false);
    });
  }, [id]);

  const handleClose = () => {
    navigate('/commands/alias/group/edit');
  };

  const handleSave = useCallback(() => {
    setSaving(true);
    getSocket('/systems/alias').emit('generic::groups::save', group, (err) => {
      setSaving(false);
      if (err) {
        enqueueSnackbar('Something went wrong during saving.', { variant: 'error' });
        return console.error(err);
      }
      enqueueSnackbar('Alias group data saved.', { variant: 'success' });
      onSave();
    });
  }, [ group, onSave, enqueueSnackbar ]);

  const handleValueChange = <T extends keyof AliasGroup['options']>(key: T, value: string | null, append = false) => {
    if (!group) {
      return;
    }
    const update = cloneDeep(group);
    if (append) {
      update.options[key] = (update.options[key] ? update.options[key] : '') + (value || '');
    } else {
      if (value === '') {
        value = null;
      }
      update.options[key] = value;
    }
    setGroup(update);
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
    <Fade in={!(loading)}>
      <Box>
        <DialogTitle>{group?.name}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth variant="filled" sx={{ mt: 1 }}>
            <InputLabel id="permission-select-label">Group Permission</InputLabel>
            <Select
              label="Group Permission"
              labelId="permission-select-label"
              onChange={(event) => handleValueChange('permission', event.target.value)}
              value={group?.options.permission || ''}
              endAdornment={
                group?.options.permission && <InputAdornment sx={classes.selectAdornment} position="end">
                  <IconButton onClick={() => handleValueChange('permission', null)}><Clear fontSize="small" /></IconButton>
                </InputAdornment>
              }
            >
              {permissions?.map(o => (<MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>))}
            </Select>
          </FormControl>

          <TextField
            sx={{ mt: 1 }}
            fullWidth
            variant="filled"
            multiline
            onKeyPress={(e) => {
              e.key === 'Enter' && e.preventDefault();
            }}
            value={group?.options.filter || ''}
            label={capitalize(translate('systems.customcommands.filter.name'))}
            onChange={(event) => handleValueChange('filter', event.target.value)}
            InputProps={{
              endAdornment: <>
                <InputAdornment position="end" sx={{
                  alignSelf: 'baseline', paddingTop: '2px',
                }}>
                  {group?.options.filter && <IconButton onClick={() => handleValueChange('filter', '')}><Clear fontSize="small" /></IconButton>}
                  <FormInputAdornmentCustomVariable onSelect={(value) => handleValueChange('filter', value, true)}/>
                </InputAdornment>
              </>,
            }}
          />

        </DialogContent>
      </Box>
    </Fade>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'end'}spacing={1}>
        <Grid item>
          <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
        </Grid>
        {group && <Grid item>
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving}>Save</LoadingButton>
        </Grid>}
      </Grid>
    </Box>
  </>);
};