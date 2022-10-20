import { LoadingButton } from '@mui/lab';
import {
  Box, Button, Dialog, DialogContent, Divider, Grid, Grow, InputAdornment, Stack,
} from '@mui/material';
import TextField from '@mui/material/TextField';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { useEffect } from 'react';

import { getSocket } from '~/src/helpers/socket';

export const TranslationsEdit: React.FC<{
  item: { name: string; current: string; default: string; },
  open: boolean,
  onSave: () => void,
}> = (props) => {
  const router = useRouter();
  const [ item, setItem ] = useState(props.item);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setItem(props.item);
  }, [props]);

  const handleValueChange = useCallback(<T extends keyof { name: string; current: string; default: string; }>(key: T, value: { name: string; current: string; default: string; }[T]) => {
    setItem(i => ({
      ...i, [key]: value,
    }));
  }, []);

  const handleClose = () => {
    router.push('/settings/translations');
  };

  const handleSave = useCallback(() => {
    setSaving(true);
    if (item.current === item.default) {
      getSocket('/').emit('responses.revert', { name: item.name }, () => {
        return;
      });
    } else {
      getSocket('/').emit('responses.set', {
        name: item.name, value: item.current,
      });
    }
    enqueueSnackbar('Translation updated.', { variant: 'success' });
    router.push(`/settings/translations`);
  }, [item, enqueueSnackbar, router]);

  return(<Dialog
    open={props.open}
    fullWidth
    maxWidth='md'
  >
    <DialogContent>
      <Box
        component="form"
        sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
        noValidate
        autoComplete="off"
      >
        <Stack direction='row' alignItems={'center'}>
          <TextField
            fullWidth
            variant="filled"
            value={item.current}
            label={item.name}
            onChange={(event) => handleValueChange('current', event.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">
                <Grow in={item.default !== item.current}>
                  <Button onClick={() => handleValueChange('current', item.default)}>Revert</Button>
                </Grow>
              </InputAdornment>,
            }}
          />

        </Stack>
      </Box>
    </DialogContent>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item></Grid>
        <Grid item>
          <Stack spacing={1} direction='row'>
            <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
            <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving}>Save</LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  </Dialog>);
};