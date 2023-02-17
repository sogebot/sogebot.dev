import { LoadingButton } from '@mui/lab';
import {
  Box, Button, Checkbox, Collapse, DialogContent, Divider, FormControlLabel, FormGroup, FormHelperText, Grid, LinearProgress, TextField,
} from '@mui/material';
import { Price } from '@sogebot/backend/dest/database/entity/price';
import axios from 'axios';
import { capitalize, cloneDeep } from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useEffect , useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
  const { propsError, reset, showErrors, validate, haveErrors } = useValidator();

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
  }, [id, props.items, reset]);

  useEffect(() => {
    if (!loading && item) {
      validate(Price, item);
    }
  }, [item, loading, validate]);

  const handleClose = () => {
    navigate('/commands/price');
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${JSON.parse(sessionStorage.server)}/api/systems/price`,
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
      <DialogContent>
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
              <TextField
                fullWidth
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
                fullWidth
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