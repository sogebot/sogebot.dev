import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, DialogContent, Divider, Fade, Grid,
} from '@mui/material';
import { VariableInterface } from '@sogebot/backend/dest/database/entity/variable';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useEffect } from 'react';

import { getSocket } from '~/src/helpers/socket';
import { useValidator } from '~/src/hooks/useValidator';

/*
const newAlias = new CustomVariable();
newAlias.alias = '';
newAlias.permission = defaultPermissions.VIEWERS;
newAlias.command = '';
newAlias.enabled = true;
newAlias.visible = true;
newAlias.group = null;
*/

export const CustomVariablesEdit: React.FC<{
  id?: string
}> = ({ id }) => {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ item, setItem ] = useState<VariableInterface | null>(null);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { reset, haveErrors } = useValidator();

  /*
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
  */

  useEffect(() => {
    if (id) {
      setLoading(true);
      getSocket('/core/customvariables').emit('customvariables::list', (err, val) => {
        if (err) {
          enqueueSnackbar('Something went wrong during data loading.');
          router.push(`/registry/customvariables/?server=${JSON.parse(localStorage.server)}`);
        } else {
          setItem(val.find(o => o.id === id) || null);
        }
      });
      setLoading(false);
    } else {
      //setAlias(newAlias);
      setLoading(false);
    }
    reset();
  }, [router, id, enqueueSnackbar, reset]);

  /*
  useEffect(() => {
    if (!loading && editDialog && alias) {
      const toCheck = new Alias();
      merge(toCheck, alias);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [alias, loading, editDialog, setErrors]);
  */

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