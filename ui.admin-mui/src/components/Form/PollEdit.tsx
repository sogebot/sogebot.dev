import { LoadingButton } from '@mui/lab';
import {
  Box, Button, Collapse, DialogContent, Divider, FormControl, Grid, InputLabel, LinearProgress, MenuItem, Select, Stack, TextField, Typography,
} from '@mui/material';
import { red } from '@mui/material/colors';
import { Poll } from '@sogebot/backend/dest/database/entity/poll';
import axios from 'axios';
import {
  capitalize,
  cloneDeep,
} from 'lodash';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect , useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import getAccessToken from '../../getAccessToken';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';

export const PollEdit: React.FC<{
  items: Poll[]
}> = (props) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { translate } = useTranslation();
  const [ item, setItem ] = useState<Poll>(new Poll());
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, showErrors, validate, haveErrors } = useValidator();

  const [ options, setOptions ] = useState(['', '', '', '', '']);

  const handleOptionsChange = useCallback((idx: number, value: string) => {
    setOptions(o => {
      const _o = [...o];
      _o[idx] = value;
      return _o;
    });
  }, []);

  useEffect(() => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update.options = options.filter(Boolean);
    setItem(update);
  }, [options, item]);

  const handleValueChange = useCallback(<T extends keyof Poll>(key: T, value: Poll[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  }, [ item ]);

  useEffect(() => {
    setLoading(true);
    setItem(new Poll());
    setOptions(['', '', '', '', '']);
    setLoading(false);
    reset();
  }, [id, props.items, reset]);

  useEffect(() => {
    if (!loading && item) {
      validate(Poll, item);
    }
  }, [item, loading, validate]);

  const handleClose = () => {
    navigate('/manage/polls');
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${JSON.parse(localStorage.server)}/api/systems/polls`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(() => {
        enqueueSnackbar('Poll saved.', { variant: 'success' });
        navigate(`/manage/polls/`);
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
            {...propsError('title')}
            fullWidth
            variant="filled"
            value={item?.title || ''}
            required
            label={capitalize(translate('title'))}
            onChange={(event) => handleValueChange('title', event.target.value)}
            sx={{ margin: 0 }}
          />

          <FormControl fullWidth sx={{ marginBottom: 2 }}>
            <InputLabel variant='filled' id="poll-options-label">{capitalize(translate('systems.polls.votingBy'))}</InputLabel>
            <Select
              variant='filled'
              labelId="poll-options-label"
              value={item?.type || 'normal'}
              label={capitalize(translate('systems.polls.votingBy'))}
              onChange={(event) => handleValueChange('type', event.target.value as any)}
            >
              {['tips', 'bits', 'normal', 'numbers'].map((o, idx) => <MenuItem key={o + idx} value={o}>{capitalize(translate('systems.polls.' + o))}</MenuItem>)}
            </Select>
          </FormControl>

          {options.map((o, idx) => <TextField
            key={idx}
            fullWidth
            variant="filled"
            value={o}
            label={`Answer ${idx + 1}`}
            onInput={propsError('options').onInput}
            error={propsError('options').error}
            onChange={(event) => handleOptionsChange(idx, event.target.value)}
          />)}

          {propsError('options').helperText && <Typography color={red[500]} sx={{ marginLeft: 2 }}>{propsError('options').helperText}</Typography>}
        </Box>
      </DialogContent>
    </Collapse>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item></Grid>
        <Grid item>
          <Stack spacing={1} direction='row'>
            <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
            <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  </>);
};