import { Clear } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Collapse, DialogContent, DialogTitle, Divider, FormControl, Grid, IconButton, InputAdornment, InputLabel, LinearProgress, MenuItem, Select, TextField } from '@mui/material';
import { KeywordGroup } from '@sogebot/backend/dest/database/entity/keyword';
import axios from 'axios';
import { capitalize, cloneDeep } from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { FormInputAdornmentCustomVariable } from './Input/Adornment/CustomVariables';
import getAccessToken from '../../getAccessToken';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from '../../hooks/useTranslation';
import { classes } from '../styles';

export const CommandGroupEdit: React.FC<{
  onSave: () => void,
}> = ({
  onSave,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [ group, setGroup ] = useState<KeywordGroup | null>(null);

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

    axios.get(`${JSON.parse(localStorage.server)}/api/systems/customcommands/groups`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(({ data }) => {
        const _group = data.data.find((o: { name: string }) => o.name === id) ?? {
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
    navigate('/commands/customcommands/group/edit');
  };

  const handleSave = useCallback(() => {
    setSaving(true);
    axios.post(`${JSON.parse(localStorage.server)}/api/systems/customcommands/group`, group, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(() => {
        setSaving(false);
        enqueueSnackbar('Keyword group data saved.', { variant: 'success' });
        onSave();
      });
  }, [ group, onSave, enqueueSnackbar ]);

  const handleValueChange = <T extends keyof KeywordGroup['options']>(key: T, value: string | null, append = false) => {
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
    {loading && <LinearProgress />}
    <Collapse in={!loading} mountOnEnter unmountOnExit>
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
    </Collapse>
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