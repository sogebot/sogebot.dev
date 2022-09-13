import { Price } from '@entity/price';
import { LoadingButton } from '@mui/lab';
import {
  Box, Button, Checkbox, CircularProgress, Dialog, DialogContent, Divider, Fade, FormControlLabel, FormGroup, FormHelperText, Grid, TextField,
} from '@mui/material';
import axios from 'axios';
import { validateOrReject } from 'class-validator';
import {
  capitalize, cloneDeep, merge,
} from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useEffect } from 'react';

import getAccessToken from '~/src/getAccessToken';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';

const newItem = new Price();
newItem.command = '';
newItem.emitRedeemEvent = false;
newItem.price = 0;
newItem.priceBits = 0;
newItem.enabled = true;

export const PriceEdit: React.FC<{
  items: Required<Price>[]
}> = (props) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const [ editDialog, setEditDialog ] = useState(false);
  const [ item, setItem ] = useState(newItem);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { id } = router.query;
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const handleValueChange = <T extends keyof Price>(key: T, value: Price[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      setItem(props.items?.find(o => o.id === id) ?? newItem);
      setLoading(false);
    } else {
      setItem(newItem);
      setLoading(false);
    }
    reset();
  }, [router, id, props.items, editDialog, reset]);

  useEffect(() => {
    if (!loading && editDialog && item) {
      const toCheck = new Price();
      merge(toCheck, item);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, editDialog, setErrors]);

  useEffect(() => {
    if (router.asPath.includes('price/edit/') || router.asPath.includes('price/create') ) {
      setEditDialog(true);
    }
  }, [router]);

  const handleClose = () => {
    setEditDialog(false);
    setTimeout(() => {
      router.push('/commands/price');
    }, 200);
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${localStorage.server}/api/systems/price`,
      { ...item },
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Price saved.', { variant: 'success' });
        router.push(`/commands/price/edit/${response.data.data.id}`);
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
          sx={{
            '& .MuiTextField-root': {
              my: 1, width: '100%', 
            }, 
          }}
          noValidate
          autoComplete="off"
        >
          <TextField
            {...propsError('command')}
            variant="filled"
            value={item?.command || ''}
            required
            multiline
            onKeyPress={(e) => {
              e.key === 'Enter' && e.preventDefault();
            }}
            label={translate('command')}
            onChange={(event) => handleValueChange('command', event.target.value)}
          />

          <Grid container sx={{ mt: 1 }} >
            <Grid item xs>
              <TextField
                {...propsError('price')}
                variant="filled"
                type="number"
                value={item?.price || 0}
                label={`${translate('price')} (${translate('points')})`}
                onChange={(event) => handleValueChange('price', Number(event.target.value))}
              />
            </Grid>
            <Divider orientation="vertical" flexItem>
              {translate('or')}
            </Divider>
            <Grid item xs>
              <TextField
                {...propsError('priceBits')}
                variant="filled"
                type="number"
                value={item?.priceBits || 0}
                label={`${translate('price')} (${translate('bits')})`}
                onChange={(event) => handleValueChange('priceBits', Number(event.target.value))}
              />
            </Grid>
          </Grid>

          <Grid container>
            <Grid item>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={item?.enabled || false} onChange={(event) => handleValueChange('enabled', event.target.checked)}/>} label={translate('enabled')} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px', 
                }}>
                  {item?.enabled ? 'Price is enabled': 'Price is disabled'}
                </FormHelperText>
              </FormGroup>
            </Grid>
          </Grid>
          <Grid container>
            <Grid item>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={item?.emitRedeemEvent || false} onChange={(event) => handleValueChange('emitRedeemEvent', event.target.checked)}/>} label={capitalize(translate('systems.price.emitRedeemEvent'))} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px', 
                }}>
                  {item?.emitRedeemEvent ? 'If price is paid, redeem event / alert will be triggered.': 'No event will be triggered.'}
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