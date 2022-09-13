import { KeywordGroup } from '@entity/keyword';
import { Clear } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, Fade, FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select, TextField,
} from '@mui/material';
import axios from 'axios';
import { capitalize, cloneDeep } from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import React, { useCallback, useState } from 'react';
import { useEffect } from 'react';

import { FormInputAdornmentCustomVariable } from '~/src/components/Form/Input/Adornment/CustomVariables';
import { classes } from '~/src/components/styles';
import getAccessToken from '~/src/getAccessToken';
import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';

export const KeywordGroupEdit: React.FC<{
  onSave: () => void,
}> = ({
  onSave,
}) => {
  const router = useRouter();

  const [ group, setGroup ] = useState<KeywordGroup | null>(null);

  const { translate } = useTranslation();
  const [ editDialog, setEditDialog ] = useState(false);
  const { permissions } = usePermissions();
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const query = router.query.groupId;
    if (!query) {
      setGroup(null);
      return;
    }

    axios.get(`${localStorage.server}/api/systems/keywords/groups`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(({ data }) => {
        const _group = data.data.find((o: { name: string }) => o.name === query) ?? {
          name:    query,
          options: {
            filter:     null,
            permission: null,
          },
        };
        setGroup(_group);
        setLoading(false);
      });
  }, [router.query, editDialog]);

  useEffect(() => {
    if (router.query.groupId) {
      setEditDialog(true);
    }
  }, [router]);

  const handleClose = () => {
    setEditDialog(false);
    setTimeout(() => {
      router.push('/commands/keywords/group/edit');
    }, 200);
  };

  const handleSave = useCallback(() => {
    setSaving(true);
    axios.post(`${localStorage.server}/api/systems/keywords/group`, group, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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

  return(<Dialog
    open={editDialog}
    fullWidth
    maxWidth='xs'
  >
    {router.query.groupId && loading
      && <Grid
        sx={{ pt: 10 }}
        container
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
      ><CircularProgress color="inherit" /></Grid>}
    <Fade in={!(router.query.groupId && loading)}>
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
  </Dialog>);
};