import { LoadingButton } from '@mui/lab';
import { Box, Button, Collapse, DialogActions, DialogContent, Fade, FormControl, InputAdornment, InputLabel, LinearProgress, MenuItem, Select, TextField } from '@mui/material';
import { defaultPermissions } from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import { cloneDeep } from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getSocket } from '../../helpers/socket';
import { useBotCommandsExample } from '../../hooks/useBotCommandsExample';
import { useBotCommandsSpecificSettings } from '../../hooks/useBotCommandsSpecificSettings';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';
import { Commands, schema } from '../../classes/Commands';

export const BotCommandEdit: React.FC<{
  items: Commands[]
}> = (props) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { translate } = useTranslation();
  const { permissions } = usePermissions();
  const [ item, setItem ] = useState<Commands | null>(null);
  const [ cachedItem, setCachedItem ] = useState<Commands | null>(null);
  const [ loading1, setLoading ] = useState(true);
  const { loading: loading2, inputs, handleSave: handleBotCommandSpecificSettingsSave } = useBotCommandsSpecificSettings(cachedItem);
  const { loading: loading3, examples } = useBotCommandsExample(cachedItem);

  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, validate, haveErrors } = useValidator({ schema });

  const handleValueChange = <T extends keyof Commands>(key: T, value: Commands[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    if (key === 'permission' && value === '') {
      update.permission = null;
    } else {
      update[key] = value;
    }
    setItem(update);
  };

  const handleSetDefaultValue = useCallback(() => {
    if (item) {
      setItem({
        ...item, command: item.defaultValue,
      });
    }
  }, [ item ]);

  const loading = useMemo(() => {
    return loading1 || loading2 || loading3;
  }, [ loading1, loading2, loading3 ]);

  useEffect(() => {
    setLoading(true);
    if (id) {
      setItem(props.items?.find(o => o.id === id) ?? null);
      setCachedItem(props.items?.find(o => o.id === id) ?? null);
      setLoading(false);
    } else {
      setItem(null);
      setCachedItem(null);
    }
    reset();
  }, [id, props.items, reset]);

  useEffect(() => {
    if (!loading && item) {
      validate(item);
    }
  }, [item, loading]);

  const handleClose = () => {
    navigate('/commands/botcommands');
  };

  const handleSave = useCallback(async () => {
    if (!item) {
      return;
    }

    setSaving(true);
    await handleBotCommandSpecificSettingsSave();
    getSocket('/core/general').emit('generic::setCoreCommand', item, () => {
      enqueueSnackbar('Bot command saved.', { variant: 'success' });
      setSaving(false);
      navigate(`/commands/botcommands/edit/${item.id}`);
    });
  }, [item, enqueueSnackbar, navigate, handleBotCommandSpecificSettingsSave]);

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
            <InputLabel id="permission-select-label" shrink>{translate('permissions')}</InputLabel>
            <Select
              label={translate('permissions')}
              labelId="permission-select-label"
              displayEmpty
              onChange={(event) => handleValueChange('permission', event.target.value)}
              value={item?.permission === undefined ? defaultPermissions.VIEWERS : item.permission}
              renderValue={(selected) => {
                if (selected === null) {
                  return <em>-- unset --</em>;
                }

                return permissions?.find(o => o.id === selected)?.name;
              }}
            >
              <MenuItem value="">
                <em>-- unset --</em>
              </MenuItem>
              {permissions?.map(o => (<MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>))}
            </Select>
          </FormControl>
          {inputs}
          {examples}
        </Box>
      </DialogContent>
    </Collapse>
    <DialogActions>
      <Button onClick={handleClose}>Close</Button>
      <LoadingButton variant='contained' color='primary' onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
    </DialogActions>
  </>);
};