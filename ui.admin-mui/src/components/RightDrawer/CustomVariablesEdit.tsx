import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, DialogContent, Divider, Fade, Grid, TextField,
} from '@mui/material';
import { VariableInterface } from '@sogebot/backend/dest/database/entity/variable';
import { cloneDeep } from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useEffect } from 'react';

import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';

const newItem: VariableInterface = {
  variableName:  '',
  currentValue:  '',
  evalValue:     '',
  permission:    '',
  responseType:  0,
  type:          'text',
  usableOptions: [],
  description:   '',
};

export const CustomVariablesEdit: React.FC<{
  id?: string
}> = ({ id }) => {
  const router = useRouter();
  const { propsError, reset, setErrors, /* validate, */ haveErrors } = useValidator();
  const { translate } = useTranslation();
  const [ item, setItem ] = useState<VariableInterface>(cloneDeep(newItem));
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleValueChange = <T extends keyof VariableInterface>(key: T, value: Required<VariableInterface[T]>) => {
    if (!item) {
      return;
    }
    setItem(v => ({
      ...v, [key]: value,
    }));
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      getSocket('/core/customvariables').emit('customvariables::list', (err, val) => {
        if (err) {
          enqueueSnackbar('Something went wrong during data loading.');
          router.push(`/registry/customvariables/?server=${JSON.parse(localStorage.server)}`);
        } else {
          setItem(val.find(o => o.id === id) ?? cloneDeep(newItem));
        }
        setLoading(false);
      });
    } else {
      setItem(cloneDeep(newItem));
      setLoading(false);
    }
    reset();
  }, [router, id, enqueueSnackbar, reset]);

  useEffect(() => {
    if (!loading && item) {
      /*
      const toCheck = new Alias();
      merge(toCheck, alias);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
        */
    }
  }, [item, loading, setErrors]);

  const handleClose = () => {
    router.push(`/registry/customvariables/?server=${JSON.parse(localStorage.server)}`);
  };

  const handleSave = () => {
    setSaving(true);
    /*
    getSocket('/systems/alias').emit('generic::save', alias, (err, savedItem) => {
      if (err) {
        validate(err as any);
      } else {
        enqueueSnackbar('Alias saved.', { variant: 'success' });
        router.push(`/commands/alias/edit/${savedItem.id}`);
      }
      setSaving(false);
    });
    */
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
            {...propsError('variableName')}
            variant="filled"
            required
            value={item?.variableName || ''}
            label={translate('name')}
            onChange={(event) => handleValueChange('variableName', event.target.value)}
          />

          <TextField
            fullWidth
            {...propsError('description')}
            variant="filled"
            value={item?.description || ''}
            label={translate('description')}
            onChange={(event) => handleValueChange('description', event.target.value)}
          />
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