import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import {
  IsInt, IsNotEmpty, Min, validateOrReject,
} from 'class-validator';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect } from 'react';
import { useRefElement } from 'rooks';
import { v4 } from 'uuid';

import { getSocket } from '../../../helpers/socket';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';
import { useValidator } from '../../../hooks/useValidator';
import { ConfirmButton } from '../../Buttons/ConfirmButton';

class Settings {
  @IsNotEmpty()
  @Min(120, { message: '$constraint1' })
  @IsInt()
    accessTokenExpirationTime: number;

  @IsNotEmpty()
  @Min(400000, { message: '$constraint1' })
  @IsInt()
    refreshTokenExpirationTime: number;
}

const PageSettingsModulesCoreSocket: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const { settings, loading, refresh, save, saving, handleChange } = useSettings('/core/socket');
  const { translate } = useTranslation();

  useEffect(() => {
    refresh();
  }, [ refresh ]);

  const { enqueueSnackbar } = useSnackbar();
  const { propsError, setErrors, haveErrors } = useValidator({
    translations: {
      accessTokenExpirationTime:  translate('core.socket.settings.accessTokenExpirationTime'),
      refreshTokenExpirationTime: translate('core.socket.settings.refreshTokenExpirationTime'),
    },
  });

  useEffect(() => {
    if (!loading && settings) {
      const toCheck = new Settings();
      toCheck.accessTokenExpirationTime = Number(settings.connection.accessTokenExpirationTime[0]);
      toCheck.refreshTokenExpirationTime = Number(settings.connection.refreshTokenExpirationTime[0]);
      validateOrReject(toCheck, { always: true })
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [loading, settings, setErrors]);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar('Value copied to clipboard');
  }, [ enqueueSnackbar ]);

  const purgeAll = useCallback(() => {
    getSocket(`/core/socket`).emit('purgeAllConnections', () => {
      enqueueSnackbar('Tokens purged.', { variant: 'success' });
    });
  }, [ enqueueSnackbar ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (loading ? null : <Box ref={ref} id="socket">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.socket') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...propsError('accessTokenExpirationTime')}
          fullWidth
          variant="filled"
          required
          value={settings.connection.accessTokenExpirationTime[0]}
          label={translate('core.socket.settings.accessTokenExpirationTime')}
          onChange={(event) => handleChange('connection.accessTokenExpirationTime', event.target.value)}
        />
        <TextField
          {...propsError('refreshTokenExpirationTime')}
          fullWidth
          variant="filled"
          required
          value={settings.connection.refreshTokenExpirationTime[0]}
          label={translate('core.socket.settings.refreshTokenExpirationTime')}
          onChange={(event) => handleChange('connection.refreshTokenExpirationTime', event.target.value)}
        />
        <TextField
          fullWidth
          variant="filled"
          value={'*'.repeat(30) + settings.connection.socketToken[0].slice(30)}
          label={translate('core.socket.settings.socketToken.title')}
          InputProps={{
            endAdornment: <InputAdornment position="end">
              <Button variant='text' color="light" onClick={() => copy(settings.connection.socketToken[0])}>{ translate('systems.polls.copy') }</Button>
              <Button variant='text' color="error" onClick={() => handleChange('connection.socketToken', v4())}>{ translate('commons.generate') }</Button>
            </InputAdornment>,
          }}
        />
        <ConfirmButton variant='contained' color='error' handleOk={purgeAll}>{ translate('core.socket.settings.purgeAllConnections') }</ConfirmButton>
      </Stack>
    </Paper>
    }

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} type="submit" disabled={haveErrors} onClick={save}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesCoreSocket;
