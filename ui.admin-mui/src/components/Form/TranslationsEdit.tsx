import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, DialogContent, Divider, Fade, Grid, Grow, InputAdornment, Stack,
} from '@mui/material';
import TextField from '@mui/material/TextField';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect, useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getSocket } from '../../helpers/socket';

export const TranslationsEdit: React.FC<{
  items: { name: string; current: string; default: string; }[],
}> = (props) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ loading, setLoading ] = useState(true);
  const [ item, setItem ] = useState({
    name: '', current: '', default: '',
  });
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setLoading(true);
    if (id) {
      const it = props.items?.find(o => o.name === id) ?? {
        name: '', current: '', default: '',
      };
      setItem(it);
    } else {
      setItem({
        name: '', current: '', default: '',
      });
    }
    setLoading(false);
  }, [id, props.items]);

  const handleValueChange = useCallback(<T extends keyof { name: string; current: string; default: string; }>(key: T, value: { name: string; current: string; default: string; }[T]) => {
    setItem(i => ({
      ...i, [key]: value,
    }));
  }, []);

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
    navigate(`/settings/translations`);
  }, [item, enqueueSnackbar, navigate]);

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
    </Fade>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item></Grid>
        <Grid item>
          <Stack spacing={1} direction='row'>
            <Button sx={{ width: 150 }} href='/settings/translations'>Close</Button>
            <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving}>Save</LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  </>);
};