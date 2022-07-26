import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, Dialog, DialogContent, Divider, Fade, FormControl, Grid, InputAdornment, InputLabel, MenuItem, Select, TextField,
} from '@mui/material';
import { defaultPermissions } from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import { cloneDeep } from 'lodash';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useEffect } from 'react';
import { useDebouncedValue } from 'rooks';

import type { CommandsInterface } from '~/pages/commands/botcommands';
import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';

export const BotCommandEdit: React.FC<{
  items: CommandsInterface[]
}> = (props) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const [ editDialog, setEditDialog ] = useState(false);
  const { permissions } = usePermissions();
  const [ item, setItem ] = useState<CommandsInterface | null>(null);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { id } = router.query;
  const { propsError, reset, setErrors } = useValidator();

  const handleValueChange = <T extends keyof CommandsInterface>(key: T, value: CommandsInterface[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  };

  const handleSetDefaultValue = useCallback(() => {
    if (item) {
      setItem({ ...item, command: item.defaultValue });
    }
  }, [ item ]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setItem(props.items?.find(o => o.id === id) ?? null);
      setLoading(false);
    }
    reset();
  }, [router, id, props.items, editDialog, reset]);

  const [itemDebounced] = useDebouncedValue(item, 100);
  useEffect(() => {
    if (!loading && editDialog) {
      /*getSocket('/systems/alias').emit('generic::validate', itemDebounced, (err) => {
        setErrors(err);
        if (err) {
          console.error(err);
        }
      });
      */
    }
  }, [itemDebounced, loading, editDialog, setErrors]);

  useEffect(() => {
    if (router.asPath.includes('botcommands/edit/')) {
      setEditDialog(true);
    }
  }, [router]);

  const handleClose = () => {
    setEditDialog(false);
    setTimeout(() => {
      router.push('/commands/botcommands');
    }, 200);
  };

  const handleSave = () => {
    setSaving(true);
    /*getSocket('/systems/alias').emit('generic::save', item, (err, savedItem) => {
      setErrors(err);
      if (err) {
        validate();
        console.error(err);
      } else {
        enqueueSnackbar('Alias saved.', { variant: 'success' });
        router.push(`/commands/botcommands/edit/${savedItem.id}`);
      }
      setSaving(false);
    });*/
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
          sx={{ '& .MuiTextField-root': { my: 1, width: '100%' } }}
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
            InputProps={{
              endAdornment:
                <Fade in={item?.command !== item?.defaultValue}>
                  <InputAdornment position="end" sx={{ transform: 'translateY(-7px)' }}>
                    <Button onClick={handleSetDefaultValue}>
                    set to default
                    </Button>
                  </InputAdornment>
                </Fade>,
            }}
            onChange={(event) => handleValueChange('command', event.target.value)}
          />

          <FormControl fullWidth variant="filled" >
            <InputLabel id="permission-select-label">{translate('permissions')}</InputLabel>
            <Select
              label={translate('permissions')}
              labelId="permission-select-label"
              onChange={(event) => handleValueChange('permission', event.target.value)}
              value={item?.permission || defaultPermissions.VIEWERS}
            >
              {permissions?.map(o => (<MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>))}
            </Select>
          </FormControl>
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
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving}>Save</LoadingButton>
        </Grid>
      </Grid>
    </Box>
  </Dialog>);
};