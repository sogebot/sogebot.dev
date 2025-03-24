import { Price } from '@entity/price';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Checkbox, Collapse, DialogActions, DialogContent, Divider, FormControlLabel, FormGroup, FormHelperText, Grid, LinearProgress, TextField } from '@mui/material';
import axios from 'axios';
import { capitalize, cloneDeep } from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useEffect , useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { FormNumericInput } from './Input/Numeric';
import getAccessToken from '../../getAccessToken';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';

const newItem = new Price();
newItem.command = '';
newItem.emitRedeemEvent = false;
newItem.price = 0;
newItem.priceBits = 0;
newItem.enabled = true;

export const PriceEdit: React.FC<{
  items: Required<Price>[]
}> = (props) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { translate } = useTranslation();
  const [ item, setItem ] = useState(newItem);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, showErrors, validate, haveErrors, dirtify } = useValidator({ schema: new Price()._schema });

  const handleValueChange = <T extends keyof Price>(key: T, value: Price[T]) => {
    if (!item) {
      return;
    }

    if (key === 'price' || key === 'priceBits') {
      dirtify('invalidPrice');
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
  }, [id, props.items, reset]);

  useEffect(() => {
    if (!loading && item) {
      validate(item);
    }
  }, [item, loading]);

  const handleClose = () => {
    navigate('/commands/price');
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`/api/systems/price`,
      { ...item },
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Price saved.', { variant: 'success' });
        navigate(`/commands/price/edit/${response.data.data.id}`);
      })
      .catch(e => {
        showErrors(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  return(<>
    {loading && <LinearProgress />}
    <Collapse in={!loading} mountOnEnter unmountOnExit>
      <DialogContent dividers>
        <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            fullWidth
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

          <Grid container>
            <Grid item xs>
              <FormNumericInput
                min={0}
                fullWidth
                {...propsError('price')}
                error={propsError('invalidPrice').error || propsError('price').error}
                variant="filled"
                value={item?.price || 0}
                label={`${translate('price')} (${translate('points')})`}
                onChange={(value) => handleValueChange('price', Number(value))}
              />
            </Grid>
            <Divider orientation="vertical" flexItem>
              {translate('or')}
            </Divider>
            <Grid item xs>
              <FormNumericInput
                min={0}
                fullWidth
                {...propsError('priceBits')}
                error={propsError('invalidPrice').error || propsError('priceBits').error}
                variant="filled"
                value={item?.priceBits || 0}
                label={`${translate('price')} (${translate('bits')})`}
                onChange={(value) => handleValueChange('priceBits', Number(value))}
              />
            </Grid>
          </Grid>

          {propsError('invalidPrice').error && <FormHelperText error sx={{ ml: '14px', position: 'relative', top: '-5px' }}>One of the prices must be set above 0.</FormHelperText>}

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
    </Collapse>
    <DialogActions>
      <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
      <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
    </DialogActions>
  </>);
};