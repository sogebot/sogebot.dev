import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, DialogContent, Divider, Fade, Grid, TextField,
} from '@mui/material';
import { cloneDeep } from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { useEffect } from 'react';
import { Variable } from '~/../backend/dest/database/entity/variable';
import defaultPermissions from '~/../backend/src/helpers/permissions/defaultPermissions';

import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';

const createInitialItem = () => {
  return new Variable({
    variableName:      '',
    currentValue:      '',
    evalValue:         '',
    permission:        defaultPermissions.MODERATORS,
    responseType:      0,
    type:              'text',
    usableOptions:     [],
    description:       '',
    history:           [],
    urls:              [],
    runEveryTypeValue: 60000,
    runEvery:          60000,
    runAt:             new Date(0).toISOString(),
  });
};

export const CustomVariablesEdit: React.FC<{
  id?: string,
  onSave?: () => void,
}> = ({ id, onSave }) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator({
    mustBeDirty: true, translations: { variableName: translate('name') },
  });
  const [ item, setItem ] = useState<Variable>(createInitialItem());
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleValueChange = useCallback(<T extends keyof Variable>(key: T, value: Variable[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  }, [ item ]);

  useEffect(() => {
    setLoading(true);
    if (id) {
      getSocket('/core/customvariables').emit('customvariables::list', (err, val) => {
        if (err) {
          enqueueSnackbar('Something went wrong during data loading.');
          router.push(`/registry/customvariables/?server=${JSON.parse(localStorage.server)}`);
        } else {
          setItem(val.find(o => o.id === id) ?? createInitialItem());
        }
        setLoading(false);
      });
    } else {
      setItem(createInitialItem());
      setLoading(false);
    }
    reset();
  }, [router, id, enqueueSnackbar, reset]);

  useEffect(() => {
    if (!loading && item) {
      new Variable({ ...item })
        .validate()
        .then(() => setErrors(null))
        .catch(setErrors);
    }
    if (loading) {
      reset();
    }
  }, [item, loading, setErrors, reset]);

  const handleClose = () => {
    router.push(`/registry/customvariables/?server=${JSON.parse(localStorage.server)}`);
  };

  const handleSave = useCallback(() => {
    setSaving(true);
    getSocket('/core/customvariables').emit('customvariables::save', item, (err, cid) => {
      if (err || !cid) {
        validate(err as any);
      } else {
        enqueueSnackbar('Custom variable saved.', { variant: 'success' });

        // replace url and add cid to item
        setItem(() => {
          item.id = cid;
          return item;
        });
        const asPath = `/registry/customvariables/edit/${cid}?server=${JSON.parse(localStorage.server)}`;
        window.history.replaceState(null, '', asPath);
        if (onSave) {
          onSave();
        }
      }
      setSaving(false);
    });
  }, [ item, onSave, enqueueSnackbar, validate ]);

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
            label={translate('properties.variableName')}
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