import { LoadingButton } from '@mui/lab';
import { Box, Button, DialogActions, DialogContent, Grow, InputAdornment, LinearProgress, Stack } from '@mui/material';
import TextField from '@mui/material/TextField';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import getAccessToken from '../../getAccessToken';

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

  const handleSave = useCallback(async () => {
    setSaving(true);
    if (item.current === item.default) {
      await axios.delete(`/api/core/translations/${item.name}`, { headers: { authorization: `Bearer ${getAccessToken()}` } });
    } else {
      await axios.post(`/api/core/translations/${item.name}`, {
        name: item.name, value: item.current,
      }, { headers: { authorization: `Bearer ${getAccessToken()}` } });
    }
    enqueueSnackbar('Translation updated.', { variant: 'success' });
    navigate(`/settings/translations`);
  }, [item, enqueueSnackbar, navigate]);

  return(<>
    {loading && <LinearProgress />}
    <DialogContent dividers>
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
    <DialogActions>
      <Button sx={{ width: 150 }} href='/settings/translations'>Close</Button>
      <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving}>Save</LoadingButton>
    </DialogActions>
  </>);
};