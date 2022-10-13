import { Rank } from '@entity/rank';
import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, Dialog, DialogContent, Divider, Fade, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField,
} from '@mui/material';
import axios from 'axios';
import { validateOrReject } from 'class-validator';
import { capitalize, merge } from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { useEffect } from 'react';

import getAccessToken from '~/src/getAccessToken';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';
import { StripTypeORMEntity } from '~/src/types/stripTypeORMEntity';

const newItem = new Rank();
newItem.value = 0;
newItem.type = 'viewer';

export const RankEdit: React.FC<{
  items: Rank[]
}> = (props) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const [ editDialog, setEditDialog ] = useState(false);
  const [ item, setItem ] = useState<StripTypeORMEntity<Rank>>(newItem);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const handleValueChange = useCallback(<T extends keyof Rank>(key: T, value: Rank[T]) => {
    setItem(i => ({
      ...i, [key]: value,
    }));
  }, []);

  useEffect(() => {
    setLoading(true);
    if (router.query.id) {
      const it = props.items?.find(o => o.id === router.query.id) ?? newItem;
      setItem(it);
    } else {
      setItem(newItem);
    }
    setLoading(false);
    reset();
  }, [router.query.id, props.items, editDialog, reset]);

  useEffect(() => {
    if (!loading && editDialog && item) {
      const toCheck = new Rank();
      merge(toCheck, item);
      console.log('Validating', toCheck);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, editDialog, setErrors]);

  useEffect(() => {
    if (router.asPath.includes('ranks/edit/') || router.asPath.includes('ranks/create') ) {
      setEditDialog(true);
    }
  }, [router]);

  const handleClose = () => {
    setEditDialog(false);
    setTimeout(() => {
      router.push('/manage/ranks');
    }, 200);
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${localStorage.server}/api/systems/ranks`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Rank saved.', { variant: 'success' });
        router.push(`/manage/ranks/edit/${response.data.data.id}`);
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
            {...propsError('value')}
            variant="filled"
            value={item?.value ?? 0}
            required
            type="number"
            label={capitalize(translate('responses.variable.value'))}
            fullWidth
            onChange={(event) => handleValueChange('value', Number(event.target.value))}
          />
          <TextField
            {...propsError('rank')}
            variant="filled"
            value={item?.rank ?? ''}
            required
            label={capitalize(translate('rank'))}
            fullWidth
            onChange={(event) => handleValueChange('rank', event.target.value)}
          />

          <FormControl fullWidth>
            <InputLabel variant='filled' id="poll-options-label">{capitalize(translate('type'))}</InputLabel>
            <Select
              variant='filled'
              labelId="poll-options-label"
              value={item?.type ?? 'viewer'}
              label={capitalize(translate('type'))}
              onChange={(event) => handleValueChange('type', event.target.value as any)}
            >
              <MenuItem value='viewer'>Watch Time</MenuItem>
              <MenuItem value='subscriber'>Subscriber months</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
    </Fade>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item/>
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